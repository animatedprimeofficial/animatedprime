"use client";

import { useEffect, useState } from "react";
import MagneticButton from "@/components/anim/MagneticButton";
import ApkDownloadDialog from "@/components/site/ApkDownloadDialog";
import { useRelease } from "@/hooks/useRelease";
import type { AppRelease } from "@/lib/release";
import { cn } from "@/lib/utils";

export interface DownloadButtonProps {
  release: AppRelease;
  variant?: "primary" | "outline" | "soft";
  size?: "md" | "lg";
  className?: string;
  /** "download" is platform-aware, "details" always reads as product info */
  mode?: "download" | "details";
  label?: string;
}

type Platform = "android" | "ios" | "desktop";

const INSTALLED_KEY = "animatedprime:android-version";

export default function DownloadButton({
  release: seeded,
  variant = "primary",
  size = "lg",
  className,
  mode = "download",
  label,
}: DownloadButtonProps) {
  const { release } = useRelease(seeded);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isAndroid = /android/i.test(ua);
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setPlatform(isAndroid ? "android" : isIOS ? "ios" : "desktop");
    try {
      setInstalledVersion(window.localStorage.getItem(INSTALLED_KEY));
    } catch {
      setInstalledVersion(null);
    }
  }, []);

  useEffect(() => {
    const onVersion = () => {
      try {
        setInstalledVersion(window.localStorage.getItem(INSTALLED_KEY));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("animatedprime:version", onVersion);
    return () => window.removeEventListener("animatedprime:version", onVersion);
  }, []);

  const current = installedVersion === release.version;

  const text =
    label ??
    (mode === "details"
      ? `What's in v${release.version}`
      : !release.available
        ? platform === "ios"
          ? "Get the iOS app"
          : "Get the mobile app"
        : platform === "ios"
          ? "Join the iOS waitlist"
          : current
            ? "Download again"
            : platform === "android"
              ? "Download the APK"
              : "Get it for Android");

  return (
    <>
      <MagneticButton
        variant={variant}
        size={size}
        cursor="play"
        onClick={() => setOpen(true)}
        className={className}
      >
        <span className={cn("flex items-center gap-2.5")}>
          {platform === "ios" ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 1.9-1.1 2.6-2.2c.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.4-3.7ZM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M17.6 8.4h-3.9V6.6c0-1.1.9-2 2-2h.6V2.9c-.3 0-.7-.1-1.1-.1-1.9 0-3.3 1.4-3.3 3.3v2.3H7.6v2.8h4.3v8.6h3.9v-8.6h3.6l.6-2.8Z" />
            </svg>
          )}
          {text}
        </span>
        {current && release.available ? (
          <span className="ml-1 rounded-full border border-mint/40 px-2 py-0.5 text-[0.58rem] font-bold tracking-wide text-mint">
            v{release.version} downloaded
          </span>
        ) : null}
      </MagneticButton>

      <ApkDownloadDialog
        release={release}
        open={open}
        onClose={() => setOpen(false)}
        platform={platform}
      />
    </>
  );
}
