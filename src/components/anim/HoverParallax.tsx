"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePointerFine, useReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export interface HoverParallaxProps {
  children: ReactNode;
  className?: string;
  /** px of travel for the inner layer */
  depth?: number;
  /** selector for the layers to drift (defaults to `[data-parallax-layer]`) */
  selector?: string;
  max?: number;
}

/**
 * Layers inside drift at different rates as the pointer moves across the card,
 * and a soft light follows the cursor. Depth without tilt.
 */
export default function HoverParallax({
  children,
  className,
  depth = 16,
  selector = "[data-parallax-layer]",
  max = 1,
}: HoverParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerFine = usePointerFine();
  const reducedMotion = useReducedMotion();
  const active = pointerFine && !reducedMotion;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !active) return;
      const layers = Array.from(root.querySelectorAll<HTMLElement>(selector));
      const setters = layers.map((layer, index) => {
        const strength = ((index + 1) / layers.length) * depth;
        return {
          strength,
          x: gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(layer, "y", { duration: 0.9, ease: "power3.out" }),
          xs: gsap.quickTo(layer, "scale", { duration: 1.1, ease: "power3.out" }),
        };
      });

      const onMove = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        setters.forEach((setter) => {
          setter.x(-px * setter.strength);
          setter.y(-py * setter.strength);
        });
        root.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
        root.style.setProperty("--my", `${(py + 0.5) * 100}%`);
      };

      const onEnter = () => {
        setters.forEach((setter, index) => {
          setters[index].xs(max + 0.06 * (1 - index / Math.max(1, setters.length)));
        });
      };

      const onLeave = () => {
        setters.forEach((setter) => {
          setter.x(0);
          setter.y(0);
          setter.xs(1);
        });
      };

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerenter", onEnter);
      root.addEventListener("pointerleave", onLeave);
      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerenter", onEnter);
        root.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref, dependencies: [active, depth, selector, max], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.12), transparent 62%)",
        }}
      />
    </div>
  );
}
