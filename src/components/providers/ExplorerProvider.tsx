"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ExplorerSort = "popular" | "new" | "top";

interface ExplorerApi {
  query: string;
  setQuery: (value: string) => void;
  genre: string;
  setGenre: (value: string) => void;
  sort: ExplorerSort;
  setSort: (value: ExplorerSort) => void;
  reset: () => void;
}

const ExplorerContext = createContext<ExplorerApi>({
  query: "",
  setQuery: () => {},
  genre: "All",
  setGenre: () => {},
  sort: "popular",
  setSort: () => {},
  reset: () => {},
});

export function useExplorer(): ExplorerApi {
  return useContext(ExplorerContext);
}

/**
 * The explorer's filters live above the section so the genre cards and the
 * closing CTAs can steer the browser directly — one browsing intent, one state.
 */
export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState<ExplorerSort>("popular");

  const value = useMemo<ExplorerApi>(
    () => ({
      query,
      setQuery,
      genre,
      setGenre,
      sort,
      setSort,
      reset: () => {
        setQuery("");
        setGenre("All");
        setSort("popular");
      },
    }),
    [query, genre, sort],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}
