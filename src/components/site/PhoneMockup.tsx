"use client";

import Artwork from "@/components/art/Artwork";
import { LogoMark } from "@/components/ui/Logo";
import type { Movie } from "@/lib/movies";
import { cn } from "@/lib/utils";

export type PhoneScreen = "home" | "player" | "downloads";

interface PhoneMockupProps {
  screen: PhoneScreen;
  movie: Movie;
  rail: Movie[];
  className?: string;
  /** disables the device chrome noise for tiny placements */
  compact?: boolean;
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  const tone = dark ? "text-ink-950" : "text-fog-100";
  return (
    <div className={cn("flex items-center justify-between px-5 pt-3 text-[0.6rem] font-semibold", tone)}>
      <span className="tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-2.5 w-4 fill-current" aria-hidden="true">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="4.5" y="5" width="3" height="7" rx="1" />
          <rect x="9" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 26 12" className="h-2.5 w-6" aria-hidden="true">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.45" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <rect x="23" y="4" width="2.5" height="4" rx="1.2" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

function TabBar({ active }: { active: "home" | "search" | "list" | "downloads" }) {
  const items = [
    { id: "home", label: "Home", path: "M4 10.5 12 4l8 6.5V20H4Z" },
    { id: "search", label: "Search", path: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4" },
    { id: "list", label: "Watchlist", path: "M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1Z" },
    { id: "downloads", label: "Downloads", path: "M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19.5h14" },
  ] as const;

  return (
    <div className="mt-auto border-t border-white/8 bg-ink-950/80 px-3 pb-3 pt-2 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        {items.map((item) => (
          <span
            key={item.id}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5",
              active === item.id ? "text-cyan" : "text-fog-700",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={item.path} />
            </svg>
            <span className="text-[0.5rem] font-semibold tracking-wide">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * A real device frame with a real screen inside it: the same catalogue data,
 * the same artwork pipeline and the same design language as the site, so the
 * phone genuinely shows the product rather than a picture of it.
 */
export default function PhoneMockup({
  screen,
  movie,
  rail,
  className,
  compact = false,
}: PhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative rounded-[2.75rem] border border-white/12 bg-gradient-to-b from-white/12 via-white/5 to-white/10 p-[3px] shadow-[0_60px_120px_-50px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2.6rem] bg-ink-950">
        {/* screen */}
        <div className="relative aspect-[9/19] w-full">
          {screen === "home" ? (
            <div className="flex h-full flex-col">
              <div className="relative h-[46%] w-full">
                <Artwork movie={movie} variant="backdrop" width={800} height={900} detail="simple" sizes="(max-width: 768px) 60vw, 22rem" className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/30 to-ink-950" />
                <StatusBar />
                <div className="absolute inset-x-4 top-9 flex items-center justify-between">
                  <LogoMark className="h-6 w-6" animated={false} />
                  <span className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-white/12 bg-white/5">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-fog-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-[0.5rem] font-bold text-ink-950">
                      AP
                    </span>
                  </span>
                </div>
                <div className="absolute inset-x-4 bottom-3">
                  <p className="text-[0.5rem] font-semibold tracking-[0.22em] text-cyan uppercase">
                    Continue watching
                  </p>
                  <p className="mt-1 font-display text-sm font-bold text-fog-100">{movie.title}</p>
                  <span className="mt-2 block h-[3px] w-full overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full w-[62%] rounded-full bg-gradient-to-r from-violet to-cyan" />
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 px-4 pt-4">
                <p className="text-[0.5rem] font-semibold tracking-[0.22em] text-fog-500 uppercase">
                  Because you loved {movie.genre[0]?.toLowerCase() ?? "animation"}
                </p>
                <div className="flex gap-2.5">
                  {rail.slice(0, 3).map((item) => (
                    <div key={item.id} className="w-1/3 shrink-0">
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10">
                        <Artwork movie={item} width={400} height={600} detail="simple" sizes="8rem" />
                      </div>
                      <p className="mt-1.5 truncate text-[0.55rem] font-semibold text-fog-300">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <TabBar active="home" />
            </div>
          ) : null}

          {screen === "player" ? (
            <div className="relative flex h-full flex-col">
              <div className="absolute inset-0">
                <Artwork movie={movie} variant="backdrop" width={800} height={1600} horizon={0.6} detail="simple" animate sizes="(max-width: 768px) 60vw, 22rem" className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-950/75 via-transparent to-ink-950/95" />
              </div>
              <div className="relative">
                <StatusBar />
              </div>

              <div className="relative mt-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-3 backdrop-blur-xl">
                  <p className="text-[0.5rem] font-semibold tracking-[0.22em] text-cyan uppercase">
                    Now playing · {movie.quality[0]}
                  </p>
                  <p className="mt-1.5 font-display text-sm font-bold text-fog-100">{movie.title}</p>
                  <p className="mt-1 text-[0.55rem] text-fog-500">
                    {movie.year}
                    {movie.duration ? ` · ${movie.duration}` : ""}
                    {movie.maturity ? ` · ${movie.maturity}` : ""}
                  </p>
                  <span className="mt-2.5 block h-[3px] w-full overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full w-[38%] rounded-full bg-gradient-to-r from-violet to-cyan" />
                  </span>
                  <div className="mt-3 flex items-center justify-center gap-5 text-fog-300">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M11 5 6 12l5 7M18 5l-5 7 5 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-ink-950">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                        <path d="M8 5.5 19 12 8 18.5Z" />
                      </svg>
                    </span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M3 9v6h3l4 4V5L6 9H3Zm13-1.5a5 5 0 0 1 0 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              <TabBar active="home" />
            </div>
          ) : null}

          {screen === "downloads" ? (
            <div className="flex h-full flex-col">
              <div className="relative">
                <StatusBar />
              </div>
              <div className="px-4 pt-4">
                <p className="font-display text-base font-bold text-fog-100">Downloads</p>
                <p className="mt-1 text-[0.55rem] text-fog-500">
                  3 titles · 6.4 GB of 12 GB used
                </p>
                <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full w-[53%] rounded-full bg-gradient-to-r from-violet to-cyan" />
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[0.5rem] font-semibold tracking-[0.16em] text-mint uppercase">
                  <span className="h-1 w-1 rounded-full bg-mint" />
                  Offline ready
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2 px-4">
                {rail.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-2">
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md border border-white/10">
                      <Artwork movie={item} width={300} height={450} detail="simple" sizes="3rem" />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.6rem] font-semibold text-fog-100">
                        {item.title}
                      </span>
                      <span className="block text-[0.52rem] text-fog-500">
                        {item.quality[0]} · 2.1 GB
                      </span>
                    </span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mint" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ))}
              </div>

              <TabBar active="downloads" />
            </div>
          ) : null}

          {/* dynamic island + bezel glint */}
          {compact ? null : (
            <span className="absolute left-1/2 top-2 h-[1.15rem] w-[4.2rem] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
          )}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[2.6rem] bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
