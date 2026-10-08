"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { useDragScroll } from "@/hooks/useDragScroll";
import SectionHeader from "@/components/ui/SectionHeader";
import MovieCard from "@/components/site/MovieCard";
import { cn } from "@/lib/utils";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4", direction === "left" && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The anime shelf.
 *
 * AnimatedPrime carries Japanese animation as a first-class part of the
 * library, not a corner of it, so anime gets its own rail rather than being
 * scattered through the general racks where nobody would notice it. The
 * titles come from their own catalogue queries when live metadata is on.
 */
export default function AnimeSection() {
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const { ready } = useApp();
  const { anime } = useCatalog();
  const reducedMotion = useReducedMotion();
  const { ref: dragRef, dragging } = useDragScroll<HTMLDivElement>();

  const rail = useCallback(
    (node: HTMLDivElement | null) => {
      railRef.current = node;
      (dragRef as RefObject<HTMLDivElement | null>).current = node;
    },
    [dragRef],
  );

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = el.scrollWidth - el.clientWidth;
      const progress = max > 0 ? el.scrollLeft / max : 0;
      if (thumbRef.current) {
        thumbRef.current.style.transform = `translateX(${progress * 100}%)`;
      }
      if (counterRef.current) {
        counterRef.current.textContent = String(
          Math.min(anime.length, Math.round(progress * (anime.length - 1)) + 1),
        ).padStart(2, "0");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [anime.length]);

  const nudge = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-anime-card]");
    const step = card ? card.offsetWidth + 22 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  };

  useGSAP(
    () => {
      if (reducedMotion || !ready) return;
      gsap.fromTo(
        "[data-anime-card]",
        { yPercent: 12, opacity: 0, scale: 0.97 },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 1.15,
          ease: EASE.cinema,
          stagger: 0.07,
          scrollTrigger: { trigger: "[data-anime-rail]", start: "top 82%", once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [ready, reducedMotion], revertOnUpdate: true },
  );

  if (!anime.length) return null;

  return (
    <section id="anime" ref={rootRef} className="relative py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-8%] top-16 h-[32rem] w-[32rem] rounded-full bg-rose/12 blur-[150px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-6%] bottom-0 h-[28rem] w-[28rem] rounded-full bg-violet/14 blur-[140px]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Chapter 03 — Anime"
          title="Top *Anime*"
          description="Japan's most-loved animation, subtitled in the original language or fully dubbed. Anime is not a side shelf here — it sits on the same shelf as every film we carry."
          aside={
            <div className="flex items-center gap-4">
              <span className="hidden max-w-[13rem] text-sm leading-relaxed text-fog-500 xl:block">
                Two traditions, one library.
              </span>
              <span className="font-display text-sm font-bold tracking-[0.16em] text-fog-500">
                <span ref={counterRef} className="text-fog-100">
                  01
                </span>
                {" / "}
                {String(anime.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => nudge(-1)}
                  aria-label="Previous anime"
                  data-cursor="link"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-fog-300 transition-all duration-400 hover:border-white/30 hover:text-fog-100"
                >
                  <Chevron direction="left" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(1)}
                  aria-label="More anime"
                  data-cursor="link"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-fog-300 transition-all duration-400 hover:border-white/30 hover:text-fog-100"
                >
                  <Chevron direction="right" />
                </button>
              </div>
            </div>
          }
        />
      </div>

      <div data-anime-rail className="relative mt-12 lg:mt-14">
        <div
          ref={rail}
          data-cursor="drag"
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-8 sm:gap-6 sm:px-6 lg:gap-7 lg:px-10",
            dragging ? "[scroll-snap-type:none]" : "",
          )}
        >
          {anime.map((movie, index) => (
            <div
              key={movie.id}
              data-anime-card
              className={cn(
                "shrink-0 snap-start",
                index === 0
                  ? "w-[86vw] sm:w-[26rem] lg:w-[29rem]"
                  : "w-[72vw] sm:w-[20rem] lg:w-[22.5rem]",
              )}
            >
              <MovieCard movie={movie} animatedArt={index === 0} />
            </div>
          ))}
          <div aria-hidden="true" className="w-6 shrink-0 sm:w-16" />
        </div>

        <div className="mx-auto mt-2 flex max-w-[104rem] items-center gap-5 px-5 sm:px-6 lg:px-10">
          <div className="relative h-px flex-1 overflow-hidden bg-white/10">
            <span
              ref={thumbRef}
              className="absolute inset-y-0 left-0 w-1/3 -translate-x-0 bg-gradient-to-r from-rose via-violet to-transparent"
            />
          </div>
          <span className="text-[0.6rem] font-semibold tracking-[0.28em] text-fog-700 uppercase">
            Drag
          </span>
        </div>
      </div>
    </section>
  );
}
