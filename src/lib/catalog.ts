import "server-only";
import { cache } from "react";
import {
  LOCAL_MOVIES,
  pickHero,
  pickRails,
  type Movie,
} from "@/lib/movies";
import { TMDB_ATTRIBUTION, loadTmdbCatalog } from "@/lib/tmdb";

export interface Catalog {
  movies: Movie[];
  hero: Movie;
  featured: Movie[];
  trending: Movie[];
  source: "tmdb" | "local";
  /** shown in the footer when live metadata is in use */
  attribution?: string;
}

function localCatalog(): Catalog {
  const { featured, trending } = pickRails(LOCAL_MOVIES);
  return {
    movies: LOCAL_MOVIES,
    hero: pickHero(LOCAL_MOVIES),
    featured,
    trending,
    source: "local",
  };
}

/**
 * The single source of movie data for the whole site.
 *
 * Live TMDB metadata when a key is configured and reachable; the curated
 * offline catalogue otherwise. Every failure mode degrades instead of throwing,
 * so a missing key, an expired token or a TMDB outage can never take the page
 * down — it just gets quieter.
 */
export const getCatalog = cache(async (): Promise<Catalog> => {
  try {
    const live = await loadTmdbCatalog();
    if (live && live.movies.length >= 8) {
      return {
        ...live,
        source: "tmdb",
        attribution: TMDB_ATTRIBUTION,
      };
    }
  } catch {
    /* fall through to the offline catalogue */
  }
  return localCatalog();
});
