import type { ReactNode } from "react";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Reveal from "@/components/anim/Reveal";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  aside?: ReactNode;
  id?: string;
  titleClassName?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  aside,
  id,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" && "items-center text-center",
        aside ? "md:flex-row md:items-end md:justify-between md:gap-12" : undefined,
        className,
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        <Reveal className="flex items-center gap-3" y={14} duration={0.8}>
          <span className="h-px w-10 bg-gradient-to-r from-violet to-cyan" aria-hidden="true" />
          <span className="eyebrow text-fog-500">{eyebrow}</span>
        </Reveal>
        <AnimatedHeading
          as="h2"
          text={title}
          id={id}
          className={cn("display-lg mt-5 text-fog-100", titleClassName)}
        />
        {description ? (
          <Reveal y={22} delay={0.12}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-fog-300/85 sm:text-[1.0625rem]">
              {description}
            </p>
          </Reveal>
        ) : null}
      </div>
      {aside ? (
        <Reveal y={20} delay={0.18} className="shrink-0">
          {aside}
        </Reveal>
      ) : null}
    </div>
  );
}
