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

export default function TrendingMovies() {
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const { ready } = useApp();
  const { trending } = useCatalog();
  const reducedMotion = useReducedMotion();
  const { ref: dragRef, dragging } = useDragScroll<HTMLDivElement>();

  const rail = useCallback(
    (node: HTMLDivElement | null) => {
      railRef.current = node;
      (dragRef as RefObject<HTMLDivElement | null>).current = node;
    },
    [dragRef],
  );

  // Rail progress — written directly to the DOM, never through React state.
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
          Math.min(trending.length, Math.round(progress * (trending.length - 1)) + 1),
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
  }, [trending.length]);

  const nudge = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-t-card]");
    const step = card ? card.offsetWidth + 22 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  };

  useGSAP(
    () => {
      if (reducedMotion || !ready) return;
      gsap.fromTo(
        "[data-t-card]",
        { yPercent: 12, opacity: 0, scale: 0.97 },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 1.15,
          ease: EASE.cinema,
          stagger: 0.075,
          scrollTrigger: { trigger: "[data-t-rail]", start: "top 82%", once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [ready, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section id="trending" ref={rootRef} className="relative py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-10 h-[34rem] w-[34rem] rounded-full bg-cyan/10 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Chapter 02 — Trending"
          title="Trending *Now*"
          description="What the whole family is watching this week, ranked. The rail moves with your hand — drag it, flick it, or let it drift."
          aside={
            <div className="flex items-center gap-4">
              <span className="font-display text-sm font-bold tracking-[0.16em] text-fog-500">
                <span ref={counterRef} className="text-fog-100">
                  01
                </span>
                {" / "}
                {String(trending.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => nudge(-1)}
                  aria-label="Previous titles"
                  data-cursor="link"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-fog-300 transition-all duration-400 hover:border-white/30 hover:text-fog-100"
                >
                  <Chevron direction="left" />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(1)}
                  aria-label="More titles"
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

      <div data-t-rail className="relative mt-12 lg:mt-14">
        <div
          ref={rail}
          data-cursor="drag"
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-8 sm:gap-6 sm:px-6 lg:gap-7 lg:px-10",
            dragging ? "[scroll-snap-type:none]" : "",
          )}
        >
          {trending.map((movie, index) => (
            <div
              key={movie.id}
              data-t-card
              className={cn(
                "shrink-0 snap-start",
                index === 0
                  ? "w-[86vw] sm:w-[29rem] lg:w-[33rem]"
                  : "w-[72vw] sm:w-[20rem] lg:w-[22.5rem]",
              )}
            >
              <MovieCard
                movie={movie}
                variant="rank"
                rank={index + 1}
                animatedArt={index === 0}
              />
            </div>
          ))}
          <div aria-hidden="true" className="w-6 shrink-0 sm:w-16" />
        </div>

        {/* progress rail */}
        <div className="mx-auto mt-2 flex max-w-[104rem] items-center gap-5 px-5 sm:px-6 lg:px-10">
          <div className="relative h-px flex-1 overflow-hidden bg-white/10">
            <span
              ref={thumbRef}
              className="absolute inset-y-0 left-0 w-1/3 -translate-x-0 bg-gradient-to-r from-violet via-cyan to-transparent"
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
