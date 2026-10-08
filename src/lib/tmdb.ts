import "server-only";
import type { PaletteId, SceneId } from "@/lib/palettes";
import type { Movie } from "@/lib/movies";

/**
 * TMDB client.
 *
 * IMDb has no public API, so real metadata + official artwork come from TMDB
 * (the same titles, the same posters you would see on IMDb, served from
 * image.tmdb.org under TMDB's terms). Everything here is optional at runtime:
 * with no key configured — or if TMDB is unreachable — `getCatalog()` silently
 * falls back to the curated offline catalogue, so the site never breaks.
 *
 * Attribution is required by TMDB's terms and lives in the site footer.
 */

const API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const TMDB_ATTRIBUTION =
  "This product uses the TMDB API but is not endorsed or certified by TMDB.";

const REVALIDATE_SECONDS = 60 * 60; // one hour
const ANIMATION_GENRE_ID = 16;

export function hasTmdbCredentials(): boolean {
  return Boolean(process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN);
}

export function tmdbImage(path: string | null | undefined, size: string): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/* ------------------------------------------------------------------ *
 * Genre + language mapping
 * ------------------------------------------------------------------ */
const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Mystery",
  99: "Animation",
  18: "Mystery",
  10751: "Family",
  14: "Fantasy",
  36: "Adventure",
  27: "Mystery",
  10402: "Family",
  9648: "Mystery",
  10749: "Fantasy",
  878: "Sci-Fi",
  10770: "Family",
  53: "Mystery",
  10752: "Action",
  37: "Adventure",
};

const CANONICAL_ORDER = [
  "Adventure",
  "Comedy",
  "Fantasy",
  "Action",
  "Family",
  "Animation",
  "Sci-Fi",
  "Mystery",
];

const LANGUAGES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  fr: "French",
  ko: "Korean",
  zh: "Chinese",
  es: "Spanish",
  de: "German",
  it: "Italian",
  hi: "Hindi",
};

function mapGenres(ids: number[]): string[] {
  const names = new Set<string>();
  ids.forEach((id) => {
    const name = TMDB_GENRES[id];
    if (name) names.add(name);
  });
  if (!names.size) names.add("Animation");
  return CANONICAL_ORDER.filter((name) => names.has(name));
}

/* ------------------------------------------------------------------ *
 * Procedural identity
 *
 * Live titles still need a deterministic scene + palette so the fallback
 * artwork, the 3D poster textures and the genre rails all have an identity
 * even when no official image is available.
 * ------------------------------------------------------------------ */
const SCENE_BY_GENRE: Record<string, SceneId> = {
  Action: "neon",
  Adventure: "dunes",
  Comedy: "islands",
  Fantasy: "islands",
  Family: "forest",
  "Sci-Fi": "aurora",
  Mystery: "clockwork",
  Animation: "skywhale",
};

