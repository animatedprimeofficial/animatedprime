"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useIsDesktop, useReducedMotion } from "@/hooks/useMediaQuery";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import MagneticButton from "@/components/anim/MagneticButton";
import Artwork from "@/components/art/Artwork";
import { RatingBadge } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

const HeroAtmosphere = dynamic(() => import("@/components/three/HeroAtmosphere"), {
  ssr: false,
});

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} aria-hidden="true">
      <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Where every animated hero element sits before the entrance plays.
 *
 * Declared once so the pre-stage and the timeline cannot drift apart. Staging
 * these the moment the client hydrates is what lets the entrance begin the
 * instant the curtain lifts — without it the browser paints the finished hero
 * for a frame, then snaps everything back to the start of the animation.
 *
 * The backdrop is deliberately absent: it stays lit behind the curtain so the
 * reveal opens onto an already-lit room rather than a black frame.
 */
const HERO_OPENING = {
  "[data-hero-atmos]": { opacity: 0 },
  "[data-hero-pill]": { y: 18, opacity: 0 },
  "[data-hero-frame]": {
    clipPath: "inset(16% 14% 16% 14% round 2.6rem)",
    scale: 1.09,
    opacity: 0,
  },
  "[data-hero-sub]": { y: 24, opacity: 0 },
  "[data-hero-feature]": { y: 36, opacity: 0 },
  "[data-hero-chip]": { y: 28, opacity: 0, scale: 0.94 },
  "[data-hero-cta]": { y: 22, opacity: 0 },
  "[data-hero-cue]": { opacity: 0, y: 14 },
} as const;

