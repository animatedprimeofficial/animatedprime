"use client";

import { useRef, type ReactNode } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { useApp } from "@/components/providers/AppProvider";
import { cn } from "@/lib/utils";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** distance travelled on entry */
  y?: number;
  x?: number;
  scale?: number;
  delay?: number;
  duration?: number;
  /** stagger direct children instead of the wrapper itself */
  stagger?: number;
  start?: string;
  /** blur-in reads as a projector coming into focus */
  blur?: boolean;
  once?: boolean;
  as?: "div" | "section" | "ul" | "li" | "span" | "p";
}

export default function Reveal({
  children,
  className,
  y = 34,
  x = 0,
  scale,
  delay = 0,
  duration = 1,
  stagger,
  start = "top 86%",
  blur = false,
  once = true,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { ready } = useApp();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotion) return;
      const targets = stagger != null ? Array.from(el.children) : el;
      if (stagger != null && (!targets || (targets as Element[]).length === 0)) return;

      gsap.fromTo(
        targets,
        {
          y,
          x,
          opacity: 0,
          scale: scale ?? 1,
          ...(blur ? { filter: "blur(10px)" } : {}),
        },
        {
          y: 0,
          x: 0,
          opacity: 1,
          scale: 1,
          ...(blur ? { filter: "blur(0px)" } : {}),
          duration,
          delay,
          ease: EASE.cinema,
          stagger: stagger ?? 0,
          clearProps: "filter,transform",
          scrollTrigger: { trigger: el, start, once },
        },
      );
    },
    { scope: ref, dependencies: [ready, reducedMotion, stagger, y, x, scale, delay, duration], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref as never} className={cn(className)}>
      {children}
    </Tag>
  );
}