const PALETTES: PaletteId[] = [
  "violet-dusk",
  "ember",
  "deep-reef",
  "mosslight",
  "candy-sky",
  "neon-grid",
  "midnight-aurora",
  "sunfield",
  "rose-neon",
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deriveScene(genres: string[], seed: string, language?: string): SceneId {
  if (language === "Japanese" && !genres.includes("Family")) {
    const animeScenes: SceneId[] = ["aurora", "neon", "forest", "clockwork"];
    return animeScenes[hash(seed) % animeScenes.length];
  }
  const primary = genres[0] ?? "Animation";
  return SCENE_BY_GENRE[primary] ?? "skywhale";
}

export function derivePalette(seed: string, language?: string): PaletteId {
  const index = hash(`${seed}-palette`) % PALETTES.length;
  if (language === "Japanese") return PALETTES[(index + 2) % PALETTES.length];
  return PALETTES[index];
}

/* ------------------------------------------------------------------ *
 * Transport
 * ------------------------------------------------------------------ */
interface TmdbResult {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  tagline?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  runtime?: number;
  original_language?: string;
  production_companies?: { name: string }[];
  release_dates?: {
    results?: { iso_3166_1: string; release_dates: { certification?: string }[] }[];
  };
  popularity?: number;
}

async function tmdbGet<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T | null> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  if (!token && !apiKey) return null;

  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set("api_key", apiKey as string);

  try {
    const response = await fetch(url.toString(), {
      headers,
      // Cached and revalidated on the server; the browser never sees the key.
      next: { revalidate: REVALIDATE_SECONDS, tags: ["tmdb"] },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Mapping
 * ------------------------------------------------------------------ */
function formatRuntime(minutes?: number): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function certification(result: TmdbResult): string | undefined {
  const us = result.release_dates?.results?.find((entry) => entry.iso_3166_1 === "US");
  const cert = us?.release_dates?.map((entry) => entry.certification).find((value) => value);
  return cert || undefined;
}

/** AnimatedPrime's own delivery promise for a title. */
function qualityFor(rating: number, votes = 0): string[] {
  const quality = ["4K HDR"];
  if (rating >= 7.4) quality.push("Dolby Atmos");
  if (votes > 4000) quality.push("Original Score");
  if (rating >= 8) quality.push("Dolby Vision");
  return quality.slice(0, 3);
}

export function mapTmdbMovie(result: TmdbResult): Movie | null {
  if (!result || !result.id || !result.title) return null;
  const genreIds = result.genre_ids ?? result.genres?.map((genre) => genre.id) ?? [];
  const genre = mapGenres(genreIds);
  const language = LANGUAGES[result.original_language ?? "en"] ?? "English";
  const seed = `${result.id}-${result.title}`;
  const rating = Number((result.vote_average ?? 0).toFixed(1));
  const year = Number((result.release_date ?? "").slice(0, 4)) || new Date().getFullYear();

  return {
    id: `tmdb-${result.id}`,
    tmdbId: result.id,
    title: result.title,
    originalTitle: result.original_title !== result.title ? result.original_title : undefined,
    tagline: result.tagline?.trim() || result.overview?.split(". ")[0]?.slice(0, 120) || genre.join(" · "),
    description: result.overview?.trim() || "No synopsis has been published for this title yet.",
    poster: `tmdb://${result.id}/poster`,
    backdrop: `tmdb://${result.id}/backdrop`,
    // w780 rather than w500: the hero key art is displayed wider than 500 CSS
    // px (and wider still on a retina display), so a w500 master was being
    // upscaled and read soft on the most important image on the site. The
    // optimiser still serves a per-slot variant to the browser, so smaller
    // cards cost the same bytes as before.
    posterUrl: tmdbImage(result.poster_path, "w780"),
    backdropUrl: tmdbImage(result.backdrop_path, "w1280"),
    genre,
    rating,
    votes: result.vote_count,
    year,
    duration: formatRuntime(result.runtime),
    maturity: certification(result),
    scene: deriveScene(genre, seed, language),
    palette: derivePalette(seed, language),
    quality: qualityFor(rating, result.vote_count),
    studio: result.production_companies?.[0]?.name,
    language,
    anime: result.original_language === "ja",
    source: "tmdb",
  };
}

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */
const DISCOVER_BASE = {
  with_genres: ANIMATION_GENRE_ID,
  include_adult: false,
  "vote_count.gte": 120,
} as const;

interface TmdbListResponse {
  results?: TmdbResult[];
}

async function discover(
  sortBy: string,
  extra: Record<string, string | number | boolean> = {},
): Promise<Movie[]> {
  const payload = await tmdbGet<TmdbListResponse>("/discover/movie", {
    ...DISCOVER_BASE,
    sort_by: sortBy,
    ...extra,
  });
  return (payload?.results ?? []).map(mapTmdbMovie).filter((movie): movie is Movie => Boolean(movie));
}

async function enrich(movie: Movie): Promise<Movie> {
  if (!movie.tmdbId) return movie;
  const detail = await tmdbGet<TmdbResult>(`/movie/${movie.tmdbId}`, {
    append_to_response: "release_dates",
  });
  if (!detail) return movie;
  const merged = mapTmdbMovie(detail);
  return merged ? { ...movie, ...merged, quality: movie.quality } : movie;
}

function dedupe(movies: Movie[]): Movie[] {
  const seen = new Map<string, Movie>();
  movies.forEach((movie) => {
    const existing = seen.get(movie.id);
    if (!existing || (movie.duration && !existing.duration)) seen.set(movie.id, movie);
  });
  return [...seen.values()];
}

export interface TmdbCatalog {
  movies: Movie[];
  hero: Movie;
  featured: Movie[];
  trending: Movie[];
}

/**
 * Builds a catalogue from live TMDB data: recent popular animation, top rated
 * animation, new releases and anime. Returns `null` on any failure so the
 * caller can fall back to the offline catalogue.
 */
export async function loadTmdbCatalog(): Promise<TmdbCatalog | null> {
  if (!hasTmdbCredentials()) return null;

  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 183).toISOString().slice(0, 10);

  const [popular, recent, topRated, animePopular, animeTop] = await Promise.all([
    discover("popularity.desc"),
    discover("primary_release_date.desc", {
      "primary_release_date.gte": sixMonthsAgo,
      "primary_release_date.lte": today,
      "vote_count.gte": 40,
    }),
    discover("vote_average.desc", { "vote_count.gte": 900 }),
    // Japanese animation is queried on its own terms — once for what is being
    // watched now, once for what is actually good — so the anime shelf is not
    // just whatever the general animation charts happen to surface.
    discover("popularity.desc", { with_original_language: "ja" }),
    discover("vote_average.desc", {
      with_original_language: "ja",
      "vote_count.gte": 400,
    }),
  ]);

  const pool = dedupe([...popular, ...recent, ...topRated, ...animePopular, ...animeTop]).filter(
    (movie) => movie.rating > 0 && movie.year > 1970,
  );
  if (pool.length < 8) return null;

  const featuredCandidates = [...pool]
    .sort((a, b) => b.rating - a.rating || (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 6);
  const heroSource =
    [...pool]
      .filter((movie) => movie.rating >= 7.6 && (movie.votes ?? 0) > 800)
      .sort(
        (a, b) =>
          b.rating * 0.6 + Math.min(b.votes ?? 0, 30000) / 30000 -
          (a.rating * 0.6 + Math.min(a.votes ?? 0, 30000) / 30000),
      )[0] ?? featuredCandidates[0];

  // Detail lookups are expensive, so only the hero + featured rail get them:
  // that is where runtime, certification and studio actually appear.
  const enriched = await Promise.all([heroSource, ...featuredCandidates.slice(0, 6)].map(enrich));
  const [hero, ...featured] = enriched;

  const enrichedById = new Map(enriched.map((movie) => [movie.id, movie]));
  const movies = pool.map((movie) => enrichedById.get(movie.id) ?? movie);

  const trending = [...movies]
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 7);

  return { movies, hero, featured: dedupe(featured).slice(0, 6), trending };
}
