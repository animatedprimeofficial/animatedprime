"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useMounted, useReducedMotion } from "@/hooks/useMediaQuery";
import { requestReleaseRefresh } from "@/hooks/useRelease";
import { LogoMark } from "@/components/ui/Logo";
import type { AppRelease } from "@/lib/release";
import { cn } from "@/lib/utils";

type Phase =
  | "idle"
  | "preparing"
  | "transferring"
  | "done"
  | "error"
  | "notify"
  | "notified";

export interface ApkDownloadDialogProps {
  release: AppRelease;
  open: boolean;
  onClose: () => void;
  platform: "android" | "ios" | "desktop";
}

/**
 * Records that this device now holds a build, and tells every mounted
 * `DownloadButton` so it can switch to a "Download again" affordance without
 * waiting for a reload.
 */
function rememberInstalled(version: string) {
  try {
    window.localStorage.setItem("animatedprime:android-version", version);
  } catch {
    /* private mode — the download still worked */
  }
  window.dispatchEvent(new Event("animatedprime:version"));
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
      <p className="text-[0.55rem] font-semibold tracking-[0.22em] text-fog-700 uppercase">{label}</p>
      <p className={cn("mt-1 text-[0.8rem] text-fog-100", mono && "font-mono text-[0.68rem] break-all")}>
        {value}
      </p>
    </div>
  );
}

const STEPS = [
  {
    title: "Download the APK",
    body: "Tap the button below. The signed build lands in your Downloads folder.",
  },
  {
    title: "Allow this source",
    body: "When Android asks, allow your browser to install unknown apps. It is a one-time toggle.",
  },
  {
    title: "Open and sign in",
    body: "Install, open AnimatedPrime and sign in — your watchlist and downloads come with you.",
  },
];

