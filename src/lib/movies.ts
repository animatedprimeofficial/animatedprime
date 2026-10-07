import type { PaletteId, SceneId } from "./palettes";

/**
 * A title as the UI understands it.
 *
 * `posterUrl` / `backdropUrl` carry official artwork when live metadata is
 * available (TMDB). When they are absent — no API key, offline build, an image
 * that fails to load — `<Artwork />` falls back to the procedurally generated
 * key art described by `scene` + `palette`, so a title is never a blank box.
 */
export interface Movie {
  id: string;
  /** TMDB id when the row came from live metadata */
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  /** one-line hook used on cards */
  tagline: string;
  description: string;
  /** artwork handles (procedural fallback identity) */
  poster: string;
  backdrop: string;
  /** official artwork, when available */
  posterUrl?: string;
  backdropUrl?: string;
  genre: string[];
  /** 0–10, IMDb-style scale */
  rating: number;
  votes?: number;
  year: number;
  /** absent when the provider only returns list-level data */
  duration?: string;
  /** absent unless the title was enriched with a detail lookup */
  maturity?: string;
  scene: SceneId;
  palette: PaletteId;
  /**
   * AnimatedPrime's own delivery specs for the title: our 4K/Dolby promise,
   * not metadata from the catalogue provider.
   */
  quality: string[];
  studio?: string;
  language?: string;
  /**
   * Japanese-origin animation. Tracked explicitly rather than inferred, because
   * the anime rail is a first-class shelf here: this library is films *and*
   * anime, not a cartoon shelf with a Japanese corner.
   */
  anime?: boolean;
  source: "tmdb" | "local";
}

/**
 * Curated offline catalogue: eighteen genuine animated features and anime.
 * Years, runtimes and ratings are indicative public values; the synopses are
 * written for this demo rather than copied. Live TMDB data replaces this set
 * whenever an API key is configured.
 */
