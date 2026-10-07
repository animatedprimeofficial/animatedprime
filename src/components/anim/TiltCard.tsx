"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePointerFine, useReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** max rotation in degrees */
  intensity?: number;
  /** lift towards the viewer on hover */
  lift?: number;
  /** spotlight + border glow following the pointer */
  spotlight?: boolean;
}

/**
 * Pointer-reactive 3D tilt. Kept deliberately subtle (max ~8°) — enough to make
 * cards feel tactile and physical without turning the page into a toy.
 */
export default function TiltCard({
  children,
  className,
  intensity = 7,
  lift = 26,
  spotlight = true,
}: TiltCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pointerFine = usePointerFine();
  const reducedMotion = useReducedMotion();
  const active = pointerFine && !reducedMotion;

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;

      if (!active) {
        gsap.set(inner, { rotateX: 0, rotateY: 0, z: 0 });
        return;
      }

      const rotX = gsap.quickTo(inner, "rotateX", { duration: 0.55, ease: "power3.out" });
      const rotY = gsap.quickTo(inner, "rotateY", { duration: 0.55, ease: "power3.out" });
      const zTo = gsap.quickTo(inner, "z", { duration: 0.6, ease: "power3.out" });

      const onMove = (event: PointerEvent) => {
        const rect = wrap.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        rotY((px - 0.5) * intensity * 2);
        rotX(-(py - 0.5) * intensity * 2);
        zTo(lift);
        if (spotlight) {
          wrap.style.setProperty("--mx", `${px * 100}%`);
          wrap.style.setProperty("--my", `${py * 100}%`);
        }
      };

      const onLeave = () => {
        rotX(0);
        rotY(0);
        zTo(0);
      };

      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
      return () => {
        wrap.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerleave", onLeave);
      };
    },
    { dependencies: [active, intensity, lift, spotlight], scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className={cn("group/tilt [perspective:1200px]", className)}>
      <div
        ref={innerRef}
        className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
      >
        {children}
        {spotlight ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
            style={{
              background:
                "radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.14), transparent 60%)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
