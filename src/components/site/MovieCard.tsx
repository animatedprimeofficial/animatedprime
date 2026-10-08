"use client";

import { memo } from "react";
import Artwork from "@/components/art/Artwork";
import TiltCard from "@/components/anim/TiltCard";
import { RatingBadge } from "@/components/ui/Pill";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useWatchlist } from "@/components/providers/WatchlistProvider";
import type { Movie } from "@/lib/movies";
import { cn } from "@/lib/utils";

export type MovieCardVariant = "poster" | "grid" | "rank";

export interface MovieCardProps {
  movie: Movie;
  variant?: MovieCardVariant;
  rank?: number;
  className?: string;
  /** enables the idle scene animation — reserve for the few hero-scale cards */
  animatedArt?: boolean;
  priority?: boolean;
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" />
    </svg>
  );
}

function BookmarkGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    </svg>
  );
}

function MovieCardInner({
  movie,
  variant = "poster",
  rank,
  className,
  animatedArt = false,
  priority = false,
}: MovieCardProps) {
  const { open } = usePlayer();
  const watchlist = useWatchlist();
  const saved = watchlist.has(movie.id);

  const isRank = variant === "rank";

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      {isRank && rank != null ? (
        <span
          aria-hidden="true"
          className="hidden shrink-0 items-center font-display text-[4.6rem] leading-none font-extrabold tracking-[-0.06em] text-transparent select-none [-webkit-text-stroke:1.5px_rgba(255,255,255,0.28)] sm:flex md:text-[6.4rem]"
        >
          {String(rank).padStart(2, "0")}
        </span>
      ) : null}

      <TiltCard
        className="h-full flex-1"
        intensity={isRank ? 5 : 7}
        lift={isRank ? 18 : 28}
      >
        <article
          className={cn(
            "group relative isolate h-full w-full overflow-hidden rounded-[1.75rem] border border-white/8 bg-ink-850 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)]",
            "transition-[border-color,box-shadow] duration-500 hover:border-white/18 hover:shadow-[0_50px_110px_-40px_rgba(124,92,255,0.55)]",
            variant === "grid" ? "aspect-[3/4] sm:aspect-[2/3]" : "aspect-[2/3]",
          )}
        >
          {/* artwork */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="h-full w-full scale-[1.02] transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.12]">
              <Artwork
                movie={movie}
                variant="poster"
                width={800}
                height={1200}
                detail="simple"
                animate={animatedArt}
                priority={priority}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22rem"
              />
            </div>
          </div>

          {/* gradient scrims */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-violet/45 via-cyan/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-950 to-transparent"
          />

          {/* top row */}
          <div className="absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
            <span className="rounded-full border border-white/12 bg-ink-950/50 px-2.5 py-1 text-[0.6rem] font-bold tracking-[0.16em] text-fog-300 uppercase backdrop-blur-md">
              {movie.quality[0]}
            </span>
            <button
              type="button"
              onClick={() => watchlist.toggle(movie.id)}
              aria-label={saved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
              aria-pressed={saved}
              data-cursor="link"
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition-all duration-400",
                "opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 max-sm:translate-y-0 max-sm:opacity-100",
                saved
                  ? "border-cyan/50 bg-cyan/20 text-cyan"
                  : "border-white/15 bg-ink-950/50 text-fog-300 hover:text-fog-100",
              )}
            >
              <BookmarkGlyph filled={saved} />
            </button>
          </div>

          {/* play affordance — playback lives in the app, so this opens the hand-off */}
          <button
            type="button"
            onClick={() => open(movie)}
            data-cursor="play"
            aria-label={`Watch ${movie.title} in the AnimatedPrime app`}
            className="absolute left-1/2 top-1/2 z-20 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-full border border-white/25 bg-white/12 text-fog-100 opacity-0 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-100 group-hover:opacity-100 hover:bg-white/20 focus-visible:scale-100 focus-visible:opacity-100"
          >
            <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full border border-cyan/40" aria-hidden="true" />
            <PlayGlyph />
          </button>

          {/* details */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2.5 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.2em] text-fog-500 uppercase">
              <span className="text-cyan">{movie.genre[0]}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-fog-700" />
              <span>{movie.year}</span>
            </div>

            <h3 className="font-display text-[1.05rem] leading-tight font-bold tracking-[-0.02em] text-fog-100 sm:text-[1.15rem]">
              {movie.title}
            </h3>

            <div className="flex items-center gap-2.5 text-xs text-fog-500">
              <RatingBadge value={movie.rating} className="border-amber/20 px-2 py-0.5 text-[0.68rem]" />
              {movie.duration ? <span>{movie.duration}</span> : null}
              {movie.maturity ? (
                <span className="rounded border border-white/12 px-1.5 py-0.5 text-[0.6rem] tracking-wider">
                  {movie.maturity}
                </span>
              ) : null}
            </div>

            <p className="max-h-0 overflow-hidden text-[0.8rem] leading-relaxed text-fog-300/0 transition-all duration-600 ease-[cubic-bezier(.16,1,.3,1)] group-hover:max-h-24 group-hover:text-fog-300/90 max-sm:max-h-24 max-sm:text-fog-300/80">
              {movie.tagline}
            </p>

            <div className="mt-0.5 flex flex-wrap gap-1.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              {movie.genre.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.62rem] text-fog-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </article>
      </TiltCard>
    </div>
  );
}

const MovieCard = memo(MovieCardInner);
MovieCard.displayName = "MovieCard";

export default MovieCard;
