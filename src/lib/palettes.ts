/**
 * Art direction palettes.
 *
 * AnimatedPrime ships its artwork procedurally (see `components/art/SceneArt.tsx`)
 * so the landing page is fully self-contained, crisp at any resolution and
 * completely original. Palettes here are the single source of truth for a
 * title's colour identity — the same palette drives the DOM artwork AND the
 * WebGL poster textures, so a movie looks like itself everywhere.
 */
export type PaletteId =
  | "violet-dusk"
  | "ember"
  | "deep-reef"
  | "mosslight"
  | "candy-sky"
  | "neon-grid"
  | "midnight-aurora"
  | "sunfield"
  | "rose-neon";

export interface Palette {
  /** sky gradient, dark → light */
  sky: [string, string, string];
  /** low, warm light source (sun / moon halo) */
  glow: string;
  /** primary accent (glowing orbs, rim light, signage) */
  accent: string;
  /** secondary accent */
  accent2: string;
  /** silhouette / foreground ink */
  ink: string;
  /** readable label on the palette background */
  tint: "cool" | "warm";
}

export const PALETTES: Record<PaletteId, Palette> = {
  "violet-dusk": {
    sky: ["#120a2e", "#3a2270", "#8c6bff"],
    glow: "#ffb37a",
    accent: "#46e5ff",
    accent2: "#ff5ca8",
    ink: "#05060f",
    tint: "cool",
  },
  ember: {
    sky: ["#22071f", "#6c1a44", "#ff8a4c"],
    glow: "#ffd08a",
    accent: "#ff5ca8",
    accent2: "#ffa24c",
    ink: "#120616",
    tint: "warm",
  },
  "deep-reef": {
    sky: ["#03101d", "#0a3550", "#1290a0"],
    glow: "#a8f6ff",
    accent: "#5cf2c0",
    accent2: "#46e5ff",
    ink: "#020a12",
    tint: "cool",
  },
  mosslight: {
    sky: ["#03130e", "#0c3a2b", "#1f8a5c"],
    glow: "#d8ff9a",
    accent: "#5cf2c0",
    accent2: "#ffe27a",
    ink: "#020b08",
    tint: "cool",
  },
  "candy-sky": {
    sky: ["#241040", "#6633a3", "#ff9ccb"],
    glow: "#ffe6a7",
    accent: "#46e5ff",
    accent2: "#ff5ca8",
    ink: "#150726",
    tint: "warm",
  },
  "neon-grid": {
    sky: ["#050618", "#171a4a", "#3b2f8f"],
    glow: "#46e5ff",
    accent: "#ff5ca8",
    accent2: "#46e5ff",
    ink: "#02030c",
    tint: "cool",
  },
  "midnight-aurora": {
    sky: ["#02040c", "#08163a", "#123c6b"],
    glow: "#5cf2c0",
    accent: "#7c5cff",
    accent2: "#46e5ff",
    ink: "#010207",
    tint: "cool",
  },
  sunfield: {
    sky: ["#241605", "#8a4a18", "#ffc25c"],
    glow: "#fff0b8",
    accent: "#ff5ca8",
    accent2: "#ffa24c",
    ink: "#140c05",
    tint: "warm",
  },
  "rose-neon": {
    sky: ["#0b0413", "#420f3a", "#ff4d7a"],
    glow: "#ffd9e6",
    accent: "#ff5ca8",
    accent2: "#46e5ff",
    ink: "#07020c",
    tint: "warm",
  },
};

/**
 * Scene archetypes. Each one is a hand-composed, layered SVG scene that reads
 * like animated-film key art — a horizon, a light source, silhouettes and
 * atmosphere — rather than an abstract gradient.
 */
export type SceneId =
  | "skywhale"
  | "dunes"
  | "forest"
  | "reef"
  | "islands"
  | "neon"
  | "aurora"
  | "clockwork";

export const SCENES: SceneId[] = [
  "skywhale",
  "dunes",
  "forest",
  "reef",
  "islands",
  "neon",
  "aurora",
  "clockwork",
];

export function getPalette(id: PaletteId): Palette {
  return PALETTES[id] ?? PALETTES["violet-dusk"];
}
