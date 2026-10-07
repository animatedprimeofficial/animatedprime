"use client";

import Image from "next/image";
import { useState } from "react";
import SceneArt, { type ArtDetail } from "@/components/art/SceneArt";
import type { Movie } from "@/lib/movies";
import { cn } from "@/lib/utils";

export interface ArtworkProps {
  movie: Movie;
  /** which official image to prefer, and the aspect the procedural art is drawn for */
  variant?: "poster" | "backdrop";
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

/**
 * A title's artwork.
 *
 * The generated key art always renders first and stays in the DOM: it is the
 * instant placeholder, the graceful failure mode when an official image 404s or
 * the CDN is blocked, and the entire identity of the site when no catalogue key
 * is configured. The official poster fades in on top once it has loaded.
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
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = variant === "poster" ? movie.posterUrl : movie.backdropUrl;
  const showImage = Boolean(source) && !failed;

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
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

      {showImage ? (
        <Image
          src={source as string}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
        />
      ) : null}
    </div>
  );
}
