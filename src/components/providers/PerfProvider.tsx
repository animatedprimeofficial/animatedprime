"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  demoteTier,
  detectPerfTier,
  profileFor,
  type PerfProfile,
  type PerfTier,
} from "@/lib/perf";

const PerfContext = createContext<PerfProfile>(profileFor("high"));

/** The effective effect budget for this device. */
export function usePerf(): PerfProfile {
  return useContext(PerfContext);
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/*
 * Frame watchdog thresholds.
 *
 * A frame over 22 ms means the page failed to reach 45 fps. One bad window is
 * noise (a route transition, a decoded image, a garbage collection), so a
 * demotion needs two consecutive bad windows — 3 s of sustained stutter, which
 * is long enough that a healthy laptop decoding a screenful of posters will
 * not trip it. Anything above `STALL_MS` is a tab switch or a long task rather
 * than steady-state jank and resets the counters instead of counting against
 * the device.
 */
const WINDOW_FRAMES = 96;
const SLOW_FRAME_MS = 22;
const SLOW_RATIO = 0.28;
const BAD_WINDOWS = 2;
const STALL_MS = 400;
const MAX_DEMOTIONS = 2;

/** How long to keep watching before deciding the device is fine and stopping. */
const WATCH_MS = 30_000;

/**
 * Publishes the device's effect budget to the tree.
 *
 * The initial tier is resolved from capability hints in a layout effect (so the
 * first *painted* frame is already the right weight), then a cheap frame-timing
 * watchdog may demote it once or twice. Demotion only ever removes work, so it
 * cannot cascade into re-layout: by the time it fires, the device has already
 * told us it cannot keep up.
 */
export function PerfProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<PerfTier>("high");
  const demotionsRef = useRef(0);

  useIsoLayoutEffect(() => {
    setTier(detectPerfTier());
  }, []);

  // Mirror the tier onto the document so CSS can drop expensive paint without
  // every component needing a React branch.
  useIsoLayoutEffect(() => {
    document.documentElement.dataset.perf = tier;
  }, [tier]);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let slow = 0;
    let streak = 0;
    let last = performance.now();
    let stopped = false;
    const deadline = last + WATCH_MS;

    const tick = (now: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);

      const delta = now - last;
      last = now;

      if (delta > STALL_MS) {
        frames = 0;
        slow = 0;
        streak = 0;
        return;
      }

      frames += 1;
      if (delta > SLOW_FRAME_MS) slow += 1;

      if (frames >= WINDOW_FRAMES) {
        if (slow / frames > SLOW_RATIO) {
          streak += 1;
          if (streak >= BAD_WINDOWS) {
            streak = 0;
            demotionsRef.current += 1;
            setTier((current) => demoteTier(current));
            if (demotionsRef.current >= MAX_DEMOTIONS) {
              stopped = true;
              cancelAnimationFrame(raf);
              return;
            }
          }
        } else {
          streak = 0;
        }
        frames = 0;
        slow = 0;

        // Healthy device: stop sampling rather than hold a rAF open forever.
        if (now > deadline) {
          stopped = true;
          cancelAnimationFrame(raf);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const profile = useMemo(() => profileFor(tier), [tier]);

  return <PerfContext.Provider value={profile}>{children}</PerfContext.Provider>;
}
