"use client";

/**
 * Device capability tiers.
 *
 * The site's *layout* has always responded to viewport width, but its *cost*
 * does not: a 1440px-wide laptop with two cores and 4 GB of RAM was being
 * served the same 12-poster WebGL corridor, 1.7 device-pixel-ratio canvases,
 * 28 large-radius blur layers and a transform-driven smooth scroller as a
 * workstation. The lags users report on "low end devices" come from exactly
 * that mismatch.
 *
 * A tier is therefore a small, declarative budget of expensive effects rather
 * than a pile of `if` statements scattered through the components. Everything
 * that is genuinely costly reads one flag from here, so the cheap path stays
 * consistent and can be reasoned about in one place.
 *
 * Two inputs decide the tier:
 *
 *  1. Static capability — core count, memory, data-saver, pointer type and the
 *     user's reduced-motion preference. Available before the first animation
 *     starts, so the opening curtain is already sized for the device.
 *  2. Observed frame health — the provider watches real frame durations and
 *     demotes a tier when the page cannot hold its budget. Hardware hints lie
 *     (and are missing in Safari entirely), so the device's own timing is the
 *     only signal that is always true.
 */

export type PerfTier = "high" | "balanced" | "lite";

/**
 * How the WebGL scenes should behave:
 *  - `live`   — render every frame (capped by `fps`)
 *  - `static` — render one frame and stop; still looks composed, costs nothing
 *  - `off`    — never mount a renderer at all
 */
export type WebglMode = "live" | "static" | "off";

export interface PerfProfile {
  tier: PerfTier;
  /** large blur layers, backdrop filters and film grain are affordable */
  glass: boolean;
  /** transform-based smooth scrolling is affordable */
  smoothScroll: boolean;
  /** infinitely repeating decorative tweens are affordable */
  ambient: boolean;
  webgl: WebglMode;
  /** ceiling for the renderer pixel ratio */
  dpr: number;
  /** multiplier for particle / poster / dust counts */
  density: number;
  /** multiplier for the opening curtain's running time */
  intro: number;
  /** frame ceiling for live canvases, in frames per second */
  fps: number;
}

const PROFILES: Record<PerfTier, PerfProfile> = {
  high: {
    tier: "high",
    glass: true,
    smoothScroll: true,
    ambient: true,
    webgl: "live",
    dpr: 1.7,
    density: 1,
    intro: 1,
    fps: 60,
  },
  balanced: {
    tier: "balanced",
    glass: true,
    smoothScroll: true,
    ambient: true,
    webgl: "live",
    dpr: 1.35,
    density: 0.5,
    intro: 0.62,
    fps: 60,
  },
  /**
   * Lite is the "do not make me feel the browser" tier. The hero atmosphere
   * becomes a single rendered frame, the corridor drops to a handful of
   * posters at 24 fps, and every decorative loop stops — the page reads as a
   * still, premium layout rather than a slideshow fighting the CPU.
   */
  lite: {
    tier: "lite",
    glass: false,
    smoothScroll: false,
    ambient: false,
    webgl: "static",
    dpr: 1,
    density: 0.28,
    intro: 0.4,
    fps: 24,
  },
};

export function profileFor(tier: PerfTier): PerfProfile {
  return PROFILES[tier];
}

/** One step down the ladder — never past `lite`. */
export function demoteTier(tier: PerfTier): PerfTier {
  return tier === "high" ? "balanced" : "lite";
}

interface CapabilityNavigator extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * Escape hatch: `localStorage.setItem("animatedprime:perf", "lite")` then
 * reload forces a tier. Useful for reproducing a report on a fast machine, and
 * for confirming on a real low-end device that the cheap path is what fixes it.
 */
export const PERF_OVERRIDE_KEY = "animatedprime:perf";

function overriddenTier(): PerfTier | null {
  try {
    const value = window.localStorage.getItem(PERF_OVERRIDE_KEY);
    return value === "high" || value === "balanced" || value === "lite" ? value : null;
  } catch {
    return null;
  }
}

export function detectPerfTier(): PerfTier {
  if (typeof window === "undefined") return "high";

  const override = overriddenTier();
  if (override) return override;

  const nav = navigator as CapabilityNavigator;
  let pressure = 0;

  const cores = nav.hardwareConcurrency;
  if (typeof cores === "number") {
    if (cores <= 2) pressure += 2;
    else if (cores <= 4) pressure += 1;
  }

  // `deviceMemory` is Chromium-only; a 2 GB machine is a slideshow candidate
  // whatever else it reports, while 8 GB is unremarkable.
  const memory = nav.deviceMemory;
  if (typeof memory === "number") {
    if (memory <= 2) pressure += 2;
    else if (memory <= 4) pressure += 1;
  }

  if (nav.connection?.saveData) pressure += 2;

  // Narrow viewport on a coarse pointer is a phone. Phones are not assumed to
  // be weak — only nudged, and the watchdog can still demote them.
  if (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024) {
    pressure += 1;
  }

  // A reduced-motion preference is treated as a low-tier device: the user has
  // asked for calm, and the calm path is also the cheap path.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) pressure += 3;

  if (pressure >= 3) return "lite";
  if (pressure >= 1) return "balanced";
  return "high";
}
