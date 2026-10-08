"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useWatchlist } from "@/components/providers/WatchlistProvider";
import { useActiveSection } from "@/hooks/useActiveSection";
import Logo from "@/components/ui/Logo";
import DownloadButton from "@/components/site/DownloadButton";
import type { AppRelease } from "@/lib/release";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "Movies", href: "#featured" },
  { label: "Trending", href: "#trending" },
  { label: "Anime", href: "#anime" },
  { label: "Genres", href: "#genres" },
  { label: "App", href: "#app" },
];

const SECTION_IDS = [
  "top",
  "featured",
  "trending",
  "anime",
  "genres",
  "immersive",
  "experience",
  "app",
  "explore",
];

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Floating nav. Scroll state is written straight to the DOM (no React state per
 * frame), so the header never re-renders while the page moves.
 */
export default function Navbar({ release }: { release: AppRelease }) {
  const headerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);

  const { scrollTo, introDone, setScrollLocked } = useApp();
  const watchlist = useWatchlist();
  const activeSection = useActiveSection(SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const header = headerRef.current;
      if (header) header.dataset.scrolled = y > 26 ? "true" : "false";
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Nav entrance once the curtain lifts.
  useGSAP(
    () => {
      if (!introDone) return;
      gsap.fromTo(
        pillRef.current,
        { y: -28, opacity: 0, filter: "blur(10px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: EASE.cinema, delay: 0.25 },
      );
    },
    { dependencies: [introDone], scope: headerRef },
  );

  // Watchlist badge pops whenever the list changes.
  useGSAP(
    () => {
      if (watchlist.revision === 0 || !badgeRef.current) return;
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.4 },
        { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" },
      );
    },
    { dependencies: [watchlist.revision] },
  );

  useEffect(() => {
    setScrollLocked("mobile-menu", menuOpen);
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, setScrollLocked]);

  useGSAP(
    () => {
      if (!menuOpen) return;
      const items = menuListRef.current?.querySelectorAll("[data-menu-item]") ?? [];
      const tl = gsap.timeline();
      tl.fromTo(menuRef.current, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: EASE.soft })
        .fromTo(
          items,
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, ease: EASE.cinema, stagger: 0.06 },
          0.06,
        );
      return () => tl.kill();
    },
    { dependencies: [menuOpen], scope: menuRef },
  );

  const go = (href: string) => {
    setMenuOpen(false);
    scrollTo(href);
  };

  const focusSearch = () => {
    scrollTo("#explore");
    window.setTimeout(() => {
      document.getElementById("movie-search")?.focus({ preventScroll: true });
    }, 950);
  };

  return (
    <header
      ref={headerRef}
      data-scrolled="false"
      className="group/nav fixed inset-x-0 top-0 z-[110]"
    >
      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-violet via-cyan to-rose"
      />

      <div className="mx-auto flex max-w-[104rem] flex-col px-4 pt-3 sm:px-6 sm:pt-5 lg:px-10">
        <div
          ref={pillRef}
          className={cn(
            "flex items-center justify-between gap-4 rounded-full border border-transparent px-3 py-2.5 transition-all duration-500 sm:px-4",
            "group-data-[scrolled=true]/nav:glass-strong group-data-[scrolled=true]/nav:border-white/10 group-data-[scrolled=true]/nav:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)]",
          )}
          style={{ transitionProperty: "background-color, border-color, box-shadow, backdrop-filter" }}
        >
          <button
            type="button"
            onClick={() => go("#top")}
            aria-label="AnimatedPrime home"
            data-cursor="link"
            className="rounded-full"
          >
            <Logo />
          </button>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => go(link.href)}
                  data-cursor="link"
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                    isActive ? "text-fog-100" : "text-fog-500 hover:text-fog-100",
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-4 -bottom-0.5 h-px origin-center bg-gradient-to-r from-violet to-cyan transition-transform duration-500",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <DownloadButton
              release={release}
              variant="outline"
              size="md"
              label="Get the app"
              /* `max-lg:hidden` rather than `hidden lg:inline-flex`: Tailwind emits
                 `.inline-flex` *after* `.hidden`, so pairing them on one element
                 leaves the CTA visible on phones — where it overflows the pill and
                 pushes the menu button off screen. Keep the size overrides as v4
                 important suffixes (`px-5!`), which the v3-style `!px-5` never
                 generated. */
              className="mr-1 max-lg:hidden px-5! py-2.5! text-[0.8rem]!"
              /* the badge is a luxury, not a fixture — at lg the pill has no room
                 for it and the profile avatar starts clipping */
              badgeClassName="max-xl:hidden"
            />

            <button
              type="button"
              onClick={focusSearch}
              aria-label="Search movies"
              data-cursor="link"
              className="grid h-9 w-9 place-items-center rounded-full text-fog-300 transition-all duration-300 hover:bg-white/8 hover:text-fog-100 sm:h-10 sm:w-10"
            >
              <IconSearch />
            </button>

            <button
              type="button"
              onClick={() => go("#explore")}
              aria-label={`Watchlist, ${watchlist.count} titles`}
              data-cursor="link"
              className="relative grid h-9 w-9 place-items-center rounded-full text-fog-300 transition-all duration-300 hover:bg-white/8 hover:text-fog-100 sm:h-10 sm:w-10"
            >
              <IconBookmark filled={watchlist.count > 0} />
              {watchlist.count > 0 ? (
                <span
                  ref={badgeRef}
                  className="absolute -top-0.5 -right-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-gradient-to-br from-violet to-cyan px-1 text-[0.65rem] font-bold text-ink-950 tabular-nums"
                >
                  {watchlist.count}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              aria-label="Your profile"
              data-cursor="link"
              className="relative ml-1 hidden h-9 w-9 place-items-center rounded-full border border-white/12 bg-gradient-to-br from-violet/70 to-cyan/50 text-[0.7rem] font-bold text-ink-950 transition-transform duration-300 hover:scale-105 sm:grid sm:h-10 sm:w-10"
            >
              AP
              <span className="absolute -inset-1 -z-10 rounded-full bg-violet/30 blur-md" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              data-cursor="link"
              className="ml-1 grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/5 text-fog-100 lg:hidden"
            >
              <span className="relative flex h-3.5 w-4.5 flex-col justify-between">
                <span
                  className={cn(
                    "h-[1.5px] w-full origin-left bg-current transition-transform duration-300",
                    menuOpen && "translate-y-[5px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "h-[1.5px] w-full bg-current transition-all duration-300",
                    menuOpen && "scale-x-0 opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "h-[1.5px] w-full origin-left bg-current transition-transform duration-300",
                    menuOpen && "-translate-y-[5px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen ? (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 -z-10 flex flex-col justify-between bg-ink-950/92 pb-10 pt-28 backdrop-blur-2xl lg:hidden"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet/25 blur-[110px]" />
            <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-cyan/15 blur-[120px]" />
          </div>

          <nav ref={menuListRef} aria-label="Mobile" className="relative flex flex-col gap-2 px-7">
            {[...LINKS, { label: "Explore", href: "#explore" }, { label: "Experience", href: "#experience" }].map(
              (link) => (
                <span key={link.label} className="overflow-hidden py-1">
                  <button
                    type="button"
                    data-menu-item
                    onClick={() => go(link.href)}
                    className="block text-left font-display text-[2.6rem] leading-[1.05] font-bold tracking-[-0.04em] text-fog-100"
                  >
                    {link.label}
                  </button>
                </span>
              ),
            )}
          </nav>

          <div className="relative flex flex-col gap-3 px-7">
            <DownloadButton
              release={release}
              variant="primary"
              size="md"
              label="Get the mobile app"
              className="w-full"
            />
            <button
              type="button"
              data-menu-item
              onClick={() => go("#explore")}
              className="w-full rounded-full border border-white/16 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-fog-100"
            >
              Watch Now
            </button>
            <p className="mt-2 text-xs tracking-[0.2em] text-fog-700 uppercase">
              Animation. Reimagined.
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
