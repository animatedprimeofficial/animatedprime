"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ScrollTrigger,
  ScrollSmoother,
  SMOOTH_SCROLL_MEDIA,
  ensureRegistered,
  type ScrollSmootherInstance,
} from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Navbar from "@/components/site/Navbar";
import CustomCursor from "@/components/site/CustomCursor";
import SectionRail from "@/components/site/SectionRail";
import IntroCurtain from "@/components/site/IntroCurtain";
import PlayerOverlay from "@/components/site/PlayerOverlay";
import type { AppRelease } from "@/lib/release";

type IntroStage = "boot" | "playing" | "done";

interface AppApi {
  /** true once the scroll environment is measured and ready for ScrollTriggers */
  ready: boolean;
  /** whether the transform-free smooth scroller is active */
  smooth: boolean;
  scrollTo: (target: string | HTMLElement, offset?: string) => void;
  refresh: () => void;
  /** true when the opening curtain has finished — the hero timeline waits on this */
  introDone: boolean;
  completeIntro: () => void;
  /** reference-counted scroll lock (intro curtain, mobile menu, modals) */
  setScrollLocked: (id: string, locked: boolean) => void;
}

const AppContext = createContext<AppApi>({
  ready: false,
  smooth: false,
  scrollTo: () => {},
  refresh: () => {},
  introDone: true,
  completeIntro: () => {},
  setScrollLocked: () => {},
});

export function useApp(): AppApi {
  return useContext(AppContext);
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Owns everything that must live *outside* the transformed scroll container:
 * the floating navbar, the custom cursor, the section rail and the intro
 * curtain. Also owns scroll smoothing and exposes a single `scrollTo` so every
 * CTA in the app is smooth-scroll-aware.
 */
export function AppProvider({
  children,
  release,
}: {
  children: ReactNode;
  release: AppRelease;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const smootherRef = useRef<ScrollSmootherInstance | null>(null);
  const lockersRef = useRef<Set<string>>(new Set());
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const canSmooth = useMediaQuery(SMOOTH_SCROLL_MEDIA);

  const [ready, setReady] = useState(false);
  const [smooth, setSmooth] = useState(false);
  const [stage, setStage] = useState<IntroStage>("boot");
  const introDone = stage === "done";
  const completeIntro = useCallback(() => setStage("done"), []);

  useIsoLayoutEffect(() => {
    ensureRegistered();
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    let smoother: ScrollSmootherInstance | null = null;
    if (canSmooth && !reducedMotion) {
      try {
        smoother = ScrollSmoother.create({
          wrapper,
          content,
          smooth: 1.15,
          smoothTouch: false,
          effects: false, // explicit ScrollTriggers only — no data-speed surprises
          normalizeScroll: false,
          ignoreMobileResize: true,
        });
      } catch {
        smoother = null;
      }
    }

    smootherRef.current = smoother;
    setSmooth(Boolean(smoother));
    ScrollTrigger.refresh();
    setReady(true);

    return () => {
      smoother?.kill();
      smootherRef.current = null;
      setReady(false);
      setSmooth(false);
      ScrollTrigger.refresh();
    };
  }, [canSmooth, reducedMotion]);

  // Keep measurements honest once webfonts land, and on viewport rotation.
  useEffect(() => {
    if (!ready) return;
    const refresh = () => ScrollTrigger.refresh();
    const t = window.setTimeout(refresh, 420);
    window.addEventListener("orientationchange", refresh);
    document.fonts?.ready?.then(refresh).catch(() => {});
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("orientationchange", refresh);
    };
  }, [ready]);

  const applyLock = useCallback(() => {
    const locked = lockersRef.current.size > 0;
    const smoother = smootherRef.current;
    smoother?.paused?.(locked);
    if (!smoother) document.body.style.overflow = locked ? "hidden" : "";
    if (!locked) ScrollTrigger.refresh();
  }, []);

  const setScrollLocked = useCallback<AppApi["setScrollLocked"]>(
    (id, locked) => {
      if (locked) lockersRef.current.add(id);
      else lockersRef.current.delete(id);
      applyLock();
    },
    [applyLock],
  );

  // Freeze the page behind the intro curtain so the first frame is composed.
  useEffect(() => {
    if (!ready) return;
    if (introDone) {
      setScrollLocked("intro", false);
      return;
    }
    setScrollLocked("intro", true);
    window.scrollTo(0, 0);
  }, [introDone, ready, setScrollLocked]);

  const scrollTo = useCallback<AppApi["scrollTo"]>(
    (target, offset = "top 88px") => {
      const element =
        typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
      if (!element) return;
      const smoother = smootherRef.current;
      if (smoother) {
        smoother.scrollTo(element, true, offset);
        return;
      }
      const top = window.scrollY + element.getBoundingClientRect().top - 76;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [reducedMotion],
  );

  const refresh = useCallback(() => ScrollTrigger.refresh(), []);

  const api = useMemo<AppApi>(
    () => ({ ready, smooth, scrollTo, refresh, introDone, completeIntro, setScrollLocked }),
    [ready, smooth, scrollTo, refresh, introDone, completeIntro, setScrollLocked],
  );

  return (
    <AppContext.Provider value={api}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-violet focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <Navbar release={release} />

      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content" ref={contentRef}>
          {children}
        </div>
      </div>

      <SectionRail />
      <CustomCursor />
      <PlayerOverlay release={release} />
      <IntroCurtain stage={stage} onDone={completeIntro} reducedMotion={reducedMotion} />
    </AppContext.Provider>
  );
}
