"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { LogoMark } from "@/components/ui/Logo";

interface IntroCurtainProps {
  stage: "boot" | "playing" | "done";
  onDone: () => void;
  reducedMotion: boolean;
}

const SESSION_KEY = "animatedprime:intro-seen";

/**
 * The first five seconds are the pitch. A black curtain, a projector iris, a
 * counter that climbs to 100 — then the curtain lifts and hands the stage to
 * the hero. Skipped instantly for reduced-motion users and short-circuited on
 * repeat visits within a session.
 */
export default function IntroCurtain({ stage, onDone, reducedMotion }: IntroCurtainProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (reducedMotion) {
      doneRef.current();
      return;
    }
    // Never let the curtain hold the page hostage: a background tab (where rAF
    // is throttled) or an unexpected failure still resolves to the site.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      doneRef.current();
      return;
    }
    const failsafe = window.setTimeout(() => doneRef.current(), 5200);
    return () => window.clearTimeout(failsafe);
  }, [reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion || stage === "done") return;
      const root = rootRef.current;
      if (!root) return;

      let seen = false;
      try {
        seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        seen = false;
      }

      const counter = { value: 0 };
      const tail = seen ? 0.35 : 1;

      const tl = gsap.timeline({
        defaults: { ease: EASE.cinema },
        onComplete: () => doneRef.current(),
      });

      tl.set(root, { autoAlpha: 1 })
        .fromTo(
          markRef.current,
          { opacity: 0, scale: 0.86, filter: "blur(14px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9 },
        )
        .fromTo(
          counter,
          { value: 0 },
          {
            value: 100,
            duration: 1.5 * tail,
            ease: "power2.inOut",
            onUpdate: () => {
              if (counterRef.current) {
                counterRef.current.textContent = String(Math.round(counter.value)).padStart(3, "0");
              }
            },
          },
          0.15,
        )
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.5 * tail, ease: "power2.inOut" }, 0.15)
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7 },
          seen ? 0.2 : 1.05,
        )
        .to([markRef.current, taglineRef.current, counterRef.current], {
          opacity: 0,
          y: -18,
          duration: 0.5,
          ease: "power2.in",
        })
        .to(
          root,
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: seen ? 0.6 : 1,
            ease: "power4.inOut",
          },
          ">-0.05",
        )
        .set(root, { autoAlpha: 0 });

      return () => {
        tl.kill();
      };
    },
    { scope: rootRef, dependencies: [reducedMotion, stage] },
  );

  if (stage === "done") return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="grain fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-ink-950 [clip-path:inset(0%_0%_0%_0%)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/18 blur-[140px]" />
        <div className="absolute left-[18%] top-[62%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-cyan/10 blur-[120px]" />
      </div>

      <div ref={markRef} className="relative flex flex-col items-center gap-6">
        <LogoMark className="h-16 w-16" animated={false} />
        <div className="flex items-baseline gap-2 font-display text-sm font-semibold tracking-[0.42em] text-fog-500 uppercase">
          <span>AnimatedPrime</span>
        </div>
      </div>

      <div className="relative mt-12 flex w-[min(78vw,22rem)] flex-col items-center gap-4">
        <span
          ref={lineRef}
          className="h-px w-full origin-left bg-gradient-to-r from-violet via-cyan to-transparent"
        />
        <div className="flex w-full items-center justify-between font-sans text-[0.7rem] font-semibold tracking-[0.3em] text-fog-700 uppercase">
          <span>Loading reel</span>
          <span ref={counterRef} className="tabular-nums text-fog-300">
            000
          </span>
        </div>
      </div>

      <div ref={taglineRef} className="relative mt-14 text-center">
        <p className="story-italic text-2xl text-fog-300 sm:text-3xl">Animation. Reimagined.</p>
      </div>
    </div>
  );
}
