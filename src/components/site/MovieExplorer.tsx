"use client";

import { useMemo, useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { useExplorer, type ExplorerSort } from "@/components/providers/ExplorerProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import SectionHeader from "@/components/ui/SectionHeader";
import MovieCard from "@/components/site/MovieCard";
import MagneticButton from "@/components/anim/MagneticButton";
import { GENRES } from "@/lib/movies";
import { cn } from "@/lib/utils";

const SORTS: { id: ExplorerSort; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "new", label: "New Releases" },
  { id: "top", label: "Top Rated" },
];

const GENRE_CHIPS = ["All", ...GENRES.map((genre) => genre.name)];

export default function MovieExplorer() {
  const { query, setQuery, genre, setGenre, sort, setSort, reset } = useExplorer();
  const { open } = usePlayer();
  const { movies } = useCatalog();
  const { ready } = useApp();
  const reducedMotion = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = movies.filter((movie) => {
      const matchesGenre = genre === "All" || movie.genre.includes(genre);
      if (!matchesGenre) return false;
      if (!needle) return true;
      const haystack = [
        movie.title,
        movie.originalTitle,
        movie.tagline,
        movie.description,
        movie.genre.join(" "),
        movie.studio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    const byPopularity = (a: (typeof filtered)[number], b: (typeof filtered)[number]) =>
      b.rating * 0.65 + b.year * 0.35 - (a.rating * 0.65 + a.year * 0.35);

    if (sort === "new") return [...filtered].sort((a, b) => b.year - a.year || b.rating - a.rating);
    if (sort === "top") return [...filtered].sort((a, b) => b.rating - a.rating || b.year - a.year);
    return [...filtered].sort(byPopularity);
  }, [movies, query, genre, sort]);

  // Picked inside the handler rather than during render so the server and the
  // client can never disagree about which title "Surprise me" opens.
  const surprise = () => {
    if (!movies.length) return;
    open(movies[Math.floor(Math.random() * movies.length)]);
  };

  const signature = `${sort}|${genre}|${results.map((movie) => movie.id).join(",")}`;

  useGSAP(
    () => {
      if (reducedMotion) return;
      const cells = gridRef.current?.querySelectorAll("[data-movie-cell]");
      if (!cells?.length) return;
      gsap.fromTo(
        cells,
        { opacity: 0, y: 24, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: EASE.cinema,
          stagger: 0.035,
          overwrite: true,
        },
      );
    },
    { scope: gridRef, dependencies: [signature, reducedMotion, ready], revertOnUpdate: true },
  );

  const sortedIndex = SORTS.findIndex((item) => item.id === sort);

  return (
    <section id="explore" className="relative py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-1/3 h-[36rem] w-[36rem] rounded-full bg-cyan/10 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Chapter 07 — Discovery"
          title="Find Your *Next World*"
          description="Search the library, filter by mood, or let us choose. Every result plays in the quality your screen deserves."
          aside={
            <MagneticButton variant="outline" cursor="play" onClick={surprise}>
              Surprise me
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 3.5l2.4 5.1 5.6.7-4.1 3.9 1.1 5.5-5-2.8-5 2.8 1.1-5.5L3.9 9.3l5.6-.7L12 3.5Z" strokeLinejoin="round" />
              </svg>
            </MagneticButton>
          }
        />

        {/* controls */}
        <div className="mt-10 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
            <label className="group relative flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-ink-900/60 px-5 py-3 transition-colors focus-within:border-cyan/60">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-fog-500" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                id="movie-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, moods, studios…"
                aria-label="Search the library"
                className="w-full bg-transparent text-sm text-fog-100 outline-none placeholder:text-fog-700"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="grid h-6 w-6 place-items-center rounded-full bg-white/8 text-fog-500 transition-colors hover:text-fog-100"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </label>

            <div
              role="tablist"
              aria-label="Sort results"
              className="relative flex shrink-0 rounded-full border border-white/10 bg-ink-900/60 p-1"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-r from-violet to-cyan transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ transform: `translateX(${sortedIndex * 100}%)` }}
              />
              {SORTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={sort === item.id}
                  onClick={() => setSort(item.id)}
                  data-cursor="link"
                  className={cn(
                    "relative z-10 rounded-full px-4 py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors duration-300 sm:px-5",
                    sort === item.id ? "text-ink-950" : "text-fog-500 hover:text-fog-100",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto pb-1">
            {GENRE_CHIPS.map((chip) => {
              const active = genre === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setGenre(chip)}
                  aria-pressed={active}
                  data-cursor="link"
                  className={cn(
                    "shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-400",
                    active
                      ? "border-cyan/50 bg-cyan/15 text-cyan"
                      : "border-white/10 text-fog-500 hover:border-white/25 hover:text-fog-100",
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* results */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs tracking-[0.22em] text-fog-700 uppercase">
            {results.length} {results.length === 1 ? "title" : "titles"}
            {genre !== "All" ? ` · ${genre}` : ""}
          </p>
          {query || genre !== "All" || sort !== "popular" ? (
            <button
              type="button"
              onClick={reset}
              data-cursor="link"
              className="text-xs font-semibold tracking-wide text-fog-500 underline decoration-white/20 underline-offset-4 transition-colors hover:text-fog-100"
            >
              Reset filters
            </button>
          ) : null}
        </div>

        <div
          ref={gridRef}
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
        >
          {results.map((movie) => (
            <div key={movie.id} data-movie-cell>
              <MovieCard movie={movie} variant="grid" />
            </div>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-5 rounded-[1.75rem] border border-white/8 bg-white/[0.03] px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-fog-500">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-bold text-fog-100">
                Nothing in this corner of the universe
              </p>
              <p className="mt-2 text-sm text-fog-500">
                Try a different genre, or clear the search to see the whole library.
              </p>
            </div>
            <MagneticButton variant="soft" onClick={reset} cursor="link">
              Show everything
            </MagneticButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
