"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, ScrollTrigger, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useIsDesktop, useReducedMotion } from "@/hooks/useMediaQuery";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Reveal from "@/components/anim/Reveal";
import SceneArt from "@/components/art/SceneArt";
import { MOVIES, TRENDING_MOVIES } from "@/lib/movies";
import { cn } from "@/lib/utils";

const ImmersiveCanvas = dynamic(() => import("@/components/three/ImmersiveCanvas"), {
  ssr: false,
});

const BEATS = [
  {
    eyebrow: "01 — Enter",
    title: "Step inside the frame",
    copy: "Artwork stops being a thumbnail. Key art lifts off the page and forms a corridor you travel through.",
  },
  {
    eyebrow: "02 — Explore",
    title: "Worlds stacked in depth",
    copy: "Every poster holds its own parallax, its own light, its own drift. Depth becomes the navigation.",
  },
  {
    eyebrow: "03 — Stream",
    title: "One tap from the picture",
    copy: "Whatever catches your eye, playback is one gesture away — no menus, no detours, no loading screen.",
  },
];

export default function ImmersiveScene() {
  const rootRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const barRef = useRef<HTMLSpanElement>(null);
  const { ready } = useApp();
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const pinned = ready && isDesktop && !reducedMotion;

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel || !pinned) return;

      const beats = Array.from(panel.querySelectorAll<HTMLElement>("[data-beat]"));
      const header = panel.querySelector<HTMLElement>("[data-immersive-head]");

      const trigger = ScrollTrigger.create({
        trigger: panel,
        start: "top top",
        end: "+=280%",
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;
          if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

          beats.forEach((element, index) => {
            const span = 1 / BEATS.length;
            const local = (p - index * span) / span;
            const clamped = Math.max(0, Math.min(1, local));
            const opacity = Math.sin(clamped * Math.PI);
            element.style.opacity = String(opacity);
            element.style.transform = `translate3d(0, ${(0.5 - clamped) * 70}px, 0)`;
            element.style.pointerEvents = opacity > 0.55 ? "auto" : "none";
          });

          if (header) {
            const headerFade = 1 - Math.min(1, p / 0.12);
            header.style.opacity = String(headerFade);
            header.style.transform = `translate3d(0, ${-p * 60}px, 0)`;
          }

          const hint = panel.querySelector<HTMLElement>("[data-immersive-hint]");
          if (hint) hint.style.opacity = String(Math.max(0, 1 - p / 0.08));
        },
      });

      gsap.fromTo(
        "[data-immersive-frame]",
        { clipPath: "inset(8% 8% 8% 8% round 2rem)", opacity: 0.4 },
        {
          clipPath: "inset(0% 0% 0% 0% round 0rem)",
          opacity: 1,
          duration: 1.4,
          ease: EASE.cinema,
          scrollTrigger: { trigger: panel, start: "top 90%", once: true },
        },
      );

      return () => trigger.kill();
    },
    { scope: rootRef, dependencies: [pinned], revertOnUpdate: true },
  );

  /* ---------------- Mobile / reduced-motion composition ---------------- */
  if (!pinned) {
    return (
      <section id="immersive" ref={rootRef} className="relative overflow-hidden py-24 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/4 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet/14 blur-[150px]"
        />
        <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
          <Reveal className="flex items-center gap-3" y={14}>
            <span className="h-px w-10 bg-gradient-to-r from-violet to-cyan" aria-hidden="true" />
            <span className="eyebrow text-fog-500">Chapter 04 — The world</span>
          </Reveal>
          <AnimatedHeading
            as="h2"
            text="Step inside *an animated world*"
            className="display-lg mt-5 text-fog-100"
          />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-fog-300/85">
            A corridor of floating key art, lit from behind. Travel it and the shelf
            rearranges around you.
          </p>

          <div className="relative mt-10 h-[58svh] overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900">
            {reducedMotion ? (
              <div className="grid h-full grid-cols-3 gap-3 p-4">
                {TRENDING_MOVIES.slice(0, 3).map((movie) => (
                  <div key={movie.id} className="overflow-hidden rounded-xl border border-white/10">
                    <SceneArt
                      scene={movie.scene}
                      palette={movie.palette}
                      width={600}
                      height={900}
                      detail="simple"
                      seed={`immersive-${movie.id}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ImmersiveCanvas movies={MOVIES} progress={progressRef} lowPower idle />
            )}
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {BEATS.map((beat) => (
              <Reveal key={beat.title} y={26} className="glass rounded-2xl p-6">
                <p className="text-[0.6rem] font-semibold tracking-[0.24em] text-cyan uppercase">
                  {beat.eyebrow}
                </p>
                <h3 className="mt-3 font-display text-lg font-bold text-fog-100">{beat.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fog-300/80">{beat.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Desktop pinned travel ---------------- */
  return (
    <section id="immersive" ref={rootRef} className="relative">
      <div ref={panelRef} className="relative h-[100svh] overflow-hidden bg-ink-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,92,255,0.22),transparent_60%)]"
        />

        <div data-immersive-frame className="absolute inset-0">
          <ImmersiveCanvas movies={MOVIES} progress={progressRef} />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ink-950 to-transparent"
        />

        <div
          data-immersive-head
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto w-full max-w-[104rem] px-5 pt-24 sm:px-6 lg:px-10 lg:pt-28"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-violet to-cyan" aria-hidden="true" />
            <span className="eyebrow text-fog-500">Chapter 04 — The world</span>
          </div>
          <h2 className="display-lg mt-5 max-w-3xl text-fog-100">
            Step inside <span className="story-italic">an animated world</span>
          </h2>
        </div>

        {/* travelling copy beats */}
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
            {BEATS.map((beat, index) => (
              <div
                key={beat.title}
                data-beat={index}
                style={{ opacity: 0 }}
                className="absolute bottom-0 left-5 max-w-md will-change-transform sm:left-6 lg:left-10"
              >
                <p className="text-[0.6rem] font-semibold tracking-[0.28em] text-cyan uppercase">
                  {beat.eyebrow}
                </p>
                <h3 className="display-md mt-3 text-fog-100">{beat.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-fog-300/85 sm:text-base">
                  {beat.copy}
                </p>
              </div>
            ))}
            <div className="relative h-32" aria-hidden="true" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-[104rem] px-5 pb-10 sm:px-6 lg:px-10">
          <div className="flex items-center gap-5">
            <span className="relative h-px flex-1 bg-white/12">
              <span
                ref={barRef}
                className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-gradient-to-r from-violet via-cyan to-transparent"
              />
            </span>
            <span
              data-immersive-hint
              className="text-[0.6rem] font-semibold tracking-[0.3em] text-fog-700 uppercase"
            >
              Keep scrolling to travel
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
