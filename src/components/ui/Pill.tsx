import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pill({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] uppercase",
        tone === "default" && "glass text-fog-300",
        tone === "accent" && "border border-violet/40 bg-violet/15 text-violet-soft",
        tone === "outline" && "border border-white/12 text-fog-500",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RatingBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber/25 bg-amber/10 px-3 py-1 text-xs font-bold text-amber",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2.6l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.9 6.2 20.2l1.5-6.5-5-4.4 6.6-.6z"
        />
      </svg>
      {value.toFixed(1)}
    </span>
  );
}

export function MetaDot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("h-1 w-1 rounded-full bg-fog-700", className)} />;
}
