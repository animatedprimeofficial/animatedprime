"use client";

import { useMemo, useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { useIsDesktop, useReducedMotion } from "@/hooks/useMediaQuery";
import AnimatedHeading from "@/components/anim/AnimatedHeading";
import MagneticButton from "@/components/anim/MagneticButton";
import Reveal from "@/components/anim/Reveal";
import Artwork from "@/components/art/Artwork";
import DownloadButton from "@/components/site/DownloadButton";
import type { AppRelease } from "@/lib/release";
import { cn } from "@/lib/utils";

export default function CTASection({ release }: { release: AppRelease }) {
  const rootRef = useRef<HTMLElement>(null);
  const { scrollTo } = useApp();
  const { trending } = useCatalog();
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();

  const collage = useMemo(
    () => (trending.length > 1 ? trending.slice(1, 6) : trending).slice(0, 5),
    [trending],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: isDesktop ? 26 : 12 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        top: `${(index * 53) % 100}%`,
        size: 1 + ((index * 7) % 3),
        delay: (index % 9) * 0.4,
      })),
    [isDesktop],
  );

  useGSAP(
    () => {
      if (reducedMotion) return;

      gsap.to("[data-cta-aurora]", {
        xPercent: 8,
        yPercent: -6,
        rotate: 6,
        duration: 12,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 1.6, from: "random" },
      });

      gsap.utils.toArray<HTMLElement>("[data-cta-particle]").forEach((particle, index) => {
        gsap.to(particle, {
          y: -40 - (index % 5) * 18,
          x: (index % 2 === 0 ? 1 : -1) * (14 + (index % 4) * 8),
          opacity: 0.15 + (index % 3) * 0.25,
          duration: 6 + (index % 5) * 1.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.18,
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-cta-collage]").forEach((card, index) => {
        gsap.to(card, {
          y: index % 2 === 0 ? -26 : 22,
          rotate: index % 2 === 0 ? 3.5 : -3,
          duration: 9 + index * 1.3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      return;
    },
    { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <section
      id="start"
      ref={rootRef}
      className="relative isolate flex min-h-[92svh] items-center overflow-hidden"
    >
      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(124,92,255,0.35),transparent_62%)]" />
        <div
          data-cta-aurora
          className="absolute -top-1/3 left-[-10%] h-[46rem] w-[80%] rounded-full bg-gradient-to-r from-violet/35 via-rose/20 to-transparent blur-[120px]"
        />
        <div
          data-cta-aurora
          className="absolute -bottom-1/4 right-[-15%] h-[40rem] w-[70%] rounded-full bg-gradient-to-l from-cyan/28 via-mint/12 to-transparent blur-[130px]"
        />
        <div
          data-cta-aurora
          className="absolute left-1/3 top-1/4 h-[30rem] w-[30rem] rounded-full bg-amber/12 blur-[140px]"
        />

        {particles.map((particle) => (
          <span
            key={particle.id}
            data-cta-particle
            className="absolute rounded-full bg-white/60"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* drifting poster collage */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        {collage.map((movie, index) => {
          const positions = [
            "left-[3%] top-[14%] w-[13rem] -rotate-6",
            "left-[14%] bottom-[8%] w-[11rem] rotate-3",
            "right-[4%] top-[16%] w-[12rem] rotate-6",
            "right-[17%] bottom-[6%] w-[13rem] -rotate-3",
            "left-[40%] bottom-[2%] w-[9rem] rotate-2",
          ];
          return (
            <div
              key={movie.id}
              data-cta-collage
              className={cn(
                "absolute overflow-hidden rounded-[1.25rem] border border-white/10 opacity-25 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] blur-[2px]",
                positions[index % positions.length],
              )}
            >
              <div className="aspect-[2/3] w-full">
                <Artwork
                  movie={movie}
                  variant="poster"
                  width={600}
                  height={900}
                  detail="simple"
                  sizes="13rem"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mx-auto flex w-full max-w-[104rem] flex-col items-center px-5 py-24 text-center sm:px-6 lg:px-10">
        <Reveal y={16} className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-violet" aria-hidden="true" />
          <span className="eyebrow text-fog-500">Chapter 09 — Start</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-cyan" aria-hidden="true" />
        </Reveal>

        <AnimatedHeading
          as="h2"
          text="Your Next Adventure *Is Waiting.*"
          className="display-xl mt-7 max-w-4xl text-fog-100"
          stagger={0.075}
        />

        <Reveal y={24} delay={0.12}>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-fog-300/85 sm:text-lg">
            Discover unforgettable worlds, characters and stories — all in one place.
          </p>
        </Reveal>

        <div className="mt-11 flex flex-col items-center gap-4 sm:flex-row">
          <DownloadButton release={release} variant="primary" size="lg" />
          <MagneticButton
            variant="outline"
            cursor="link"
            size="lg"
            onClick={() => scrollTo("#explore")}
          >
            Browse the library
          </MagneticButton>
        </div>

        <Reveal y={18} delay={0.22}>
          <p className="mt-9 text-[0.68rem] font-semibold tracking-[0.24em] text-fog-700 uppercase">
            Free to browse · 30 days free in the app · Cancel in two taps
          </p>
        </Reveal>
      </div>
    </section>
  );
}
