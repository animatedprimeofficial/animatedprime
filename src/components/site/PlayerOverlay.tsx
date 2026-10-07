"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useApp } from "@/components/providers/AppProvider";
import SceneArt from "@/components/art/SceneArt";
import { RatingBadge } from "@/components/ui/Pill";

/**
 * A stand-in for the real player: the title's key art held full-bleed behind
 * glass, a scrubber that fills, and the studio details. It exists so the CTAs
 * resolve into something cinematic instead of a dead end.
 */
export default function PlayerOverlay() {
  const { movie, close } = usePlayer();
  const { setScrollLocked } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setScrollLocked("player", Boolean(movie));
    if (!movie) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [movie, close, setScrollLocked]);

  // Fake playback: a scrubber that crawls while the overlay is open.
  useGSAP(
    () => {
      if (!movie) return;
      const bar = barRef.current;
      if (!bar) return;
      const progress = { value: 0 };
      const duration = 26;
      const tween = gsap.to(progress, {
        value: 1,
        duration,
        ease: "none",
        onUpdate: () => {
          bar.style.transform = `scaleX(${progress.value})`;
          if (timeRef.current) {
            const seconds = Math.floor(progress.value * duration * 3);
            timeRef.current.textContent = `0:${String(seconds).padStart(2, "0")} / 26s preview`;
          }
        },
      });
      return () => tween.kill();
    },
    { dependencies: [movie?.id], scope: rootRef },
  );

  useGSAP(
    () => {
      if (!movie) return;
      const tl = gsap.timeline({ defaults: { ease: EASE.cinema } });
      tl.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
        .fromTo(
          "[data-player-panel]",
          { y: 60, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 1 },
          0.05,
        )
        .fromTo(
          "[data-player-art]",
          { scale: 1.14, opacity: 0 },
          { scale: 1.03, opacity: 1, duration: 1.6 },
          0,
        );
      return () => tl.kill();
    },
    { dependencies: [movie?.id], scope: rootRef, revertOnUpdate: true },
  );

  if (!movie) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${movie.title}`}
      className="fixed inset-0 z-[140] flex items-end justify-center overflow-hidden bg-ink-950/80 backdrop-blur-xl sm:items-center"
    >
      <div data-player-art className="pointer-events-none absolute inset-0 opacity-70">
        <SceneArt
          scene={movie.scene}
          palette={movie.palette}
          width={1600}
          height={900}
          animate
          seed={`${movie.id}-player`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40" />
      </div>

      <div
        data-player-panel
        className="relative m-3 w-full max-w-4xl rounded-[2rem] border border-white/10 bg-ink-900/70 p-6 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:m-6 sm:p-9"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow text-cyan">Now streaming · Preview</p>
            <h2 className="mt-3 display-md text-fog-100">{movie.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-fog-300/85">
              {movie.tagline} {movie.description.split(".")[0]}.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close preview"
            data-cursor="link"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-fog-300 transition-colors hover:border-white/30 hover:text-fog-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-fog-500">
          <RatingBadge value={movie.rating} />
          {movie.genre.map((genre) => (
            <span key={genre} className="rounded-full border border-white/10 px-3 py-1">
              {genre}
            </span>
          ))}
          <span>{movie.year}</span>
          <span>{movie.duration}</span>
          <span className="rounded border border-white/15 px-1.5 py-0.5 text-[0.65rem] tracking-wider">
            {movie.maturity}
          </span>
        </div>

        <div className="mt-8">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <span
              ref={barRef}
              className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-violet via-cyan to-rose"
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.7rem] font-semibold tracking-[0.2em] text-fog-700 uppercase">
            <span className="flex items-center gap-2 text-fog-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose" />
              Playing · {movie.quality[0]}
            </span>
            <span ref={timeRef}>0:00 / 26s preview</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-fog-700">
          {movie.studio} · AnimatedPrime Original. Press <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-fog-300">Esc</kbd> to close.
        </p>
      </div>
    </div>
  );
}
