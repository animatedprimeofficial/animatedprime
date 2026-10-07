"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePointerFine, useReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "soft";

export interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  /** pulls the button toward the cursor when true (default on fine pointers) */
  magnetic?: boolean;
  size?: "md" | "lg";
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  cursor?: string;
  type?: "button" | "submit";
}

const SIZES: Record<"md" | "lg", string> = {
  md: "px-7 py-3.5 text-sm",
  lg: "px-9 py-4 text-[0.95rem]",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-violet via-[#8f6bff] to-cyan text-ink-950 shadow-[0_18px_60px_-18px_rgba(124,92,255,0.85)] hover:shadow-[0_22px_70px_-14px_rgba(70,229,255,0.7)]",
  outline:
    "border border-white/16 bg-white/[0.03] text-fog-100 hover:border-white/30 hover:bg-white/[0.07]",
  ghost: "text-fog-300 hover:text-fog-100",
  soft: "glass text-fog-100 hover:border-white/20",
};

/**
 * Magnetic CTA. The label drifts a touch further than the shell so the button
 * feels like it has internal weight, and a soft highlight follows the pointer.
 */
export default function MagneticButton({
  children,
  className,
  variant = "primary",
  size = "md",
  magnetic = true,
  onClick,
  href,
  ariaLabel,
  cursor,
  type = "button",
}: MagneticButtonProps) {
  const shellRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const pointerFine = usePointerFine();
  const reducedMotion = useReducedMotion();
  const interactive = pointerFine && !reducedMotion && magnetic;

  useGSAP(
    () => {
      const shell = shellRef.current;
      const label = labelRef.current;
      if (!shell) return;

      if (!interactive) {
        gsap.set(shell, { x: 0, y: 0 });
        return;
      }

      const shellX = gsap.quickTo(shell, "x", { duration: 0.7, ease: "elastic.out(1, 0.55)" });
      const shellY = gsap.quickTo(shell, "y", { duration: 0.7, ease: "elastic.out(1, 0.55)" });
      const labelX = label ? gsap.quickTo(label, "x", { duration: 0.9, ease: "elastic.out(1, 0.5)" }) : null;
      const labelY = label ? gsap.quickTo(label, "y", { duration: 0.9, ease: "elastic.out(1, 0.5)" }) : null;

      const onMove = (event: PointerEvent) => {
        const rect = shell.getBoundingClientRect();
        const relX = event.clientX - (rect.left + rect.width / 2);
        const relY = event.clientY - (rect.top + rect.height / 2);
        shellX(relX * 0.22);
        shellY(relY * 0.3);
        labelX?.(relX * 0.08);
        labelY?.(relY * 0.12);
        if (glowRef.current) {
          gsap.set(glowRef.current, {
            "--mx": `${((event.clientX - rect.left) / rect.width) * 100}%`,
            "--my": `${((event.clientY - rect.top) / rect.height) * 100}%`,
            opacity: 1,
          });
        }
      };

      const onLeave = () => {
        shellX(0);
        shellY(0);
        labelX?.(0);
        labelY?.(0);
        if (glowRef.current) gsap.to(glowRef.current, { opacity: 0, duration: 0.4 });
      };

      shell.addEventListener("pointermove", onMove);
      shell.addEventListener("pointerleave", onLeave);
      return () => {
        shell.removeEventListener("pointermove", onMove);
        shell.removeEventListener("pointerleave", onLeave);
      };
    },
    { dependencies: [interactive], scope: shellRef },
  );

  const shared = cn(
    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-semibold tracking-tight transition-colors duration-300 will-change-transform",
    SIZES[size],
    VARIANTS[variant],
    className,
  );

  const inner = (
    <>
      <span
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(160px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.35), transparent 62%)",
        }}
      />
      <span ref={labelRef} className="relative flex items-center gap-2.5">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={shellRef as never}
        href={href}
        aria-label={ariaLabel}
        data-cursor={cursor ?? "link"}
        className={shared}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={shellRef as never}
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      data-cursor={cursor ?? "link"}
      className={shared}
    >
      {inner}
    </button>
  );
}
