"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useApp } from "@/components/providers/AppProvider";
import { useWatchlist } from "@/components/providers/WatchlistProvider";
import Artwork from "@/components/art/Artwork";
import DownloadButton from "@/components/site/DownloadButton";
import { RatingBadge } from "@/components/ui/Pill";
import type { AppRelease } from "@/lib/release";
import { cn } from "@/lib/utils";

/**
 * Where playback intent lands.
 *
 * AnimatedPrime is a phone-first product: there is no in-browser player to
 * pretend with, so tapping a title tells the truth instead — here is the film,
 * here is what it looks like, and here is the app that plays it. The dialog
 * keeps the cinematic presentation (full-bleed key art, real metadata) so the
 * hand-off reads as a product decision rather than a dead end.
 */
export default function PlayerOverlay({ release }: { release: AppRelease }) {
  const { movie, close } = usePlayer();
  const { setScrollLocked } = useApp();
  const watchlist = useWatchlist();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setScrollLocked("watch-prompt", Boolean(movie));
    if (!movie) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 140);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [movie, close, setScrollLocked]);

  useGSAP(
    () => {
      if (!movie) return;
      const tl = gsap.timeline({ defaults: { ease: EASE.cinema } });
      tl.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
        .fromTo(
          panelRef.current,
          { y: 56, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 1 },
          0.05,
        )
        .fromTo(
          "[data-prompt-row]",
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 },
          0.3,
        )
        .fromTo(
          "[data-prompt-art]",
          { scale: 1.14, opacity: 0 },
          { scale: 1.03, opacity: 1, duration: 1.6 },
          0,
        );
      return () => tl.kill();
    },
    { dependencies: [movie?.id], scope: rootRef, revertOnUpdate: true },
  );

  if (!movie) return null;

  const saved = watchlist.has(movie.id);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="watch-prompt-title"
      className="fixed inset-0 z-[140] flex items-end justify-center overflow-y-auto bg-ink-950/80 backdrop-blur-xl sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div data-prompt-art className="pointer-events-none fixed inset-0 opacity-60">
        <Artwork
          movie={movie}
          variant="backdrop"
          width={1600}
          height={900}
          animate
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/45" />
      </div>

      <div
        ref={panelRef}
        className="relative m-3 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900/70 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:m-6"
      >
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
          {/* poster */}
          <div className="relative hidden w-[9.5rem] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:block">
            <div className="aspect-[2/3] w-full">
              <Artwork
                movie={movie}
                variant="poster"
                width={480}
                height={720}
                sizes="9.5rem"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="eyebrow text-cyan">Streaming in the app</p>
                <h2
                  id="watch-prompt-title"
                  className="display-md mt-3 truncate text-fog-100"
                >
                  {movie.title}
                </h2>
                {movie.originalTitle ? (
                  <p className="mt-1.5 truncate text-sm text-fog-500">{movie.originalTitle}</p>
                ) : null}
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close"
                data-cursor="link"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-fog-300 transition-colors hover:border-white/30 hover:text-fog-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div
              data-prompt-row
              className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-fog-500"
            >
              <RatingBadge value={movie.rating} />
              <span>{movie.year}</span>
              {movie.duration ? <span>· {movie.duration}</span> : null}
              {movie.maturity ? (
                <span className="rounded border border-white/15 px-1.5 py-0.5 text-[0.65rem] tracking-wider">
                  {movie.maturity}
                </span>
              ) : null}
            </div>

            <div data-prompt-row className="mt-3 flex flex-wrap gap-1.5">
              {[movie.studio, ...movie.genre].filter(Boolean).map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-fog-300"
                >
                  {label}
                </span>
              ))}
            </div>

            <p data-prompt-row className="mt-5 text-sm leading-relaxed text-fog-300/85">
              {movie.description}
            </p>

            {/* the honest hand-off */}
            <div
              data-prompt-row
              className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <p className="flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.2em] text-fog-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
                Playback lives in the AnimatedPrime app
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-fog-300/85">
                Install it once and {movie.title} streams in {movie.quality.join(", ")} — with
                offline downloads, family profiles and resume across phone, tablet and TV.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <DownloadButton release={release} mode="download" size="md" />
                <button
                  type="button"
                  onClick={() => watchlist.toggle(movie.id)}
                  aria-pressed={saved}
                  data-cursor="link"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors duration-300",
                    saved
                      ? "border-cyan/50 bg-cyan/15 text-cyan"
                      : "border-white/16 bg-white/[0.03] text-fog-100 hover:border-white/30",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill={saved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
                  </svg>
                  {saved ? "In your watchlist" : "Add to watchlist"}
                </button>
              </div>
            </div>

            <p data-prompt-row className="mt-5 text-xs text-fog-700">
              {movie.source === "tmdb"
                ? "Metadata and artwork from TMDB. "
                : ""}
              Already installed? Open AnimatedPrime on your phone — press{" "}
              <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-fog-300">Esc</kbd>{" "}
              to close this.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
