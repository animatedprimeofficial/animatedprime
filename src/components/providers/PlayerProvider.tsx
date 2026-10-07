"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Movie } from "@/lib/movies";

interface PlayerApi {
  movie: Movie | null;
  open: (movie: Movie) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerApi>({
  movie: null,
  open: () => {},
  close: () => {},
});

export function usePlayer(): PlayerApi {
  return useContext(PlayerContext);
}

/**
 * Drives the cinematic preview overlay. Every "Watch Now" / play affordance in
 * the app funnels through here so playback intent has one home.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [movie, setMovie] = useState<Movie | null>(null);

  const open = useCallback((next: Movie) => setMovie(next), []);
  const close = useCallback(() => setMovie(null), []);

  const value = useMemo<PlayerApi>(() => ({ movie, open, close }), [movie, open, close]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
