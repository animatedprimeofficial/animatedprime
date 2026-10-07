import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  /** wordmark only — used in the compact footer */
  markOnly?: boolean;
  animated?: boolean;
}

/**
 * The AnimatedPrime mark: a projector iris built from two offset rings around a
 * play prism. Rings counter-rotate on hover, so the identity itself animates.
 */
export function LogoMark({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-9 w-9", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ap-logo-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="52%" stopColor="#46e5ff" />
          <stop offset="100%" stopColor="#ff5ca8" />
        </linearGradient>
        <linearGradient id="ap-logo-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#46e5ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21.5" fill="none" stroke="url(#ap-logo-b)" strokeWidth="1.2" />
      <g className={animated ? "origin-center transition-transform duration-700 group-hover:rotate-180" : undefined}>
        <circle
          cx="24"
          cy="24"
          r="16"
          fill="none"
          stroke="url(#ap-logo-a)"
          strokeWidth="2.2"
          strokeDasharray="72 32"
          strokeLinecap="round"
        />
      </g>
      <g className={animated ? "origin-center transition-transform duration-700 group-hover:-rotate-90" : undefined}>
        <circle cx="24" cy="7.5" r="2.6" fill="#46e5ff" />
        <circle cx="40.5" cy="30" r="1.9" fill="#ff5ca8" />
      </g>
      <path d="M20.5 17.5 L31 24 L20.5 30.5 Z" fill="url(#ap-logo-a)" />
    </svg>
  );
}

export default function Logo({
  className,
  markOnly = false,
  animated = true,
}: LogoProps) {
  return (
    <span className={cn("group inline-flex items-center gap-3", className)}>
      <LogoMark animated={animated} />
      {markOnly ? null : (
        <span className="font-display text-[1.075rem] font-extrabold tracking-[-0.045em] text-fog-100">
          Animated
          <span className="bg-gradient-to-r from-violet-soft to-cyan bg-clip-text text-transparent">
            Prime
          </span>
        </span>
      )}
    </span>
  );
}
