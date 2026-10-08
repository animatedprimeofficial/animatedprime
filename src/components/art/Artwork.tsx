"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import SceneArt, { type ArtDetail } from "@/components/art/SceneArt";
import type { Movie } from "@/lib/movies";
import { cn } from "@/lib/utils";

export interface ArtworkProps {
  movie: Movie;
  /** which official image to prefer */
  variant?: "poster" | "backdrop";
  /** intrinsic size the procedural fallback draws itself for */
  width?: number;
  height?: number;
  horizon?: number;
  detail?: ArtDetail;
  animate?: boolean;
  priority?: boolean;
  /** responsive sizes string for the official image */
  sizes?: string;
  className?: string;
  imageClassName?: string;
}

type Status = "loading" | "ready" | "error";

/**
 * What a card shows when its official artwork cannot be drawn at all.
 *
 * Deliberately brand-coloured rather than grey: a poster that 404s, or a CDN
 * that is blocked, should still read as AnimatedPrime rather than as a broken
 * image. Everything here is scale-independent CSS, so a wall of failed images
 * costs nothing to paint and looks the same at 3rem and at 46vw.
 */
function ArtworkFallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-ink-850">
      <div className="absolute inset-0 bg-[radial-gradient(120%_105%_at_16%_6%,rgba(124,92,255,0.26),transparent_58%),radial-gradient(110%_95%_at_88%_94%,rgba(70,229,255,0.18),transparent_62%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid aspect-square w-1/4 min-w-9 max-w-16 place-items-center rounded-[30%] border border-white/12 bg-white/[0.05]">
          <svg
            viewBox="0 0 24 24"
            className="h-[46%] w-[46%] text-fog-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <rect x="3" y="9.5" width="18" height="12" rx="2.5" />
            <path d="M3 12.5h18M7.5 9.5v3m5-3v3m5-3v3M7 9.5 8.6 4h6.8l1.6 5.5" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    </div>
  );
}

/**
 * A title's artwork.
 *
 * The official poster is the artwork — it is the only image painted on the
 * happy path, so a page full of titles costs one optimised image per card and
 * nothing else. While it is in flight a shimmering skeleton holds the space and
 * signals that something is arriving; if it never arrives a branded fallback
 * takes over instead of a broken frame.
 *
 * The procedural scene is kept for the one case it is genuinely the artwork
 * rather than a stand-in: a title with no official image at all (no catalogue
 * key configured, or a catalogue that ships without artwork). Then it is the
 * identity of the card, not a placeholder for something better.
 */
export default function Artwork({
  movie,
  variant = "poster",
  width = 800,
  height = 1200,
  horizon,
  detail = "simple",
  animate = false,
  priority = false,
  sizes = "(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 30vw",
  className,
  imageClassName,
}: ArtworkProps) {
  const source = variant === "poster" ? movie.posterUrl : movie.backdropUrl;
  const [status, setStatus] = useState<Status>("loading");

  // A different title — or a poster that arrives with a later catalogue — puts
  // the image back into flight instead of leaving the previous result on screen.
  useEffect(() => {
    setStatus("loading");
  }, [source]);

  const hasSource = Boolean(source);
  const showImage = hasSource && status !== "error";

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ink-850", className)}>
      {!hasSource ? (
        <SceneArt
          scene={movie.scene}
          palette={movie.palette}
          width={width}
          height={height}
          horizon={horizon}
          detail={detail}
          animate={animate}
          seed={`${movie.id}-${variant}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* In flight: hold the space and say so, then get out of the way. */}
      {hasSource && status === "loading" ? (
        <div aria-hidden="true" className="shimmer absolute inset-0 overflow-hidden" />
      ) : null}

      {/* Arrived broken: a branded tile keeps the wall reading as a collection. */}
      {hasSource && status === "error" ? <ArtworkFallback /> : null}

      {showImage ? (
        <Image
          src={source as string}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
            status === "ready" ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
        />
      ) : null}
    </div>
  );
}
