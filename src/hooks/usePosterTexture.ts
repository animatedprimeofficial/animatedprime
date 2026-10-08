"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { createPosterCanvas } from "@/lib/posterTexture";
import type { Movie } from "@/lib/movies";

function generatedTexture(movie: Movie): THREE.Texture {
  const canvas = createPosterCanvas({
    title: movie.title,
    palette: movie.palette,
    scene: movie.scene,
    year: movie.year,
    rating: movie.rating,
    genre: movie.genre[0] ?? "Animation",
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Artwork for a poster inside the 3D corridor.
 *
 * The generated key art is painted synchronously, so the corridor is never full
 * of empty planes and still looks right when there is no catalogue key, no
 * network, or a poster that 404s. The official image is fetched in the
 * background — TMDB's CDN sends permissive CORS headers, so it is safe to use
 * as a WebGL texture — and swapped in the moment it arrives.
 *
 * Textures are GPU memory, so every replaced texture is disposed.
 */
export function usePosterTexture(movie: Movie): THREE.Texture {
  const seed = `${movie.id}|${movie.title}|${movie.palette}|${movie.scene}|${movie.year}|${movie.rating}`;
  const posterUrl = movie.posterUrl;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `seed` captures every field the painter reads
  const generated = useMemo(() => generatedTexture(movie), [seed]);
  const [official, setOfficial] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    setOfficial(null);
    if (!posterUrl) return;

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      posterUrl,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        setOfficial(texture);
      },
      undefined,
      () => {
        /* unreachable or blocked — the generated art carries the poster */
      },
    );

    return () => {
      cancelled = true;
    };
  }, [posterUrl, seed]);

  useEffect(() => () => generated.dispose(), [generated]);
  useEffect(() => {
    if (!official) return;
    const texture = official;
    return () => texture.dispose();
  }, [official]);

  return official ?? generated;
}
