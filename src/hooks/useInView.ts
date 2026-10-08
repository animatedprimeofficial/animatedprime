"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * True once an element has come within `rootMargin` of the viewport.
 *
 * Used to defer genuinely expensive children — WebGL contexts, texture
 * downloads, thousands of triangles — until the reader is approaching them.
 * The trigger is one-way: once the scene has been built it stays built, so
 * travelling back up the page never rebuilds it or flashes an empty frame.
 */
export function useInView<T extends HTMLElement>(rootMargin = "600px") {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  /*
   * A callback ref rather than a `useRef` handle: the element this hangs off
   * changes as the layout settles (the mobile composition renders first, then
   * desktop takes over), and the observer has to follow it to the live node.
   */
  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || inView) return;

      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setInView(true);
          observer.disconnect();
        },
        { rootMargin },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [inView, rootMargin],
  );

  return [ref, inView] as const;
}
