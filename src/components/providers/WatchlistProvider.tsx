"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface WatchlistApi {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  /** increments whenever the list mutates — handy for one-shot animations */
  revision: number;
}

const WatchlistContext = createContext<WatchlistApi>({
  ids: [],
  count: 0,
  has: () => false,
  toggle: () => {},
  clear: () => {},
  revision: 0,
});

export function useWatchlist(): WatchlistApi {
  return useContext(WatchlistContext);
}

const STORAGE_KEY = "animatedprime:watchlist";

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      /* localStorage unavailable — the list simply starts empty */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore quota / privacy-mode failures */
    }
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
    setRevision((r) => r + 1);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const clear = useCallback(() => {
    setIds([]);
    setRevision((r) => r + 1);
  }, []);

  const value = useMemo<WatchlistApi>(
    () => ({ ids, count: ids.length, has, toggle, clear, revision }),
    [ids, has, toggle, clear, revision],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}
