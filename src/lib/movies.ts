import type { PaletteId, SceneId } from "./palettes";

export interface Movie {
  id: string;
  title: string;
  /** one-line hook used on cards */
  tagline: string;
  description: string;
  /**
   * Artwork handles. AnimatedPrime renders its key art procedurally, so these
   * point at the generated scene + palette for the title. Dropping real assets
   * in later is a one-line swap inside `<Artwork />`.
   */
  poster: string;
  backdrop: string;
  genre: string[];
  rating: number;
  year: number;
  duration: string;
  maturity: string;
  scene: SceneId;
  palette: PaletteId;
  quality: string[];
  studio: string;
}

export const FEATURE_MOVIE = "sky-whale" as const;

export const MOVIES: Movie[] = [
  {
    id: "sky-whale",
    title: "The Last Sky Whale",
    tagline: "Some giants never touch the ground.",
    description:
      "When the last sky whale drifts out of the clouds, a lighthouse kid with a hand-built glider follows it into a stratosphere of floating ruins, forgotten gods and one impossible promise.",
    poster: "art://sky-whale/poster",
    backdrop: "art://sky-whale/backdrop",
    genre: ["Adventure", "Fantasy", "Family"],
    rating: 8.9,
    year: 2026,
    duration: "1h 58m",
    maturity: "PG",
    scene: "skywhale",
    palette: "violet-dusk",
    quality: ["4K HDR", "Dolby Atmos", "Original Score"],
    studio: "Aurora Lantern Studio",
  },
  {
    id: "aurora-nine",
    title: "Aurora Nine",
    tagline: "Nine lights. One way home.",
    description:
      "A salvage crew chases a ribbon of aurora across a dead ocean world, only to find the light is steering them somewhere deliberate.",
    poster: "art://aurora-nine/poster",
    backdrop: "art://aurora-nine/backdrop",
    genre: ["Sci-Fi", "Adventure", "Mystery"],
    rating: 8.6,
    year: 2025,
    duration: "2h 06m",
    maturity: "PG-13",
    scene: "aurora",
    palette: "midnight-aurora",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Northbound Pictures",
  },
  {
    id: "paper-moon",
    title: "Lumen & the Paper Moon",
    tagline: "Fold a sky. Find a home.",
    description:
      "A lantern-maker's apprentice folds a moon out of rice paper so the night will not be lonely — and accidentally folds the whole town inside it.",
    poster: "art://paper-moon/poster",
    backdrop: "art://paper-moon/backdrop",
    genre: ["Fantasy", "Family", "Animation"],
    rating: 8.4,
    year: 2024,
    duration: "1h 44m",
    maturity: "G",
    scene: "islands",
    palette: "candy-sky",
    quality: ["4K HDR", "Dolby Vision"],
    studio: "Petal & Pine",
  },
  {
    id: "neon-koi",
    title: "Neon Koi",
    tagline: "Swim upstream through the city.",
    description:
      "A courier with a koi tattoo deliveries a bag of impossible rain across a rain-slick megacity that rearranges itself every midnight.",
    poster: "art://neon-koi/poster",
    backdrop: "art://neon-koi/backdrop",
    genre: ["Action", "Sci-Fi", "Animation"],
    rating: 8.7,
    year: 2025,
    duration: "1h 51m",
    maturity: "PG-13",
    scene: "neon",
    palette: "neon-grid",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Kite Metal Works",
  },
  {
    id: "rocket-garden",
    title: "Grandpa's Rocket Garden",
    tagline: "Everything worth growing takes off eventually.",
    description:
      "Two siblings inherit a greenhouse full of half-finished rockets and one very stubborn, very sentimental robot gardener.",
    poster: "art://rocket-garden/poster",
    backdrop: "art://rocket-garden/backdrop",
    genre: ["Family", "Comedy", "Adventure"],
    rating: 8.1,
    year: 2024,
    duration: "1h 39m",
    maturity: "G",
    scene: "dunes",
    palette: "sunfield",
    quality: ["4K HDR", "Family Friendly"],
    studio: "Bright Halyard",
  },
  {
    id: "wandering-atlas",
    title: "The Wandering Atlas",
    tagline: "Every map wants to be walked.",
    description:
      "A living atlas escapes a library and drags a reluctant cartographer through the countries it was never allowed to finish drawing.",
    poster: "art://wandering-atlas/poster",
    backdrop: "art://wandering-atlas/backdrop",
    genre: ["Adventure", "Mystery", "Fantasy"],
    rating: 8.8,
    year: 2026,
    duration: "2h 12m",
    maturity: "PG",
    scene: "dunes",
    palette: "ember",
    quality: ["4K HDR", "Dolby Atmos", "Original Score"],
    studio: "Aurora Lantern Studio",
  },
  {
    id: "ember-hollow",
    title: "Ember Hollow",
    tagline: "Keep the fire small and the forest kind.",
    description:
      "In a valley where every tree keeps a memory burning, a girl trades her own recollections to save a forest that is starting to forget her.",
    poster: "art://ember-hollow/poster",
    backdrop: "art://ember-hollow/backdrop",
    genre: ["Fantasy", "Adventure", "Animation"],
    rating: 8.5,
    year: 2023,
    duration: "1h 47m",
    maturity: "PG",
    scene: "forest",
    palette: "mosslight",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Petal & Pine",
  },
  {
    id: "tidekeeper",
    title: "The Tidekeeper",
    tagline: "The ocean keeps everyone's secrets.",
    description:
      "Beneath a drowned metropolis, the last tidekeeper winds the currents by hand — until the machine that holds the sea back starts to run down.",
    poster: "art://tidekeeper/poster",
    backdrop: "art://tidekeeper/backdrop",
    genre: ["Adventure", "Family", "Fantasy"],
    rating: 8.3,
    year: 2025,
    duration: "1h 56m",
    maturity: "PG",
    scene: "reef",
    palette: "deep-reef",
    quality: ["4K HDR", "Dolby Vision"],
    studio: "Northbound Pictures",
  },
  {
    id: "clockwork-fox",
    title: "Clockwork Fox",
    tagline: "Wind it once. Trust it twice.",
    description:
      "A brass fox with a broken minute hand and a perfect nose investigates the one crime the city would rather forget.",
    poster: "art://clockwork-fox/poster",
    backdrop: "art://clockwork-fox/backdrop",
    genre: ["Mystery", "Fantasy", "Animation"],
    rating: 8.6,
    year: 2024,
    duration: "1h 42m",
    maturity: "PG",
    scene: "clockwork",
    palette: "candy-sky",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Hollow Lantern Co.",
  },
  {
    id: "static-bloom",
    title: "Static Bloom",
    tagline: "Something is growing in the signal.",
    description:
      "A radio engineer starts receiving weather reports from a garden that does not exist — and the plants are getting closer.",
    poster: "art://static-bloom/poster",
    backdrop: "art://static-bloom/backdrop",
    genre: ["Sci-Fi", "Mystery", "Animation"],
    rating: 8.2,
    year: 2026,
    duration: "1h 34m",
    maturity: "PG-13",
    scene: "neon",
    palette: "midnight-aurora",
    quality: ["4K HDR", "Spatial Audio"],
    studio: "Kite Metal Works",
  },
  {
    id: "moonpetal-heist",
    title: "Moonpetal Heist",
    tagline: "Steal the flower. Keep the spring.",
    description:
      "A crew of retired stage magicians reunites for one last job: lifting a single petal from the emperor's orbiting greenhouse.",
    poster: "art://moonpetal-heist/poster",
    backdrop: "art://moonpetal-heist/backdrop",
    genre: ["Comedy", "Action", "Adventure"],
    rating: 8.0,
    year: 2025,
    duration: "1h 48m",
    maturity: "PG",
    scene: "islands",
    palette: "ember",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Bright Halyard",
  },
  {
    id: "quiet-giants",
    title: "The Quiet Giants",
    tagline: "They only move when nobody is watching.",
    description:
      "Every full moon the mountain range takes one slow step. A shepherd's daughter decides to be the one person who watches properly.",
    poster: "art://quiet-giants/poster",
    backdrop: "art://quiet-giants/backdrop",
    genre: ["Family", "Fantasy", "Animation"],
    rating: 8.7,
    year: 2023,
    duration: "1h 41m",
    maturity: "G",
    scene: "dunes",
    palette: "violet-dusk",
    quality: ["4K HDR", "Dolby Vision"],
    studio: "Petal & Pine",
  },
  {
    id: "sunfall-symphony",
    title: "Sunfall Symphony",
    tagline: "Play the sunset back into place.",
    description:
      "When the sun stops setting, an orchestra of weather-makers must perform the one composition that convinces the sky to move again.",
    poster: "art://sunfall-symphony/poster",
    backdrop: "art://sunfall-symphony/backdrop",
    genre: ["Fantasy", "Family", "Animation"],
    rating: 8.5,
    year: 2026,
    duration: "1h 53m",
    maturity: "PG",
    scene: "dunes",
    palette: "sunfield",
    quality: ["4K HDR", "Dolby Atmos", "Original Score"],
    studio: "Aurora Lantern Studio",
  },
  {
    id: "pixel-pilgrims",
    title: "Pixel Pilgrims",
    tagline: "All the way to the edge of the level.",
    description:
      "Three NPCs who were never given names set out across a collapsing game world to find the player who abandoned them.",
    poster: "art://pixel-pilgrims/poster",
    backdrop: "art://pixel-pilgrims/backdrop",
    genre: ["Comedy", "Sci-Fi", "Adventure"],
    rating: 8.4,
    year: 2024,
    duration: "1h 37m",
    maturity: "PG",
    scene: "neon",
    palette: "candy-sky",
    quality: ["4K HDR", "Spatial Audio"],
    studio: "Kite Metal Works",
  },
  {
    id: "glass-compass",
    title: "The Glass Compass",
    tagline: "It doesn't point north. It points home.",
    description:
      "A navigator's daughter sails into a sea of glass to chase a compass that has been pointing at her since the day she was born.",
    poster: "art://glass-compass/poster",
    backdrop: "art://glass-compass/backdrop",
    genre: ["Adventure", "Mystery", "Family"],
    rating: 8.6,
    year: 2025,
    duration: "2h 01m",
    maturity: "PG",
    scene: "reef",
    palette: "violet-dusk",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Hollow Lantern Co.",
  },
  {
    id: "midnight-menagerie",
    title: "Midnight Menagerie",
    tagline: "The zoo opens when the keepers sleep.",
    description:
      "A shy night-shift kid discovers the closed zoo runs its own parliament after dark — and they are about to vote on something enormous.",
    poster: "art://midnight-menagerie/poster",
    backdrop: "art://midnight-menagerie/backdrop",
    genre: ["Fantasy", "Comedy", "Family"],
    rating: 8.3,
    year: 2026,
    duration: "1h 45m",
    maturity: "G",
    scene: "forest",
    palette: "candy-sky",
    quality: ["4K HDR", "Family Friendly"],
    studio: "Hollow Lantern Co.",
  },
];

