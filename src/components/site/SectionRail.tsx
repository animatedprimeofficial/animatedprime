"use client";

import { useApp } from "@/components/providers/AppProvider";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";

const STOPS = [
  { id: "top", label: "Intro", index: "01" },
  { id: "featured", label: "Featured", index: "02" },
  { id: "trending", label: "Trending", index: "03" },
  { id: "anime", label: "Anime", index: "04" },
  { id: "genres", label: "Genres", index: "05" },
  { id: "immersive", label: "3D World", index: "06" },
  { id: "experience", label: "Experience", index: "07" },
  { id: "app", label: "The app", index: "08" },
  { id: "explore", label: "Explore", index: "09" },
  { id: "start", label: "Start", index: "10" },
];

const IDS = STOPS.map((stop) => stop.id);

/** Cinematic chapter rail — a filmstrip index down the right edge. */
export default function SectionRail() {
  const { scrollTo, introDone } = useApp();
  const active = useActiveSection(IDS);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "group/rail fixed right-5 top-1/2 z-[105] hidden -translate-y-1/2 flex-col items-end gap-3.5 transition-opacity duration-700 xl:flex",
        introDone ? "opacity-100" : "opacity-0",
      )}
    >
      {STOPS.map((stop) => {
        const isActive = active === stop.id;
        return (
          <button
            key={stop.id}
            type="button"
            onClick={() => scrollTo(`#${stop.id}`)}
            data-cursor="link"
            aria-label={stop.label}
            aria-current={isActive ? "true" : undefined}
            className="group flex items-center gap-3"
          >
            <span
              className={cn(
                "font-sans text-[0.6rem] font-semibold tracking-[0.22em] uppercase transition-all duration-500",
                isActive ? "text-fog-300" : "text-fog-700",
                "translate-x-2 opacity-0 group-hover/rail:translate-x-0 group-hover/rail:opacity-100",
              )}
            >
              {stop.index} — {stop.label}
            </span>
            <span
              className={cn(
                "block h-[1.5px] rounded-full transition-all duration-500",
                isActive ? "w-7 bg-gradient-to-r from-violet to-cyan" : "w-3.5 bg-fog-700 group-hover:w-5",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
