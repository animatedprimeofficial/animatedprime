"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Frames-per-second ceiling for a demand-driven canvas.
 *
 * The decorative scenes are slow ambience — dust drifting, a camera easing
 * toward a scroll position — and 24 fps of that reads identically to 60 while
 * costing a low-end GPU less than half as much. R3F has no built-in rate limit,
 * but a `frameloop="demand"` canvas renders exactly when `invalidate()` is
 * called, so driving that from a rAF gives an exact ceiling without touching
 * the scene graph. Deliberately not used at 60 fps: there the native loop is
 * cheaper than waking ourselves up to wake it.
 */
export function FrameBudget({ fps }: { fps: number }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!fps || fps >= 60) return;
    const interval = 1000 / fps;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < interval) return;
      last = now;
      invalidate();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);

  return null;
}