export const FEATURE_MOVIES = [
  "sky-whale",
  "wandering-atlas",
  "aurora-nine",
  "neon-koi",
  "paper-moon",
  "ember-hollow",
].map((id) => MOVIES.find((m) => m.id === id)!);

export const TRENDING_MOVIES = [
  "wandering-atlas",
  "neon-koi",
  "sky-whale",
  "quiet-giants",
  "sunfall-symphony",
  "clockwork-fox",
  "midnight-menagerie",
].map((id) => MOVIES.find((m) => m.id === id)!);

export function getMovie(id: string): Movie | undefined {
  return MOVIES.find((m) => m.id === id);
}

export const HERO_MOVIE = getMovie(FEATURE_MOVIE)!;

/* ------------------------------------------------------------------ *
 * Genres
 * ------------------------------------------------------------------ */
export interface Genre {
  name: string;
  blurb: string;
  scene: SceneId;
  palette: PaletteId;
}

export const GENRES: Genre[] = [
  {
    name: "Adventure",
    blurb: "Horizons with no return address",
    scene: "dunes",
    palette: "ember",
  },
  {
    name: "Comedy",
    blurb: "Gags with genuine heart",
    scene: "dunes",
    palette: "sunfield",
  },
  {
    name: "Fantasy",
    blurb: "Magic with rules worth breaking",
    scene: "islands",
    palette: "candy-sky",
  },
  {
    name: "Action",
    blurb: "Kinetic, weightless, glorious",
    scene: "neon",
    palette: "neon-grid",
  },
  {
    name: "Family",
    blurb: "Stories for every seat on the sofa",
    scene: "forest",
    palette: "mosslight",
  },
  {
    name: "Animation",
    blurb: "Drawn by hand, dreamt in colour",
    scene: "skywhale",
    palette: "violet-dusk",
  },
  {
    name: "Sci-Fi",
    blurb: "Tomorrow, animated",
    scene: "aurora",
    palette: "midnight-aurora",
  },
  {
    name: "Mystery",
    blurb: "Wait for the last frame",
    scene: "clockwork",
    palette: "midnight-aurora",
  },
];

export function genreCount(name: string): number {
  return MOVIES.filter((m) => m.genre.includes(name)).length;
}

export const QUALITY_BADGES = [
  "4K HDR",
  "Dolby Atmos",
  "Offline Downloads",
  "Family Profiles",
];
