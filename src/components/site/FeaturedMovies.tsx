"use client";

import { useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useIsDesktop, useReducedMotion } from "@/hooks/useMediaQuery";
import SectionHeader from "@/components/ui/SectionHeader";
import MovieCard from "@/components/site/MovieCard";
import { FEATURE_MOVIES } from "@/lib/movies";
import { cn } from "@/lib/utils";

/**
 * Featured Adventures.
 *
 * On desktop the section pins and vertical scroll drives the rail horizontally —
 * vertical-to-horizontal translation, not a carousel. On touch devices it
 * becomes a native snap rail, which is smoother than anything we could fake.
 */
export default function FeaturedMovies() {
  const rootRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const { ready } = useApp();
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const pinned = ready && isDesktop && !reducedMotion;

  useGSAP(
    () => {
      const panel = panelRef.current;
      const track = trackRef.current;
      if (!panel || !track || reducedMotion) return;

      gsap.fromTo(
        "[data-h-card]",
        { yPercent: 10, opacity: 0, scale: 0.96 },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 1.1,
          ease: EASE.cinema,
          stagger: 0.09,
          scrollTrigger: { trigger: panel, start: "top 78%", once: true },
        },
      );

      if (!pinned) return;

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          start: "top top",
          end: () => `+=${distance() + window.innerHeight * 0.4}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: rootRef, dependencies: [pinned, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section id="featured" ref={rootRef} className="relative">
      <div
        ref={panelRef}
        className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-1/4 h-[36rem] w-[36rem] rounded-full bg-violet/12 blur-[150px]"
        />

        <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Chapter 01 — Featured"
            title="Featured *Adventures*"
            description="Six worlds we cannot stop thinking about. Every title is hand-picked, restored frame by frame, and streamable in the highest quality your screen can hold."
            aside={
              <div className="hidden w-56 flex-col gap-3 lg:flex">
                <div className="h-px w-full bg-white/10">
                  <span
                    ref={barRef}
                    className="block h-px w-full origin-left scale-x-0 bg-gradient-to-r from-violet to-cyan"
                  />
                </div>
                <div className="flex items-center justify-between text-[0.62rem] font-semibold tracking-[0.24em] text-fog-700 uppercase">
                  <span>Scroll →</span>
                  <span>{FEATURE_MOVIES.length} titles</span>
                </div>
              </div>
            }
          />
        </div>

        <div className="relative mt-12 lg:mt-16">
          <div
            ref={trackRef}
            data-cursor={pinned ? undefined : "drag"}
            className={cn(
              "flex gap-5 px-5 pb-2 sm:gap-6 sm:px-6 lg:gap-7 lg:px-10",
              pinned ? "w-max will-change-transform" : "no-scrollbar snap-x snap-mandatory overflow-x-auto",
            )}
          >
            {FEATURE_MOVIES.map((movie, index) => (
              <div
                key={movie.id}
                data-h-card
                className={cn(
                  "shrink-0 snap-center",
                  index === 0
                    ? "w-[80vw] sm:w-[23rem] lg:w-[27rem]"
                    : "w-[74vw] sm:w-[21rem] lg:w-[24rem]",
                )}
              >
                <MovieCard movie={movie} animatedArt={index === 0} />
              </div>
            ))}
            <div aria-hidden="true" className="w-6 shrink-0 sm:w-16" />
          </div>
        </div>

        <p className="mt-10 px-5 text-center text-[0.62rem] font-semibold tracking-[0.28em] text-fog-700 uppercase sm:px-6 lg:px-10 lg:text-left">
          {pinned ? "Keep scrolling — the reel keeps moving" : "Swipe to browse the reel"}
        </p>
      </div>
    </section>
  );
}
