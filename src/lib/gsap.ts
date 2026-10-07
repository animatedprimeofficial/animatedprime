"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * Single registration point for every animation primitive. Importing from
 * `@/lib/gsap` (never from the packages directly) keeps plugin registration and
 * global defaults consistent across the whole app.
 */
let registered = false;

function ensureRegistered() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });
  registered = true;
}

ensureRegistered();

export const EASE = {
  cinema: "power4.out",
  soft: "power2.out",
  swift: "power3.inOut",
  expo: "expo.out",
} as const;

export const SMOOTH_SCROLL_MEDIA = "(min-width: 1024px) and (pointer: fine)";

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP, ensureRegistered };
export type { ScrollSmoother as ScrollSmootherInstance };
