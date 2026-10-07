"use client";

import { useRef } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useApp } from "@/components/providers/AppProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { usePointerFine, useReducedMotion } from "@/hooks/useMediaQuery";
import PhoneMockup from "@/components/site/PhoneMockup";

/**
 * Three real app screens held in a shallow 3D fan. The middle one is the
 * product, the outer two are context — and the whole stage responds to the
 * pointer with a few degrees of lean so it feels handled, not printed.
 */
export default function PhoneStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { movies, hero, trending } = useCatalog();
  const reducedMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const { ready } = useApp();

  const rail = (trending.length ? trending : movies).filter((movie) => movie.id !== hero.id);
  const railMovies = rail.length >= 3 ? rail : [...rail, ...movies].slice(0, 4);

  useGSAP(
    () => {
      if (reducedMotion || !ready) return;

      gsap.fromTo(
        "[data-phone]",
        { yPercent: 12, opacity: 0, scale: 0.94, rotateX: 12 },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          duration: 1.3,
          ease: EASE.cinema,
          stagger: 0.12,
          scrollTrigger: { trigger: rootRef.current, start: "top 82%", once: true },
        },
      );

      gsap.fromTo(
        "[data-phone-chip]",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: EASE.cinema,
          stagger: 0.1,
          scrollTrigger: { trigger: rootRef.current, start: "top 74%", once: true },
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-phone]").forEach((phone, index) => {
        gsap.to(phone, {
          y: index % 2 === 0 ? -16 : 14,
          duration: 6 + index * 1.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.5,
        });
      });

      if (!pointerFine) return;
      const stage = rootRef.current;
      if (!stage) return;
      const phones = Array.from(stage.querySelectorAll<HTMLElement>("[data-phone]"));
      const setters = phones.map((phone, index) => ({
        depth: Number(phone.dataset.phoneDepth ?? 1) + index * 0.2,
        x: gsap.quickTo(phone, "x", { duration: 1, ease: "power3.out" }),
        rotate: gsap.quickTo(phone, "rotateY", { duration: 1.1, ease: "power3.out" }),
      }));

      const onMove = (event: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        setters.forEach((setter) => {
          setter.x(px * 22 * setter.depth);
          setter.rotate(px * 10 * setter.depth);
        });
      };

      const onLeave = () => {
        setters.forEach((setter) => {
          setter.x(0);
          setter.rotate(0);
        });
      };

      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
      return () => {
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef, dependencies: [ready, reducedMotion, pointerFine, hero.id], revertOnUpdate: true },
  );

  return (
    <div ref={rootRef} className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-violet/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-4 h-[20rem] w-[20rem] rounded-full bg-cyan/15 blur-[110px]"
      />

      <div className="relative flex items-end justify-center gap-3 [perspective:1800px] sm:gap-4">
        <div
          data-phone
          data-phone-depth="0.7"
          className="hidden w-[32%] max-w-[15rem] origin-bottom-right translate-y-6 [transform:rotateY(16deg)_rotateZ(-3deg)] sm:block"
        >
          <PhoneMockup screen="player" movie={hero} rail={railMovies} />
        </div>

        <div data-phone data-phone-depth="1" className="w-[74%] max-w-[21rem] origin-bottom sm:w-[42%]">
          <PhoneMockup screen="home" movie={hero} rail={railMovies} />
        </div>

        <div
          data-phone
          data-phone-depth="0.7"
          className="hidden w-[32%] max-w-[15rem] origin-bottom-left translate-y-8 [transform:rotateY(-16deg)_rotateZ(3deg)] sm:block"
        >
          <PhoneMockup screen="downloads" movie={hero} rail={railMovies} />
        </div>
      </div>

      {/* floating product chips */}
      <div
        data-phone-chip
        className="glass absolute left-0 top-[18%] hidden rounded-2xl px-4 py-3 lg:block"
      >
        <p className="text-[0.55rem] font-semibold tracking-[0.2em] text-fog-500 uppercase">
          Offline
        </p>
        <p className="mt-1 font-display text-sm font-bold text-fog-100">12 titles stored</p>
      </div>

      <div
        data-phone-chip
        className="glass absolute right-0 top-[42%] hidden rounded-2xl px-4 py-3 lg:block"
      >
        <p className="text-[0.55rem] font-semibold tracking-[0.2em] text-fog-500 uppercase">
          Handoff
        </p>
        <p className="mt-1 font-display text-sm font-bold text-fog-100">Phone → TV in one tap</p>
      </div>

      <div
        data-phone-chip
        className="glass absolute bottom-[12%] left-2 hidden items-center gap-2 rounded-2xl px-4 py-2.5 lg:flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />
        <span className="text-[0.65rem] font-semibold tracking-wide text-fog-300">
          Dolby Atmos on headphones
        </span>
      </div>
    </div>
  );
}
