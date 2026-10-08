"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePosterTexture } from "@/hooks/usePosterTexture";
import type { Movie } from "@/lib/movies";

/**
 * "Entering an animated world".
 *
 * A corridor of floating key art. Scroll progress (written into a ref by
 * ScrollTrigger, never through React state) drives the camera down the tunnel;
 * each poster drifts on its own depth-locked rhythm. Everything is unlit and
 * pool-free so it stays smooth on laptops while looking like a title sequence.
 */

interface PosterProps {
  movie: Movie;
  position: [number, number, number];
  scale: number;
  tilt: number;
  phase: number;
  progress: RefObject<number>;
  lowPower: boolean;
}

function Poster({ movie, position, scale, tilt, phase, progress, lowPower }: PosterProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Real poster when the catalogue has one, generated key art otherwise.
  const texture = usePosterTexture(movie);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const depth = progress.current ?? 0;

    mesh.position.y = position[1] + Math.sin(t * 0.4 + phase) * (lowPower ? 0.12 : 0.26);
    mesh.position.x = position[0] + Math.cos(t * 0.28 + phase) * (lowPower ? 0.1 : 0.22);
    mesh.position.z = position[2] + depth * 6;

    // billboard with a touch of authored lean so the corridor reads as 3D
    mesh.rotation.y = Math.sin(t * 0.2 + phase) * 0.28 + tilt * 0.5;
    mesh.rotation.z = Math.sin(t * 0.24 + phase * 1.4) * 0.06 + tilt * 0.12;
    mesh.rotation.x = Math.cos(t * 0.18 + phase) * 0.08;

    if (frameRef.current) {
      frameRef.current.position.copy(mesh.position);
      frameRef.current.rotation.copy(mesh.rotation);
      frameRef.current.position.z -= 0.03;
    }

    if (!lowPower) mesh.lookAt(camera.position.x * 0.2, camera.position.y * 0.2, camera.position.z);
  });

  return (
    <>
      <mesh ref={meshRef} position={position} scale={scale}>
        <planeGeometry args={[1, 1.5]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={0.96} />
      </mesh>
      <mesh ref={frameRef} position={position} scale={scale * 1.045}>
        <planeGeometry args={[1, 1.5]} />
        <meshBasicMaterial color="#5b4bff" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  );
}

function Dust({ count, progress }: { count: number; progress: RefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = -Math.random() * 46;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const points = ref.current;
    if (!points) return;
    points.rotation.z += delta * 0.012;
    points.position.z = -8 + (progress.current ?? 0) * 10;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.6;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.09}
        color="#9fd8ff"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Rig({ progress, lowPower }: { progress: RefObject<number>; lowPower: boolean }) {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 8));

  useFrame(() => {
    const depth = progress.current ?? 0;
    const sway = lowPower ? 0 : pointer.x * 1.1;
    const rise = lowPower ? 0 : pointer.y * 0.7;
    target.current.set(
      sway + Math.sin(depth * Math.PI * 1.4) * 1.5,
      rise + Math.cos(depth * Math.PI) * 0.6,
      8 - depth * 22,
    );
    camera.position.lerp(target.current, 0.055);
    camera.rotation.z = Math.sin(depth * Math.PI * 2) * 0.03;
    camera.lookAt(0, 0, camera.position.z - 6);
  });

  return null;
}

export interface ImmersiveCanvasProps {
  movies: Movie[];
  progress: RefObject<number>;
  lowPower?: boolean;
  idle?: boolean;
}

export default function ImmersiveCanvas({
  movies,
  progress,
  lowPower = false,
  idle = false,
}: ImmersiveCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const idleProgress = useRef(0.12);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px",
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Idle mode (mobile / reduced motion): a slow ambient drift instead of scroll drive.
  useEffect(() => {
    if (!idle) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      idleProgress.current = 0.06 + Math.sin(t * 0.16) * 0.06;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idle]);

  const posters = useMemo(() => {
    const spacing = 5.4;
    return movies.slice(0, lowPower ? 7 : 12).map((movie, index) => {
      const angle = index * 0.9;
      const radius = lowPower ? 2.6 : 3.5 + (index % 3) * 0.7;
      return {
        movie,
        position: [
          Math.sin(angle) * radius,
          Math.cos(angle * 1.3) * (lowPower ? 1.5 : 2.3),
          -index * spacing - 3,
        ] as [number, number, number],
        scale: (lowPower ? 2.1 : 2.5) + (index % 4) * 0.25,
        tilt: index % 2 === 0 ? 0.12 : -0.14,
        phase: index * 1.7,
      };
    });
  }, [movies, lowPower]);

  return (
    <div ref={hostRef} className="absolute inset-0">
      <Canvas
        dpr={[1, lowPower ? 1.3 : 1.7]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0, 8], fov: 48 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <Rig progress={idle ? idleProgress : progress} lowPower={lowPower} />
        <Dust count={lowPower ? 500 : 1600} progress={idle ? idleProgress : progress} />
        {posters.map((poster) => (
          <Poster
            key={poster.movie.id}
            {...poster}
            progress={idle ? idleProgress : progress}
            lowPower={lowPower}
          />
        ))}
      </Canvas>
    </div>
  );
}
