"use client";

import { useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useExplorer } from "@/components/providers/ExplorerProvider";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import SectionHeader from "@/components/ui/SectionHeader";
import HoverParallax from "@/components/anim/HoverParallax";
import SceneArt from "@/components/art/SceneArt";
import { GENRES, genreCount } from "@/lib/movies";
import { cn } from "@/lib/utils";

/**
 * Genres as destination art rather than buttons. Each card carries its own
 * scene, drifts on pointer, and hands the genre straight to the explorer.
 */
export default function GenreSection() {
  const rootRef = useRef<HTMLElement>(null);
  const { ready, scrollTo } = useApp();
  const { setGenre, setQuery } = useExplorer();
  const reducedMotion = useReducedMotion();

  const pick = (genre: string) => {
    setGenre(genre);
    setQuery("");
    scrollTo("#explore");
  };

  useGSAP(
    () => {
      if (!ready || reducedMotion) return;
      gsap.fromTo(
        "[data-genre-card]",
        { yPercent: 14, opacity: 0, scale: 0.97 },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 1.15,
          ease: EASE.cinema,
          stagger: { each: 0.07, from: "start" },
          scrollTrigger: { trigger: "[data-genre-grid]", start: "top 84%", once: true },
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-genre-offset]").forEach((card) => {
        const offset = Number(card.dataset.genreOffset ?? 0);
        if (!offset) return;
        gsap.fromTo(
          card,
          { y: offset },
          {
            y: -offset * 0.55,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: rootRef, dependencies: [ready, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section id="genres" ref={rootRef} className="relative py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-0 h-[30rem] w-[30rem] rounded-full bg-violet/12 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Chapter 03 — Genres"
          title="Pick a *Doorway*"
          description="Eight moods, eight worlds. Choose the feeling you are after and we will open onto the right shelf."
          aside={
            <p className="max-w-xs text-sm leading-relaxed text-fog-500">
              Every genre keeps its own curated shelf — hand-ordered, never algorithmic filler.
            </p>
          }
        />

        <div
          data-genre-grid
          className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:mt-16 lg:grid-cols-4"
        >
          {GENRES.map((genre, index) => (
            <div
              key={genre.name}
              data-genre-card
              {...(index % 2 === 1 ? { "data-genre-offset": index % 3 === 1 ? 34 : 54 } : {})}
              className={cn("group", index % 2 === 1 && "lg:mt-14")}
            >
              <button
                type="button"
                onClick={() => pick(genre.name)}
                data-cursor="view"
                aria-label={`Explore ${genre.name} titles`}
                className="block w-full text-left"
              >
                <HoverParallax
                  depth={22}
                  className="relative aspect-[4/5] w-full rounded-[1.6rem] border border-white/8 bg-ink-850 transition-[border-color,box-shadow] duration-500 group-hover:border-white/20 group-hover:shadow-[0_40px_90px_-40px_rgba(124,92,255,0.5)]"
                >
                  <div data-parallax-layer className="absolute inset-[-6%]">
                    <SceneArt
                      scene={genre.scene}
                      palette={genre.palette}
                      width={820}
                      height={1024}
                      detail="simple"
                      seed={`genre-${genre.name}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/5"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-violet/45 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  />

                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
                    <span className="text-[0.6rem] font-semibold tracking-[0.24em] text-cyan uppercase">
                      {String(genreCount(genre.name)).padStart(2, "0")} titles
                    </span>
                    <span className="font-display text-xl font-bold tracking-[-0.03em] text-fog-100 sm:text-[1.4rem]">
                      {genre.name}
                    </span>
                    <span className="translate-y-1 text-[0.72rem] leading-relaxed text-fog-300/0 transition-all duration-600 group-hover:translate-y-0 group-hover:text-fog-300/85">
                      {genre.blurb}
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-4 grid h-9 w-9 -translate-y-1 place-items-center rounded-full border border-white/15 bg-ink-950/45 text-fog-300 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 17 17 7m0 0h-7m7 0v7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </HoverParallax>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
