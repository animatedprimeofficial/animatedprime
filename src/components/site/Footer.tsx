"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import Logo from "@/components/ui/Logo";
import Reveal from "@/components/anim/Reveal";

const NAV = [
  { label: "Home", href: "#top" },
  { label: "Movies", href: "#featured" },
  { label: "Genres", href: "#genres" },
  { label: "About", href: "#experience" },
  { label: "Contact", href: "#start" },
];

const LEGAL = ["Privacy Policy", "Terms of Service", "Cookie Preferences"];

const SOCIALS: { label: string; path: string }[] = [
  {
    label: "AnimatedPrime on X",
    path: "M4 4h4.2l4 5.4L17 4h3l-6.3 7.6L20.4 20h-4.2l-4.2-5.7L7 20H4l6.6-7.9L4 4Z",
  },
  {
    label: "AnimatedPrime on Instagram",
    path: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Zm4 4.6A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Zm4.6-1.1a.9.9 0 1 0 .9.9.9.9 0 0 0-.9-.9Z",
  },
  {
    label: "AnimatedPrime on YouTube",
    path: "M3.5 8.5A3 3 0 0 1 6.5 5.5h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-7Zm7 1.2v4.6l4.2-2.3-4.2-2.3Z",
  },
  {
    label: "AnimatedPrime on Dribbble",
    path: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 2.2c2 0 3.8.8 5.1 2.1-1.6 2-4 3.3-6.7 3.5-.5-2-1.4-3.8-2.6-5.1A6.3 6.3 0 0 1 12 5.7Zm-4.9 1.1c1.2 1.2 2 2.9 2.4 4.7l-4.9.2c.3-2 1.3-3.7 2.5-4.9Zm-2.6 9.9c.5-1.8 2.6-3.4 5.5-3.6.7 1.9 1.1 3.7 1.2 5.2a6.3 6.3 0 0 1-6.7-1.6Zm8.9.7c-.1-1.4-.5-3-1.1-4.6 2.1-.1 4.2.7 5.4 2.1a6.3 6.3 0 0 1-4.3 2.5Z",
  },
];

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const { scrollTo } = useApp();
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.fromTo(
        "[data-footer-line]",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.6,
          ease: "power3.inOut",
          scrollTrigger: { trigger: rootRef.current, start: "top 92%", once: true },
        },
      );
      gsap.fromTo(
        "[data-footer-mark]",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 88%", once: true },
        },
      );
    },
    { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <footer ref={rootRef} className="relative overflow-hidden pt-20 pb-10">
      <div className="mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <span
          data-footer-line
          aria-hidden="true"
          className="block h-px w-full origin-left bg-gradient-to-r from-transparent via-violet to-transparent"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:gap-10">
          <Reveal y={22} className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-fog-500">
              A premium home for animated movies. Curated worlds, honest recommendations
              and playback that never gets in the way of the story.
            </p>
            <p className="story-italic text-lg text-fog-300">Animation. Reimagined.</p>
          </Reveal>

          <Reveal y={22} delay={0.06} className="flex flex-col gap-4">
            <p className="text-[0.62rem] font-semibold tracking-[0.28em] text-fog-700 uppercase">
              Navigation
            </p>
            <ul className="flex flex-col gap-3">
              {NAV.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => scrollTo(item.href)}
                    data-cursor="link"
                    className="text-sm text-fog-300/85 transition-colors duration-300 hover:text-fog-100"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal y={22} delay={0.12} className="flex flex-col gap-4">
            <p className="text-[0.62rem] font-semibold tracking-[0.28em] text-fog-700 uppercase">
              Legal
            </p>
            <ul className="flex flex-col gap-3">
              {LEGAL.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    title="Demo build — policy pages are not included"
                    data-cursor="link"
                    className="text-sm text-fog-300/85 transition-colors duration-300 hover:text-fog-100"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal y={22} delay={0.18} className="flex flex-col gap-4 lg:items-end">
            <p className="text-[0.62rem] font-semibold tracking-[0.28em] text-fog-700 uppercase">
              Follow
            </p>
            <div className="flex gap-2.5">
              {SOCIALS.map((social) => (
                <button
                  key={social.label}
                  type="button"
                  aria-label={social.label}
                  data-cursor="link"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-fog-300 transition-all duration-400 hover:-translate-y-0.5 hover:border-white/25 hover:text-fog-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="text-[0.7rem] tracking-wide text-fog-700">
            © {new Date().getFullYear()} AnimatedPrime. A fictional platform built as a
            front-end showcase.
          </p>
          <div className="flex items-center gap-6">
            <p className="text-[0.62rem] font-semibold tracking-[0.26em] text-fog-700 uppercase">
              Made for animation lovers
            </p>
            <button
              type="button"
              onClick={() => scrollTo("#top")}
              data-cursor="link"
              className="group flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.26em] text-fog-500 uppercase transition-colors hover:text-fog-100"
            >
              Back to top
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-400 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 19V5m-6 6 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p
        data-footer-mark
        aria-hidden="true"
        className="pointer-events-none mt-10 block w-full select-none bg-gradient-to-b from-white/10 to-transparent bg-clip-text text-center font-display text-[12.4vw] leading-[0.82] font-extrabold tracking-[-0.055em] text-transparent"
      >
        ANIMATEDPRIME
      </p>
    </footer>
  );
}