export const LOCAL_MOVIES: Movie[] = [
  {
    id: "spirited-away",
    title: "Spirited Away",
    originalTitle: "千と千尋の神隠し",
    tagline: "A door in the woods, and a world that runs on names.",
    description:
      "A sulky ten-year-old wanders into a bathhouse for spirits and has to work for her freedom — and for the name the place has taken from her.",
    poster: "art://spirited-away/poster",
    backdrop: "art://spirited-away/backdrop",
    genre: ["Fantasy", "Adventure", "Family"],
    rating: 8.6,
    year: 2001,
    duration: "2h 5m",
    maturity: "PG",
    scene: "islands",
    palette: "candy-sky",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Studio Ghibli",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "into-the-spider-verse",
    title: "Spider-Man: Into the Spider-Verse",
    tagline: "Anyone can wear the mask.",
    description:
      "Miles Morales gets bitten, gets powers and gets a lot of company when every dimension starts dropping its own Spider-Man into his city.",
    poster: "art://into-the-spider-verse/poster",
    backdrop: "art://into-the-spider-verse/backdrop",
    genre: ["Action", "Adventure", "Animation"],
    rating: 8.4,
    year: 2018,
    duration: "1h 57m",
    maturity: "PG",
    scene: "neon",
    palette: "neon-grid",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Sony Pictures Animation",
    language: "English",
    source: "local",
  },
  {
    id: "your-name",
    title: "Your Name.",
    originalTitle: "君の名は。",
    tagline: "Two lives, one sky, an impossible distance.",
    description:
      "A boy in Tokyo and a girl in the mountains start waking up in each other's bodies — and then the comet arrives.",
    poster: "art://your-name/poster",
    backdrop: "art://your-name/backdrop",
    genre: ["Fantasy", "Mystery", "Animation"],
    rating: 8.4,
    year: 2016,
    duration: "1h 46m",
    maturity: "PG",
    scene: "aurora",
    palette: "midnight-aurora",
    quality: ["4K HDR", "Original Score"],
    studio: "CoMix Wave Films",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "princess-mononoke",
    title: "Princess Mononoke",
    originalTitle: "もののけ姫",
    tagline: "A forest that bites back.",
    description:
      "A cursed prince walks west into a war between an iron town that will not stop cutting and the gods of the forest that will not surrender.",
    poster: "art://princess-mononoke/poster",
    backdrop: "art://princess-mononoke/backdrop",
    genre: ["Fantasy", "Adventure", "Animation"],
    rating: 8.3,
    year: 1997,
    duration: "2h 14m",
    maturity: "PG-13",
    scene: "forest",
    palette: "mosslight",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Studio Ghibli",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "toy-story",
    title: "Toy Story",
    tagline: "The first toys to have feelings about it.",
    description:
      "A cowboy and a space ranger fight for the top of a child's affections, then have to rescue each other instead.",
    poster: "art://toy-story/poster",
    backdrop: "art://toy-story/backdrop",
    genre: ["Family", "Comedy", "Adventure"],
    rating: 8.3,
    year: 1995,
    duration: "1h 21m",
    maturity: "G",
    scene: "islands",
    palette: "sunfield",
    quality: ["4K HDR", "Family Friendly"],
    studio: "Pixar",
    language: "English",
    source: "local",
  },
  {
    id: "coco",
    title: "Coco",
    tagline: "Memory is the only thing the other side needs.",
    description:
      "A boy who plays guitar behind his family's back crosses into the Land of the Dead on Día de los Muertos to find the musician he is sure he descends from.",
    poster: "art://coco/poster",
    backdrop: "art://coco/backdrop",
    genre: ["Family", "Fantasy", "Adventure"],
    rating: 8.4,
    year: 2017,
    duration: "1h 45m",
    maturity: "PG",
    scene: "neon",
    palette: "ember",
    quality: ["4K HDR", "Dolby Atmos", "Original Score"],
    studio: "Pixar",
    language: "English",
    source: "local",
  },
  {
    id: "howls-moving-castle",
    title: "Howl's Moving Castle",
    tagline: "A moving house, a stolen heart, a very tired wizard.",
    description:
      "Cursed into old age, a hat-maker keeps house for a vain wizard whose castle walks and whose heart is not entirely his.",
    poster: "art://howls-moving-castle/poster",
    backdrop: "art://howls-moving-castle/backdrop",
    genre: ["Fantasy", "Adventure", "Animation"],
    rating: 8.2,
    year: 2004,
    duration: "1h 59m",
    maturity: "PG",
    scene: "islands",
    palette: "violet-dusk",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Studio Ghibli",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "my-neighbor-totoro",
    title: "My Neighbor Totoro",
    tagline: "Something enormous is being very gentle nearby.",
    description:
      "Two sisters in a country house meet the forest spirit who lives in the camphor tree, and the rain, and the night bus that runs on fur.",
    poster: "art://my-neighbor-totoro/poster",
    backdrop: "art://my-neighbor-totoro/backdrop",
    genre: ["Family", "Fantasy", "Animation"],
    rating: 8.1,
    year: 1988,
    duration: "1h 26m",
    maturity: "G",
    scene: "forest",
    palette: "candy-sky",
    quality: ["4K HDR", "Family Friendly"],
    studio: "Studio Ghibli",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "akira",
    title: "Akira",
    tagline: "Neo-Tokyo is about to remember its own name.",
    description:
      "A biker's best friend is taken by the military and comes back wrong, and a city built on a crater starts counting down again.",
    poster: "art://akira/poster",
    backdrop: "art://akira/backdrop",
    genre: ["Sci-Fi", "Action", "Animation"],
    rating: 8.0,
    year: 1988,
    duration: "2h 4m",
    maturity: "R",
    scene: "neon",
    palette: "rose-neon",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "TMS Entertainment",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "ghost-in-the-shell",
    title: "Ghost in the Shell",
    tagline: "What is left of you when your body is optional?",
    description:
      "A cyborg officer hunts a hacker who rewrites people's memories, and starts wondering how much of her own file is authored.",
    poster: "art://ghost-in-the-shell/poster",
    backdrop: "art://ghost-in-the-shell/backdrop",
    genre: ["Sci-Fi", "Action", "Mystery"],
    rating: 7.9,
    year: 1995,
    duration: "1h 23m",
    maturity: "R",
    scene: "reef",
    palette: "deep-reef",
    quality: ["4K HDR", "Spatial Audio"],
    studio: "Production I.G",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "wall-e",
    title: "WALL·E",
    tagline: "The last tidy robot on a very untidy planet.",
    description:
      "Seven hundred years after the evacuation, a compactor who collects interesting rubbish falls in love with a scanner and accidentally saves everyone.",
    poster: "art://wall-e/poster",
    backdrop: "art://wall-e/backdrop",
    genre: ["Family", "Adventure", "Sci-Fi"],
    rating: 8.4,
    year: 2008,
    duration: "1h 38m",
    maturity: "G",
    scene: "dunes",
    palette: "sunfield",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Pixar",
    language: "English",
    source: "local",
  },
  {
    id: "wolfwalkers",
    title: "Wolfwalkers",
    tagline: "By day a girl, by night the whole forest.",
    description:
      "A hunter's daughter befriends a wild girl who leaves her body behind at night, in a town that is busy cutting the woods down.",
    poster: "art://wolfwalkers/poster",
    backdrop: "art://wolfwalkers/backdrop",
    genre: ["Fantasy", "Adventure", "Family"],
    rating: 8.0,
    year: 2020,
    duration: "1h 43m",
    maturity: "PG",
    scene: "forest",
    palette: "mosslight",
    quality: ["4K HDR", "Hand Drawn"],
    studio: "Cartoon Saloon",
    language: "English",
    source: "local",
  },
  {
    id: "mugen-train",
    title: "Demon Slayer: Mugen Train",
    originalTitle: "劇場版 鬼滅の刃 無限列車編",
    tagline: "Forty passengers, one demon, no way off.",
    description:
      "A night train through the mountains becomes a trap built out of the travellers' own happiest memories.",
    poster: "art://mugen-train/poster",
    backdrop: "art://mugen-train/backdrop",
    genre: ["Action", "Fantasy", "Animation"],
    rating: 8.2,
    year: 2020,
    duration: "1h 57m",
    maturity: "R",
    scene: "neon",
    palette: "ember",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "ufotable",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "the-boy-and-the-heron",
    title: "The Boy and the Heron",
    originalTitle: "君たちはどう生きるか",
    tagline: "Grief keeps a door open somewhere.",
    description:
      "After his mother dies in the war, a boy follows a talking heron past a tower in the garden and into the workshop where worlds are stacked.",
    poster: "art://the-boy-and-the-heron/poster",
    backdrop: "art://the-boy-and-the-heron/backdrop",
    genre: ["Fantasy", "Adventure", "Animation"],
    rating: 7.4,
    year: 2023,
    duration: "2h 4m",
    maturity: "PG-13",
    scene: "islands",
    palette: "midnight-aurora",
    quality: ["4K HDR", "Dolby Atmos", "Original Score"],
    studio: "Studio Ghibli",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "kung-fu-panda",
    title: "Kung Fu Panda",
    tagline: "There is no secret ingredient.",
    description:
      "A noodle-shop panda is named Dragon Warrior by accident and has to become one on purpose, with a grumpy master and five unimpressed colleagues.",
    poster: "art://kung-fu-panda/poster",
    backdrop: "art://kung-fu-panda/backdrop",
    genre: ["Comedy", "Action", "Family"],
    rating: 7.6,
    year: 2008,
    duration: "1h 32m",
    maturity: "PG",
    scene: "dunes",
    palette: "ember",
    quality: ["4K HDR", "Family Friendly"],
    studio: "DreamWorks Animation",
    language: "English",
    source: "local",
  },
  {
    id: "ratatouille",
    title: "Ratatouille",
    tagline: "Anyone can cook — which is the scandalous part.",
    description:
      "A rat with a better palate than the kitchen he haunts teams up with the worst dishwasher in Paris.",
    poster: "art://ratatouille/poster",
    backdrop: "art://ratatouille/backdrop",
    genre: ["Comedy", "Family", "Animation"],
    rating: 8.1,
    year: 2007,
    duration: "1h 51m",
    maturity: "G",
    scene: "neon",
    palette: "violet-dusk",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Pixar",
    language: "English",
    source: "local",
  },
  {
    id: "perfect-blue",
    title: "Perfect Blue",
    tagline: "Someone is keeping a very detailed diary of you.",
    description:
      "A pop idol turns actress, and the line between the role, the fan and the woman starts to dissolve on camera.",
    poster: "art://perfect-blue/poster",
    backdrop: "art://perfect-blue/backdrop",
    genre: ["Mystery", "Fantasy", "Animation"],
    rating: 8.0,
    year: 1997,
    duration: "1h 21m",
    maturity: "R",
    scene: "clockwork",
    palette: "midnight-aurora",
    quality: ["4K HDR", "Spatial Audio"],
    studio: "Madhouse",
    language: "Japanese",
    anime: true,
    source: "local",
  },
  {
    id: "the-red-turtle",
    title: "The Red Turtle",
    tagline: "No dialogue. All tide.",
    description:
      "A castaway's attempts to leave a small island are undone by a giant turtle, and the life he ends up building there.",
    poster: "art://the-red-turtle/poster",
    backdrop: "art://the-red-turtle/backdrop",
    genre: ["Adventure", "Family", "Fantasy"],
    rating: 7.4,
    year: 2016,
    duration: "1h 20m",
    maturity: "PG",
    scene: "reef",
    palette: "deep-reef",
    quality: ["4K HDR", "Dolby Atmos"],
    studio: "Studio Ghibli · Wild Bunch",
    language: "None",
    source: "local",
  },
  {
    id: "ernest-and-celestine",
    title: "Ernest & Celestine",
    tagline: "A bear and a mouse agree not to be afraid.",
    description:
      "A hungry bear and a dentist-in-training mouse become outlaws in each other's worlds and heroes in both.",
    poster: "art://ernest-and-celestine/poster",
    backdrop: "art://ernest-and-celestine/backdrop",
    genre: ["Family", "Comedy", "Adventure"],
    rating: 7.8,
    year: 2012,
    duration: "1h 20m",
    maturity: "PG",
    scene: "clockwork",
    palette: "candy-sky",
    quality: ["4K HDR", "Hand Drawn"],
    studio: "Les Armateurs",
    language: "French",
    source: "local",
  },
];

