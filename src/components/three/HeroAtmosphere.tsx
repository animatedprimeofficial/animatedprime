"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Hero atmosphere: depth dust, soft bokeh and a slowly turning wire form.
 *
 * Deliberately cheap — unlit materials, three point clouds, no shadows, no
 * post-processing. It reads as cinematic haze and hands all the storytelling
 * to the key art underneath. Paused entirely when scrolled out of view.
 */

function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.42)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

interface CloudProps {
  count: number;
  spread: [number, number, number];
  size: number;
  speed: number;
  colors: string[];
  opacity: number;
  texture: THREE.Texture | null;
}

function PointCloud({ count, spread, size, speed, colors, opacity, texture }: CloudProps) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * spread[0];
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
      color.set(colors[Math.floor(Math.random() * colors.length)]);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
    return geo;
  }, [count, spread, colors]);

  useFrame((state, delta) => {
    const points = ref.current;
    if (!points) return;
    points.rotation.z += delta * speed * 0.06;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.35;
    points.position.x = Math.cos(state.clock.elapsedTime * 0.11) * 0.4;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={size}
        map={texture ?? undefined}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** A single large, very soft light bloom — cheaper and softer than a real light. */
function Bokeh({
  position,
  scale,
  color,
  texture,
  opacity,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  texture: THREE.Texture | null;
  opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.22 + position[0]) * 0.4;
    mesh.rotation.z += 0.0009;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function WireForm() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.rotation.x += delta * 0.06;
    mesh.rotation.y += delta * 0.09;
    mesh.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <mesh ref={ref} position={[3.1, 1.6, -3.4]}>
      <icosahedronGeometry args={[1.15, 1]} />
      <meshBasicMaterial color="#8f7bff" wireframe transparent opacity={0.24} />
    </mesh>
  );
}

/** Camera drifts toward the pointer — parallax without user-visible tracking. */
function CameraRig({ enabled }: { enabled: boolean }) {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 6));
  useFrame(() => {
    if (!enabled) return;
    target.current.set(pointer.x * 0.55, pointer.y * 0.35, 6 - Math.abs(pointer.x) * 0.35);
    camera.position.lerp(target.current, 0.045);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export interface HeroAtmosphereProps {
  lowPower?: boolean;
}

export default function HeroAtmosphere({ lowPower = false }: HeroAtmosphereProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const texture = useGlowTexture();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const dustColors = useMemo(() => ["#ffffff", "#a894ff", "#46e5ff", "#ff5ca8"], []);

  return (
    <div ref={hostRef} className="absolute inset-0">
      <Canvas
        dpr={[1, lowPower ? 1.35 : 1.7]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <CameraRig enabled={!lowPower} />
        <PointCloud
          count={lowPower ? 320 : 900}
          spread={[16, 10, 12]}
          size={0.055}
          speed={1}
          colors={dustColors}
          opacity={0.75}
          texture={texture}
        />
        <PointCloud
          count={lowPower ? 90 : 240}
          spread={[20, 12, 14]}
          size={0.24}
          speed={-0.6}
          colors={["#ffffff", "#46e5ff"]}
          opacity={0.35}
          texture={texture}
        />
        {lowPower ? null : (
          <>
            <Bokeh position={[-4.6, -1.4, -3]} scale={7} color="#7c5cff" texture={texture} opacity={0.5} />
            <Bokeh position={[4.2, 2.2, -4]} scale={6} color="#46e5ff" texture={texture} opacity={0.38} />
            <Bokeh position={[0.6, -3.2, -2.4]} scale={5} color="#ff5ca8" texture={texture} opacity={0.26} />
            <WireForm />
          </>
        )}
      </Canvas>
    </div>
  );
}
