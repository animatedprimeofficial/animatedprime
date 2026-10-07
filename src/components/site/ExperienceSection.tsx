"use client";

import { useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Reveal from "@/components/anim/Reveal";

const FEATURES = [
  {
    title: "Seamless streaming",
    copy: "Start on the tablet, finish on the TV. Playback picks up on the exact frame you left.",
    path: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2-12 6 3.5-6 3.5V9Z",
  },
  {
    title: "Curated animated movies",
    copy: "No filler catalogue. Every title is chosen, ordered and restored by people who love the medium.",
    path: "M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8L12 3.5Z",
  },
  {
    title: "A cinematic interface",
    copy: "The product is designed like a title sequence — typography, light and motion in service of the story.",
    path: "M4 6.5h16v11H4zM4 10.5h16M8.5 6.5v11M15.5 6.5v11",
  },
  {
    title: "Fast discovery",
    copy: "Search, genre and mood filtering resolve instantly, so the gap between wanting and watching disappears.",
    path: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4",
  },
  {
    title: "Personalised watchlist",
    copy: "One list that follows you across devices and profiles, with gentle nudges for what you half-started.",
    path: "M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1Z",
  },
  {
    title: "Every screen, tuned",
    copy: "From a phone on the train to a projector in the garden — one master, correctly framed for all of them.",
    path: "M3.5 6.5h13v9h-13zM17 9.5h3.5v6H17zM8 19.5h8",
  },
];

const STATS = [
  { value: 480, suffix: "+", label: "Curated titles" },
  { value: 26, suffix: "", label: "New this season" },
  { value: 12, suffix: "M", label: "Households" },
  { value: 4.9, suffix: "", label: "Average rating", decimals: 1 },
];

function DrawnIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-cyan"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path data-icon-path d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
    </svg>
  );
}

export default function ExperienceSection() {
  const rootRef = useRef<HTMLElement>(null);
  const { ready } = useApp();
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (!ready || reducedMotion) return;

      gsap.fromTo(
        "[data-feature-card]",
        { yPercent: 12, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.05,
          ease: EASE.cinema,
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-feature-grid]", start: "top 84%", once: true },
        },
      );

      gsap.to("[data-icon-path]", {
        strokeDashoffset: 0,
        duration: 1.3,
        ease: "power2.inOut",
        stagger: 0.09,
        scrollTrigger: { trigger: "[data-feature-grid]", start: "top 82%", once: true },
      });

      gsap.utils.toArray<HTMLElement>("[data-stat]").forEach((stat) => {
        const value = Number(stat.dataset.stat ?? 0);
        const decimals = Number(stat.dataset.decimals ?? 0);
        const suffix = stat.dataset.suffix ?? "";
        const counter = { value: 0 };
        gsap.to(counter, {
          value,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: stat, start: "top 90%", once: true },
          onUpdate: () => {
            stat.textContent = `${counter.value.toFixed(decimals)}${suffix}`;
          },
        });
      });
    },
    { scope: rootRef, dependencies: [ready, reducedMotion], revertOnUpdate: true },
  );

  return (
    <section id="experience" ref={rootRef} className="relative py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-8%] top-1/4 h-[32rem] w-[32rem] rounded-full bg-amber/8 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <Reveal className="flex items-center gap-3" y={14}>
              <span className="h-px w-10 bg-gradient-to-r from-violet to-cyan" aria-hidden="true" />
              <span className="eyebrow text-fog-500">Chapter 05 — Why AnimatedPrime</span>
            </Reveal>
            <AnimatedHeading
              as="h2"
              text="More Than *Streaming.* It's an *Experience.*"
              className="display-lg mt-5 text-fog-100"
            />
            <Reveal y={22} delay={0.1}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fog-300/85">
                We rebuilt the streaming product around the feeling of a cinema foyer:
                warm light, considered typography, and never more than one decision
                between you and the opening frame.
              </p>
            </Reveal>
          </div>

          <div data-feature-grid className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                data-feature-card
                className="group glass rounded-[1.5rem] p-6 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-violet/25 to-cyan/15">
                  <DrawnIcon path={feature.path} />
                </span>
                <h3 className="mt-5 font-display text-[1.05rem] font-bold tracking-[-0.02em] text-fog-100">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fog-300/75">{feature.copy}</p>
              </article>
            ))}
          </div>
        </div>

        {/* stats */}
        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/8 pt-10 lg:grid-cols-4 lg:gap-10">
          {STATS.map((stat) => (
            <Reveal key={stat.label} y={20} className="flex flex-col gap-2">
              <span
                data-stat={stat.value}
                data-suffix={stat.suffix}
                data-decimals={stat.decimals ?? 0}
                className="font-display text-3xl font-extrabold tracking-[-0.04em] text-fog-100 tabular-nums sm:text-4xl"
              >
                0
              </span>
              <span className="text-[0.65rem] font-semibold tracking-[0.26em] text-fog-700 uppercase">
                {stat.label}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