/** Genres used by the explorer filter row. */
export interface Genre {
  name: string;
  blurb: string;
  scene: SceneId;
  palette: PaletteId;
}

export const GENRES: Genre[] = [
  { name: "Adventure", blurb: "Horizons with no return address", scene: "dunes", palette: "ember" },
  { name: "Comedy", blurb: "Gags with genuine heart", scene: "dunes", palette: "sunfield" },
  { name: "Fantasy", blurb: "Magic with rules worth breaking", scene: "islands", palette: "candy-sky" },
  { name: "Action", blurb: "Kinetic, weightless, glorious", scene: "neon", palette: "neon-grid" },
  { name: "Family", blurb: "Stories for every seat on the sofa", scene: "forest", palette: "mosslight" },
  { name: "Animation", blurb: "Drawn by hand, dreamt in colour", scene: "skywhale", palette: "violet-dusk" },
  { name: "Sci-Fi", blurb: "Tomorrow, animated", scene: "aurora", palette: "midnight-aurora" },
  { name: "Mystery", blurb: "Wait for the last frame", scene: "clockwork", palette: "midnight-aurora" },
];

export const QUALITY_BADGES = [
  "4K HDR",
  "Dolby Atmos",
  "Offline Downloads",
  "Family Profiles",
];

/* ------------------------------------------------------------------ *
 * Helpers that work against any catalogue (local or live)
 * ------------------------------------------------------------------ */

export function genreCount(movies: Movie[], name: string): number {
  return movies.filter((movie) => movie.genre.includes(name)).length;
}

export function pickHero(movies: Movie[]): Movie {
  return (
    [...movies]
      .sort((a, b) => b.rating * 0.72 + Math.min(b.votes ?? 0, 20000) / 20000 - (a.rating * 0.72 + Math.min(a.votes ?? 0, 20000) / 20000))[0] ??
    movies[0]
  );
}

export function pickRails(movies: Movie[]) {
  const featured = [...movies]
    .sort((a, b) => b.rating - a.rating || b.year - a.year)
    .slice(0, 6);
  const trending = [...movies]
    .sort((a, b) => (b.votes ?? b.rating * 100) - (a.votes ?? a.rating * 100))
    .slice(0, 7);
  return { featured, trending };
}

/** The anime shelf: best-rated Japanese animation, most-voted first on a tie. */
export function pickAnime(movies: Movie[], count = 7): Movie[] {
  return [...movies]
    .filter((movie) => movie.anime)
    .sort((a, b) => b.rating - a.rating || (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, count);
}