export default function HeroSection() {
  const rootRef = useRef<HTMLElement>(null);
  const { introDone, scrollTo, ready } = useApp();
  const { open } = usePlayer();
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const { hero: movie } = useCatalog();

  /*
   * Pre-stage. Runs on first paint, before the curtain lifts, so the hero is
   * never seen in its finished state while the intro is still on screen. The
   * entrance below then plays from exactly this pose.
   */
  useGSAP(
    () => {
      if (reducedMotion) return;
      Object.entries(HERO_OPENING).forEach(([selector, state]) => {
        gsap.set(selector, state);
      });
    },
    { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: false },
  );

  /* Entrance — waits for the intro curtain so the two never talk over each other. */
  useGSAP(
    () => {
      if (reducedMotion || !introDone) return;
      const tl = gsap.timeline({ defaults: { ease: EASE.cinema } });

      tl.fromTo("[data-hero-bg]", { scale: 1.07 }, { scale: 1, duration: 1.5 }, 0)
        .fromTo(
          "[data-hero-atmos]",
          { opacity: 0 },
          { opacity: 0.85, duration: 1.8 },
          0.1,
        )
        .fromTo("[data-hero-pill]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.15)
        .fromTo(
          "[data-hero-frame]",
          { clipPath: "inset(16% 14% 16% 14% round 2.6rem)", scale: 1.09, opacity: 0 },
          {
            clipPath: "inset(0% 0% 0% 0% round 2.6rem)",
            scale: 1,
            opacity: 1,
            duration: 1.6,
            ease: "power3.inOut",
          },
          0.1,
        )
        .fromTo("[data-hero-sub]", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.55)
        .fromTo("[data-hero-feature]", { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.7)
        .fromTo(
          "[data-hero-chip]",
          { y: 28, opacity: 0, scale: 0.94 },
          { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.14 },
          0.95,
        )
        .fromTo(
          "[data-hero-cta]",
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, stagger: 0.1 },
          1.05,
        )
        .fromTo("[data-hero-cue]", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 1.25);

      return () => tl.kill();
    },
    { scope: rootRef, dependencies: [introDone, reducedMotion], revertOnUpdate: false },
  );

  /* Ambient life: chips float, the cue dot travels, frames drift on scroll. */
  useGSAP(
    () => {
      if (reducedMotion) return;

      gsap.utils.toArray<HTMLElement>("[data-hero-chip]").forEach((chip, i) => {
        gsap.to(chip, {
          y: i % 2 === 0 ? -14 : 12,
          duration: 4.5 + i,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.4,
        });
      });

      const dot = rootRef.current?.querySelector("[data-cue-dot]");
      if (dot) {
        gsap.fromTo(
          dot,
          { y: -14, opacity: 0 },
          { y: 46, opacity: 1, duration: 2.1, ease: "power2.inOut", repeat: -1, repeatDelay: 0.35 },
        );
      }

      if (!ready) return;
      const scroller = {
        trigger: rootRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      } as const;

      gsap.to("[data-hero-frame]", { yPercent: -9, ...{ scrollTrigger: scroller } });
      gsap.to("[data-hero-copy]", { yPercent: 14, opacity: 0.2, scrollTrigger: scroller });
      gsap.to("[data-hero-atmos]", { yPercent: 22, opacity: 0.15, scrollTrigger: scroller });
      gsap.to("[data-hero-art-inner]", {
        yPercent: 6,
        scale: 1.06,
        scrollTrigger: { ...scroller, scrub: 1.2 },
      });
    },
    { scope: rootRef, dependencies: [ready, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section
      ref={rootRef}
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-20 lg:pb-16"
    >
      {/* atmosphere layers */}
      <div data-hero-bg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -top-52 -left-40 h-[52rem] w-[52rem] rounded-full bg-violet/22 blur-[160px]" />
        <div className="absolute -top-10 right-[-12rem] h-[42rem] w-[42rem] rounded-full bg-cyan/14 blur-[150px]" />
        <div className="absolute bottom-[-10rem] left-1/4 h-[34rem] w-[34rem] rounded-full bg-rose/12 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(124,92,255,0.16),transparent_58%)]" />
      </div>

      {/* mobile composition: the key art becomes a cinematic banner behind the
          copy instead of stacking below it, so the first screen is the poster */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[62%] overflow-hidden lg:hidden">
        <div className="absolute inset-[-6%] scale-110">
          <Artwork
            movie={movie}
            variant="poster"
            width={900}
            height={1200}
            horizon={0.94}
            detail="simple"
            animate={!reducedMotion}
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/45 via-ink-950/10 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-tr from-violet/30 via-transparent to-cyan/15" />
      </div>

      {reducedMotion ? null : (
        <div data-hero-atmos aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden opacity-0 lg:block">
          <HeroAtmosphere lowPower={!isDesktop} />
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
          {/* copy */}
          <div data-hero-copy className="max-w-2xl">
            <div
              data-hero-pill
              className="glass inline-flex items-center gap-3 rounded-full px-4 py-2"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan opacity-70" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-cyan" />
              </span>
              <span className="eyebrow text-fog-300">
                <span className="hidden sm:inline">AnimatedPrime · </span>Now streaming
              </span>
            </div>

            <AnimatedHeading
              as="h1"
              id="hero-title"
              mode="active"
              active={introDone}
              text="Animation. *Reimagined.*"
              className="display-xl mt-6 text-fog-100 sm:mt-7"
              stagger={0.09}
              yPercent={130}
            />

            <p
              data-hero-sub
              className="mt-5 max-w-xl text-base leading-relaxed text-fog-300/85 sm:text-[1.0625rem]"
            >
              Your next animated adventure starts here. A hand-curated universe of
              animated films and anime — hand-drawn worlds streaming in 4K HDR, on
              every screen you own.
            </p>

            {/* featured title */}
            <div
              data-hero-feature
              className="mt-8 rounded-[2rem] border border-white/8 bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold tracking-[0.18em] text-fog-500 uppercase">
                <span className="text-cyan">Featured today</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-fog-700" />
                <RatingBadge value={movie.rating} className="px-2.5 py-0.5" />
                <span>{movie.year}</span>
                {movie.duration ? (
                  <>
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-fog-700" />
                    <span>{movie.duration}</span>
                  </>
                ) : null}
                {movie.maturity ? (
                  <span className="rounded border border-white/12 px-1.5 py-0.5 text-[0.6rem]">
                    {movie.maturity}
                  </span>
                ) : null}
              </div>

              <h2 className="display-md mt-3.5 text-fog-100">{movie.title}</h2>

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-fog-300/80 sm:line-clamp-3">
                {movie.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {movie.genre.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-fog-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span data-hero-cta className="inline-flex">
                  <MagneticButton onClick={() => open(movie)} cursor="play" variant="primary">
                    Watch in the app
                    <PlayGlyph />
                  </MagneticButton>
                </span>
                <span data-hero-cta className="inline-flex">
                  <MagneticButton
                    variant="outline"
                    cursor="link"
                    onClick={() => scrollTo("#featured")}
                  >
                    Explore Movies
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </MagneticButton>
                </span>
              </div>
            </div>

          </div>

          {/* key art (framed card on large screens only) */}
          <div className="relative mx-auto hidden w-full max-w-[34rem] lg:block lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[3.4rem] bg-gradient-to-br from-violet/35 via-transparent to-cyan/25 opacity-70 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 animate-[spin_46s_linear_infinite] rounded-[3.4rem] border border-dashed border-white/8"
            />

            <div
              data-hero-frame
              className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.6rem] border border-white/10 shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)] sm:aspect-[5/6]"
            >
              <div data-hero-art-inner className="absolute inset-0 scale-[1.02]">
                <Artwork
                  movie={movie}
                  variant="poster"
                  width={900}
                  height={1125}
                  detail="full"
                  animate
                  priority
                  sizes="46vw"
                />
              </div>

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,179,122,0.16),transparent_58%)]"
              />

              <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
                <span className="max-w-[62%] truncate rounded-full border border-white/15 bg-ink-950/45 px-3 py-1.5 text-[0.6rem] font-bold tracking-[0.2em] text-fog-300 uppercase backdrop-blur-md">
                  {movie.studio ?? "AnimatedPrime Select"}
                </span>
                <span className="rounded-full border border-white/15 bg-ink-950/45 px-3 py-1.5 text-[0.6rem] font-bold tracking-[0.2em] text-cyan uppercase backdrop-blur-md">
                  {movie.quality[0]}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="eyebrow text-fog-500">
                    {movie.source === "tmdb" ? "In the spotlight" : "This week's premiere"}
                  </p>
                  <p className="mt-2 font-display text-xl font-bold tracking-[-0.03em] text-fog-100 sm:text-2xl">
                    {movie.title}
                  </p>
                  <p className="mt-1 text-xs text-fog-500">
                    {[movie.studio, movie.genre.join(" · ")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(movie)}
                  data-cursor="play"
                  aria-label={`Watch ${movie.title} in the AnimatedPrime app`}
                  className="group grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/25 bg-white/12 text-fog-100 backdrop-blur-md transition-all duration-500 hover:scale-105 hover:bg-white/20"
                >
                  <span className="absolute h-14 w-14 animate-pulse-ring rounded-full border border-cyan/40" aria-hidden="true" />
                  <PlayGlyph className="h-5 w-5 translate-x-[1px]" />
                </button>
              </div>
            </div>

            {/* floating glass chips */}
            <div
              data-hero-chip
              className="glass absolute -left-3 top-[16%] hidden rounded-2xl px-4 py-3 sm:block lg:-left-8"
            >
              <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-fog-500 uppercase">
                Dolby Atmos
              </p>
              <p className="mt-1 font-display text-sm font-bold text-fog-100">
                Spatial audio
              </p>
            </div>

            <div
              data-hero-chip
              className="glass absolute -right-2 bottom-[30%] hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex lg:-right-6"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-amber/15 text-sm font-bold text-amber">
                {movie.rating.toFixed(1)}
              </span>
              <span>
                <span className="block text-[0.6rem] font-semibold tracking-[0.2em] text-fog-500 uppercase">
                  Critic score
                </span>                  <span className="block text-xs text-fog-300">
                    {movie.votes
                      ? `${movie.votes.toLocaleString("en-US")} reviews`
                      : "Audience favourite"}
                  </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* scroll cue — out of flow so the hero always lands on one screen */}
      <div
        data-hero-cue
        className="pointer-events-none absolute inset-x-5 bottom-7 z-10 hidden items-center gap-4 sm:inset-x-6 lg:inset-x-10 lg:flex"
      >
        <span aria-hidden="true" className="relative h-12 w-px overflow-hidden bg-white/10">
          <span data-cue-dot className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-cyan to-transparent" />
        </span>
        <span className="text-[0.62rem] font-semibold tracking-[0.3em] text-fog-700 uppercase">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
