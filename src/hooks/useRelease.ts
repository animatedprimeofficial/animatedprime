"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppRelease } from "@/lib/release";

const RELEASE_EVENT = "animatedprime:release";

/**
 * One request per page, no matter how many components ask for release facts.
 * A handful of buttons and the release panel all want the same JSON, so the
 * first caller pays for it and everybody else shares the answer.
 */
let inflight: Promise<AppRelease | null> | null = null;

function fetchRelease(force: boolean): Promise<AppRelease | null> {
  if (!force && inflight) return inflight;
  const request = fetch(`/api/release${force ? "?refresh=1" : ""}`, { cache: "no-store" })
    .then((response) => (response.ok ? (response.json() as Promise<AppRelease>) : null))
    .catch(() => null);
  inflight = request;
  return request;
}

/**
 * Live Android release facts.
 *
 * The server seeds the first paint with whatever it resolved at build time, so
 * the panel is never empty and never guesses. That snapshot goes stale the
 * moment a signed APK is dropped into `public/downloads`, so this re-reads
 * `/api/release` once on mount — and again whenever any part of the UI asks for
 * a refresh, which is how "Check for updates" propagates to every button.
 */
export function useRelease(initial: AppRelease) {
  const [release, setRelease] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const pull = useCallback(async (force = false) => {
    setRefreshing(true);
    const latest = await fetchRelease(force);
    if (latest) setRelease(latest);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void pull(false);
    const onRefresh = () => void pull(true);
    window.addEventListener(RELEASE_EVENT, onRefresh);
    return () => window.removeEventListener(RELEASE_EVENT, onRefresh);
  }, [pull]);

  return { release, refreshing, pull };
}

/** Tells every mounted `useRelease` to re-read the release manifest. */
export function requestReleaseRefresh(): void {
  window.dispatchEvent(new Event(RELEASE_EVENT));
}
