"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drag-to-scroll for horizontal rails on fine pointers. Touch devices are left
 * alone — native momentum scrolling is better than anything we'd fake.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = false;
    let startX = 0;
    let startLeft = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let raf = 0;

    const stopMomentum = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      active = true;
      setDragging(true);
      startX = event.clientX;
      startLeft = el.scrollLeft;
      lastX = event.clientX;
      lastTime = performance.now();
      velocity = 0;
      stopMomentum();
      el.style.scrollSnapType = "none";
      el.setPointerCapture?.(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!active) return;
      el.scrollLeft = startLeft - (event.clientX - startX);
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocity = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastTime = now;
    };

    const onUp = (event: PointerEvent) => {
      if (!active) return;
      active = false;
      setDragging(false);
      el.releasePointerCapture?.(event.pointerId);
      el.style.scrollSnapType = "";

      let v = velocity * 20;
      if (Math.abs(v) < 0.6) return;
      const step = () => {
        el.scrollLeft -= v;
        v *= 0.93;
        if (Math.abs(v) > 0.5) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      // Shift+wheel and trackpad horizontal gestures already work; map plain
      // vertical wheel to the rail only when it can still travel.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const atStart = el.scrollLeft <= 1 && event.deltaY < 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && event.deltaY > 0;
      if (atStart || atEnd) return;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      stopMomentum();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return { ref, dragging };
}
