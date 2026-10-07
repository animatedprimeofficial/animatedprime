"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useMediaQuery, useReducedMotion } from "@/hooks/useMediaQuery";
import { useApp } from "@/components/providers/AppProvider";
import { cn } from "@/lib/utils";

export interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** % of the element's own height travelled across the viewport pass */
  speed?: number;
  /** scale drift, e.g. 1.08 for slow image push-in */
  scaleTo?: number;
  /** rotate drift in degrees */
  rotate?: number;
  disabled?: boolean;
}

export default function Parallax({
  children,
  className,
  speed = 12,
  scaleTo,
  rotate,
  disabled = false,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { ready } = useApp();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotion || disabled) return;
      // Halve the travel on small screens — parallax reads as jitter on phones.
      const factor = isDesktop ? 1 : 0.45;

      gsap.fromTo(
        el,
        { yPercent: (speed * factor) / 2, ...(scaleTo ? { scale: scaleTo } : {}), ...(rotate ? { rotate: -rotate } : {}) },
        {
          yPercent: (-speed * factor) / 2,
          ...(scaleTo ? { scale: 1 } : {}),
          ...(rotate ? { rotate } : {}),
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [ready, reducedMotion, isDesktop, speed, scaleTo, rotate, disabled], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
