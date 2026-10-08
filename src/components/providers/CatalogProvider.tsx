"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Movie } from "@/lib/movies";
import type { Catalog } from "@/lib/catalog";

interface CatalogApi extends Catalog {
  byId: (id: string) => Movie | undefined;
}

const CatalogContext = createContext<CatalogApi | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  const value = useMemo<CatalogApi>(
    () => ({
      ...catalog,
      byId: (id: string) => catalog.movies.find((movie) => movie.id === id),
    }),
    [catalog],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

/**
 * Movie data for client components. Seeded on the server (live TMDB metadata
 * when configured, the curated catalogue otherwise) so the first paint already
 * has real content and no client fetch is needed.
 */
export function useCatalog(): CatalogApi {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used inside <CatalogProvider>");
  }
  return context;
}
