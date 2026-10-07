"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { usePointerFine, useReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

type CursorMode = "default" | "link" | "view" | "play" | "drag" | "text";

const LABELS: Partial<Record<CursorMode, string>> = {
  view: "View",
  play: "Play",
  drag: "Drag",
};

const RING_SIZE: Record<CursorMode, number> = {
  default: 34,
  link: 46,
  view: 82,
  play: 80,
  drag: 78,
  text: 22,
};

/**
 * Intent-aware cursor. A hard little dot for precision, a lagging ring for
 * intent — the ring grows and speaks ("View", "Play", "Drag") when the pointer
 * lands on something with a `data-cursor` hint. Desktop only: it never mounts
 * its visuals for touch or reduced-motion users.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pointerFine = usePointerFine();
  const reducedMotion = useReducedMotion();
  const enabled = pointerFine && !reducedMotion;
  const [mode, setMode] = useState<CursorMode>("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      delete document.documentElement.dataset.cursor;
      return;
    }
    document.documentElement.dataset.cursor = "on";
    return () => {
      delete document.documentElement.dataset.cursor;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, force3D: true });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      setVisible(true);
    };

    const resolveMode = (target: Element | null): CursorMode => {
      const hint = target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
      if (hint === "view" || hint === "play" || hint === "drag" || hint === "text") return hint;
      if (hint === "link") return "link";
      if (hint === "none") return "text";
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return "text";
      if (target?.closest("a, button, [role=button]")) return "link";
      return "default";
    };

    const onOver = (event: PointerEvent) => setMode(resolveMode(event.target as Element | null));
    const onDown = () => gsap.to(dot, { scale: 0.55, duration: 0.18 });
    const onUp = () => gsap.to(dot, { scale: 1, duration: 0.3 });
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  const label = LABELS[mode];
  const size = RING_SIZE[mode];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[300] hidden lg:block">
      <div
        ref={ringRef}
        className={cn(
          "absolute left-0 top-0 grid place-items-center rounded-full border transition-[width,height,background-color,border-color,opacity] duration-400 ease-out",
          label ? "border-white/25 bg-white/8 backdrop-blur-[3px]" : "border-fog-100/40 bg-transparent",
        )}
        style={{
          width: size,
          height: size,
          opacity: visible ? 1 : 0,
        }}
      >
        {label ? (
          <span className="text-[0.6rem] font-bold tracking-[0.18em] text-fog-100 uppercase">
            {label}
          </span>
        ) : null}
      </div>
      <div
        ref={dotRef}
        className="absolute left-0 top-0 rounded-full bg-gradient-to-br from-violet to-cyan shadow-[0_0_18px_rgba(124,92,255,0.9)] transition-opacity duration-300"
        style={{ width: 7, height: 7, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
