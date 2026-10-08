import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  /** wordmark only — used in the compact footer */
  markOnly?: boolean;
  animated?: boolean;
}

/**
 * The AnimatedPrime mark. A single raster asset is the identity everywhere —
 * navbar, footer, install dialog and the phone screens — so the brand can never
 * drift between what the site promises and what the app ships.
 */
export function LogoMark({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={466}
      height={466}
      draggable={false}
      className={cn(
        "h-9 w-9 shrink-0 select-none",
        animated &&
          "transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-rotate-6 group-hover:scale-110",
        className,
      )}
    />
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