export default function ApkDownloadDialog({
  release,
  open,
  onClose,
  platform,
}: ApkDownloadDialogProps) {
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();
  const { setScrollLocked } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const [phase, setPhase] = useState<Phase>(release.available ? "idle" : "notify");
  const [progress, setProgress] = useState({ received: 0, total: release.sizeBytes ?? 0 });
  const [email, setEmail] = useState("");
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const percent = progress.total > 0 ? Math.min(100, (progress.received / progress.total) * 100) : 0;

  const releasedLabel = useMemo(() => {
    if (!release.releasedAt) return "—";
    const date = new Date(release.releasedAt);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [release.releasedAt]);

  const close = useCallback(() => {
    if (phase === "preparing" || phase === "transferring") return;
    onClose();
  }, [onClose, phase]);

  useEffect(() => {
    setScrollLocked("apk-dialog", open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const focusables = cardRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => primaryRef.current?.focus(), 120);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, close, setScrollLocked]);

  useEffect(() => {
    if (open) return;
    setPhase(release.available ? "idle" : "notify");
    setProgress({ received: 0, total: release.sizeBytes ?? 0 });
    setNotifyError(null);
    setCopied(false);
  }, [open, release.available, release.sizeBytes]);

  useGSAP(
    () => {
      if (!open || reducedMotion) return;
      const tl = gsap.timeline({ defaults: { ease: EASE.cinema } });
      tl.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(
          cardRef.current,
          { y: 48, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.85 },
          0.03,
        )
        .fromTo(
          "[data-dialog-row]",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.06 },
          0.18,
        );
      return () => tl.kill();
    },
    { dependencies: [open, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  const startDownload = useCallback(async () => {
    if (!release.downloadUrl) return;

    if (release.external) {
      setPhase("preparing");
      window.setTimeout(() => {
        window.open(release.downloadUrl as string, "_blank", "noopener,noreferrer");
        rememberInstalled(release.version);
        setPhase("done");
      }, 550);
      return;
    }

    setPhase("preparing");
    try {
      const response = await fetch(release.downloadUrl, { cache: "no-store" });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const total = Number(response.headers.get("content-length")) || release.sizeBytes || 0;
      setProgress({ received: 0, total });
      setPhase("transferring");

      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value as unknown as BlobPart);
          received += value.byteLength;
          setProgress({ received, total });
        }
      }

      const blob = new Blob(chunks, { type: "application/vnd.android.package-archive" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = release.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      rememberInstalled(release.version);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }, [release]);

  const submitNotify = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setNotifyError(null);
      try {
        const response = await fetch("/api/notify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, platform }),
        });
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          setNotifyError(payload.error ?? "Something went wrong. Please try again.");
          return;
        }
        setPhase("notified");
      } catch {
        setNotifyError("We could not reach the server. Please try again.");
      }
    },
    [email, platform],
  );

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    try {
      // Drops the server-side cache, then tells every mounted download button
      // to re-read the manifest — so a new build lands everywhere at once.
      await fetch("/api/release?refresh=1", { cache: "no-store" });
      requestReleaseRefresh();
    } catch {
      /* ignore — the button is a convenience, not a dependency */
    }
    window.setTimeout(() => setChecking(false), 900);
  }, []);

  const copyChecksum = useCallback(async () => {
    if (!release.sha256) return;
    try {
      await navigator.clipboard.writeText(release.sha256);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }, [release.sha256]);

  if (!mounted || !open) return null;

  const busy = phase === "preparing" || phase === "transferring";
  const primaryLabel =
    phase === "transferring"
      ? `Downloading… ${percent.toFixed(0)}%`
      : phase === "preparing"
        ? "Preparing signed build…"
        : release.source === "external"
          ? "Open the release page"
          : `Download APK${release.sizeLabel ? ` · ${release.sizeLabel}` : ""}`;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-dialog-title"
      className="fixed inset-0 z-[150] flex items-end justify-center overflow-y-auto bg-ink-950/80 p-3 backdrop-blur-xl sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-2xl rounded-[2rem] border border-white/10 bg-ink-900/85 p-6 shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-8"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-violet/25 blur-[90px]"
        />

        <div className="relative flex items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <LogoMark className="h-6 w-6" animated={false} />
            </span>
            <div>
              <p className="eyebrow text-cyan">
                {platform === "ios" ? "iOS build" : "Android build"}
              </p>
              <h2 id="apk-dialog-title" className="mt-2 font-display text-xl font-bold tracking-[-0.03em] text-fog-100 sm:text-2xl">
                {release.available
                  ? `AnimatedPrime for Android ${release.version}`
                  : "The Android build is in final review"}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-fog-300/80">
                {release.available
                  ? "Direct install, no store account needed. Offline downloads, family profiles and 4K HDR on supported screens are all included."
                  : "Get a one-time email the moment it clears review — nothing else, ever. iOS follows shortly after."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            data-cursor="link"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-fog-300 transition-colors hover:border-white/30 hover:text-fog-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* release facts */}
        <div data-dialog-row className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Fact label="Version" value={`v${release.version}`} />
          <Fact label="Size" value={release.sizeLabel ?? "See release"} />
          <Fact label="Channel" value={release.channel === "stable" ? "Stable" : "Beta"} />
          <Fact label="Updated" value={releasedLabel} />
        </div>

        <div data-dialog-row className="relative mt-2.5 grid gap-2.5 sm:grid-cols-2">
          <Fact label="Requires" value={release.minAndroid} />
          <Fact label="Optimised for" value={release.targetAndroid} />
        </div>

        {release.sha256 ? (
          <div data-dialog-row className="relative mt-2.5 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[0.55rem] font-semibold tracking-[0.22em] text-fog-700 uppercase">
                SHA-256 · verify after download
              </span>
              <span className="mt-1 block truncate font-mono text-[0.68rem] text-fog-300">
                {release.sha256}
              </span>
            </span>
            <button
              type="button"
              onClick={copyChecksum}
              data-cursor="link"
              className="shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-[0.62rem] font-semibold tracking-wide text-fog-300 transition-colors hover:border-white/30 hover:text-fog-100"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}

        {/* progress / actions */}
        {release.available ? (
          <div data-dialog-row className="relative mt-6">
            {busy || phase === "done" ? (
              <div className="mb-4">
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet via-cyan to-rose transition-[width] duration-300",
                      phase === "preparing" && "w-1/4 animate-pulse",
                    )}
                    style={phase === "transferring" ? { width: `${percent}%` } : undefined}
                  />
                </div>
                <p className="mt-2 text-[0.65rem] font-semibold tracking-[0.18em] text-fog-700 uppercase">
                  {phase === "done"
                    ? "Download started — check your notifications"
                    : progress.total > 0
                      ? `${(progress.received / 1_048_576).toFixed(1)} MB of ${(progress.total / 1_048_576).toFixed(1)} MB`
                      : "Connecting to the release server"}
                </p>
              </div>
            ) : null}

            {phase === "error" ? (
              <p className="mb-4 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-sm text-fog-100">
                We could not reach the build right now. Try again, or leave your email and we
                will send you a link.
              </p>
            ) : null}

            {phase === "done" ? (
              <p className="mb-4 rounded-xl border border-mint/25 bg-mint/10 px-3.5 py-2.5 text-sm text-fog-100">
                The build is verified by checksum {release.sha256 ? "above" : "on the release page"}.
                Android may ask you to confirm the install — accept once to continue.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                ref={primaryRef}
                type="button"
                onClick={startDownload}
                disabled={busy}
                data-cursor="play"
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet via-[#8f6bff] to-cyan px-7 py-4 text-sm font-bold text-ink-950 transition-all duration-400",
                  busy ? "cursor-wait opacity-80" : "hover:shadow-[0_22px_70px_-14px_rgba(70,229,255,0.65)]",
                )}
              >
                {busy ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19.5h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {primaryLabel}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPhase("notify");
                  setNotifyError(null);
                }}
                data-cursor="link"
                className="rounded-full border border-white/12 px-6 py-4 text-sm font-semibold text-fog-300 transition-colors hover:border-white/30 hover:text-fog-100"
              >
                Email me a link
              </button>
            </div>
          </div>
        ) : null}

        {/* notify-me form */}
        {phase === "notify" || phase === "notified" ? (
          <div data-dialog-row className="relative mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            {phase === "notified" ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-fog-100">You are on the list</p>
                  <p className="mt-1 text-sm text-fog-300/80">
                    We will email {email || "you"} the moment the signed APK is live. One email,
                    no marketing.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={submitNotify} className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-fog-100" htmlFor="apk-notify-email">
                  Get the download link by email
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="apk-notify-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 rounded-full border border-white/12 bg-ink-950/60 px-5 py-3.5 text-sm text-fog-100 outline-none transition-colors placeholder:text-fog-700 focus:border-cyan/60"
                  />
                  <button
                    type="submit"
                    data-cursor="link"
                    className="rounded-full bg-gradient-to-r from-violet to-cyan px-7 py-3.5 text-sm font-bold text-ink-950"
                  >
                    Notify me
                  </button>
                </div>
                {notifyError ? <p className="text-xs text-rose">{notifyError}</p> : null}
                <p className="text-[0.68rem] text-fog-700">
                  Used only to send this link. No newsletter, no sharing.
                </p>
              </form>
            )}
          </div>
        ) : null}

        {/* install steps */}
        {release.available && phase !== "notify" && phase !== "notified" ? (
          <ol data-dialog-row className="relative mt-6 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-violet/20 text-[0.62rem] font-bold text-violet-soft">
                  {index + 1}
                </span>
                <p className="mt-3 text-[0.8rem] font-semibold text-fog-100">{step.title}</p>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-fog-500">{step.body}</p>
              </li>
            ))}
          </ol>
        ) : null}

        {/* trust + footer row */}
        <div className="relative mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.68rem] text-fog-700">
            {release.source === "local"
              ? "Served from our own release server · signed build"
              : release.source === "external"
                ? "Hosted on our release channel · signed build"
                : "Android 9+ · signing keys rotated every release"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={checkForUpdates}
              data-cursor="link"
              className="text-[0.68rem] font-semibold tracking-wide text-fog-500 underline decoration-white/20 underline-offset-4 transition-colors hover:text-fog-100"
            >
              {checking ? "Checking…" : "Check for updates"}
            </button>
            <span className="text-[0.68rem] text-fog-700">·</span>
            <span className="text-[0.68rem] text-fog-500">iOS coming soon</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
