"use client";

import { Fragment, createElement, useRef, type ElementType } from "react";
import { gsap, EASE, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { useApp } from "@/components/providers/AppProvider";
import { cn } from "@/lib/utils";

/**
 * Word-level masked reveal.
 *
 * Words are emitted as real inline-block spans (SSR-safe, no plugin needed) so
 * each one can rise out of its own overflow-hidden mask. `*stars*` marks a word
 * to be rendered in the storybook italic serif — AnimatedPrime's signature
 * typographic contrast.
 */
export type AnimatedHeadingMode = "scroll" | "active" | "immediate";

export interface AnimatedHeadingProps {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  yPercent?: number;
  mode?: AnimatedHeadingMode;
  /** used by mode="active": the reveal plays the moment this turns true */
  active?: boolean;
  start?: string;
  id?: string;
  "aria-label"?: string;
}

interface Token {
  word: string;
  serif: boolean;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  text.split("*").forEach((segment, index) => {
    const serif = index % 2 === 1;
    segment
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => tokens.push({ word, serif }));
  });
  return tokens;
}

export default function AnimatedHeading({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
  stagger = 0.055,
  yPercent = 118,
  mode = "scroll",
  active = true,
  start = "top 88%",
  id,
  "aria-label": ariaLabel,
}: AnimatedHeadingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { ready } = useApp();
  const tokens = tokenize(text);
  const plain = ariaLabel ?? text.replace(/\*/g, "");

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reducedMotion) return;
      const words = root.querySelectorAll<HTMLElement>("[data-word]");
      if (!words.length) return;

      const from = { yPercent, opacity: 0, rotate: 2.5, filter: "blur(8px)" };
      const to = {
        yPercent: 0,
        opacity: 1,
        rotate: 0,
        filter: "blur(0px)",
        duration: 1.15,
        ease: EASE.cinema,
        stagger,
        delay,
        clearProps: "filter,transform",
      };

      const animateIn = () => gsap.fromTo(words, from, to);

      if (mode === "immediate") {
        animateIn();
        return;
      }
      if (mode === "active") {
        // While `active` is false the heading is waiting behind the intro
        // curtain. Holding the opening pose here is what stops it from being
        // revealed fully worded during the curtain's one-second lift and only
        // then snapping back to animate in.
        if (active) animateIn();
        else gsap.set(words, from);
        return;
      }
      gsap.fromTo(words, from, {
        ...to,
        scrollTrigger: { trigger: root, start, once: true },
      });
    },
    { scope: rootRef, dependencies: [ready, mode, active, reducedMotion, text], revertOnUpdate: true },
  );

  return createElement(
    Tag,
    { ref: rootRef, className: cn("text-balance", className), id, "aria-label": plain },
    tokens.map((token, i) => (
      <Fragment key={`${token.word}-${i}`}>
        {/* the space lives OUTSIDE the mask so it is never clipped */}
        <span className="inline-block overflow-hidden pb-[0.12em] align-bottom [margin-bottom:-0.12em]">
          <span
            data-word
            className={cn(
              "inline-block will-change-transform",
              token.serif && "story-italic pr-[0.06em]",
            )}
          >
            {token.word}
          </span>
        </span>
        {i < tokens.length - 1 ? " " : null}
      </Fragment>
    )),
  );
}
