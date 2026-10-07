"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the section occupying the middle band of the viewport. IntersectionObserver
 * rather than ScrollTrigger on purpose: this is pure navigation state, it should
 * cost nothing and survive layout churn.
 */
export function useActiveSection(ids: string[], rootMargin = "-45% 0px -50% 0px"): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin, threshold: [0.05, 0.25, 0.5, 0.75] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, rootMargin]);

  return active;
}
