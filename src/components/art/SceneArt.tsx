import { type CSSProperties, type ReactNode, memo, useId } from "react";
import {
  getPalette,
  type Palette,
  type PaletteId,
  type SceneId,
} from "@/lib/palettes";

/* ------------------------------------------------------------------ *
 * Deterministic randomness — a title always renders the same artwork,
 * identically on the server and the client (no hydration drift).
 * ------------------------------------------------------------------ */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type ArtDetail = "simple" | "full";

interface Frame {
  w: number;
  h: number;
  /** y position of the horizon line */
  horizon: number;
  /** subject anchor */
  sx: number;
  sy: number;
  /** base scale unit */
  unit: number;
  wide: boolean;
  /** detail multiplier (particle counts etc.) */
  q: number;
  anim: boolean;
}

type Rng = () => number;

function anim(
  f: Frame,
  name: string,
  dur: number,
  delay = 0,
  easing = "ease-in-out",
): CSSProperties | undefined {
  if (!f.anim) return undefined;
  // Longhand animation properties on purpose: the `animation` shorthand is
  // normalised by the CSSOM into a different string than the one we render on
  // the server, which trips React's hydration check.
  //
  // `fill-box` keeps scale/rotate keyframes anchored to the element itself
  // instead of the SVG viewport. Spread this FIRST so callers can override the
  // origin for shapes that pivot off-centre.
  return {
    animationName: name,
    animationDuration: `${dur}s`,
    animationTimingFunction: easing,
    animationDelay: `${delay}s`,
    animationIterationCount: "infinite",
    animationFillMode: "both",
    transformBox: "fill-box",
    transformOrigin: "50% 50%",
  };
}

/* ------------------------------------------------------------------ *
 * Shared primitives
 *
 * These are pure render helpers, not components: they are invoked as plain
 * functions from the scenes below. The scene tree shares one seeded generator,
 * and React may invoke a component body more than once (StrictMode does it on
 * purpose in development), which would drain extra values out of that shared
 * sequence and produce markup that no longer matches the server's. Running the
 * helpers inline means the sequence is consumed exactly once per render, so the
 * server and the client always draw identical artwork.
 * ------------------------------------------------------------------ */
function Stars({
  f,
  rng,
  count,
  colors,
  spread = 0.62,
  keyPrefix,
}: {
  f: Frame;
  rng: Rng;
  count: number;
  colors: string[];
  spread?: number;
  keyPrefix: string;
}) {
  return (
    <g>
      {Array.from({ length: Math.max(4, Math.round(count * f.q)) }, (_, i) => {
        const x = rng() * f.w;
        const y = rng() * f.h * spread;
        const r = 0.4 + rng() * f.unit * 0.0028;
        return (
          <circle
            key={`${keyPrefix}-${i}`}
            cx={x}
            cy={y}
            r={r}
            fill={colors[Math.floor(rng() * colors.length)]}
            opacity={0.2 + rng() * 0.65}
            style={anim(f, "ap-twinkle", 2.6 + rng() * 4, rng() * 4.5)}
          />
        );
      })}
    </g>
  );
}

function Birds({ f, rng, count, y, color }: { f: Frame; rng: Rng; count: number; y: number; color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={f.unit * 0.0022} strokeLinecap="round" opacity={0.75}>
      {Array.from({ length: count }, (_, i) => {
        const bx = f.w * (0.18 + rng() * 0.68);
        const by = y + (rng() - 0.5) * f.h * 0.12;
        const s = f.unit * (0.012 + rng() * 0.014);
        return (
          <path
            key={`b${i}`}
            d={`M${bx - s} ${by} q${s * 0.5} ${-s * 0.7} ${s} 0 q${s * 0.5} ${-s * 0.7} ${s} 0`}
            style={anim(f, "ap-sway", 6 + rng() * 4, rng() * 3)}
          />
        );
      })}
    </g>
  );
}

function Vignette({ f, p, id }: { f: Frame; p: Palette; id: string }) {
  return (
    <>
      <rect width={f.w} height={f.h} fill={`url(#${id}-vig)`} />
      <rect width={f.w} height={f.h} fill="#000" opacity={0.16} />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 1. Sky whale — the AnimatedPrime signature scene
 * ------------------------------------------------------------------ */
function SkyWhale({ f, p, rng, id }: SceneProps) {
  const cx = f.w * (f.wide ? 0.58 : f.sx);
  // the whale rides just above the light band so its silhouette always has
  // something bright behind it, whatever crop it lands in
  const horizonRatio = f.horizon / f.h;
  const cy = f.h * (f.wide ? 0.33 : Math.max(0.2, horizonRatio - 0.28));
  const whaleW = f.w * (f.wide ? 0.42 : 0.62);
  const sc = whaleW / 100;
  const body =
    "M4 20 C6 12 14 8 24 7 C38 6 54 8 64 13 C70 7 78 3 88 3 C86 8 84 12 78 15 C84 17 88 20 92 22 C88 26 80 27 72 25 C62 29 40 30 26 29 C14 28 7 25 4 20 Z";

  return (
    <>
      <defs>
        <radialGradient id={`${id}-planet`}>
          <stop offset="0%" stopColor={p.accent2} stopOpacity="0.95" />
          <stop offset="55%" stopColor={p.sky[2]} stopOpacity="0.5" />
          <stop offset="100%" stopColor={p.sky[2]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-hor`}>
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.75" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {Stars({ f, rng, count: 110, colors: ["#ffffff", p.accent, p.glow], spread: 0.6, keyPrefix: `${id}st` })}

      <circle cx={f.w * 0.16} cy={f.h * 0.19} r={f.unit * 0.34} fill={`url(#${id}-planet)`} />
      <ellipse
        cx={f.w * 0.16}
        cy={f.h * 0.19}
        rx={f.unit * 0.52}
        ry={f.unit * 0.11}
        fill="none"
        stroke={p.accent}
        strokeOpacity={0.32}
        strokeWidth={f.unit * 0.004}
        transform={`rotate(-18 ${f.w * 0.16} ${f.h * 0.19})`}
      />

      {Array.from({ length: Math.max(2, Math.round(4 * f.q)) }, (_, i) => (
        <ellipse
          key={`neb${i}`}
          cx={f.w * (0.15 + rng() * 0.7)}
          cy={f.h * (0.15 + rng() * 0.4)}
          rx={f.w * (0.18 + rng() * 0.26)}
          ry={f.h * (0.06 + rng() * 0.12)}
          fill={i % 2 === 0 ? p.accent : p.accent2}
          opacity={0.13}
          filter={`url(#${id}-blur60)`}
        />
      ))}

      <ellipse cx={f.w * 0.5} cy={f.horizon} rx={f.w * 0.62} ry={f.h * 0.3} fill={`url(#${id}-hor)`} />

      {/* distant range */}
      <path
        d={`M0 ${f.horizon} L${f.w * 0.14} ${f.horizon - f.h * 0.11} L${f.w * 0.26} ${f.horizon - f.h * 0.03} L${f.w * 0.42} ${f.horizon - f.h * 0.14} L${f.w * 0.6} ${f.horizon - f.h * 0.04} L${f.w * 0.78} ${f.horizon - f.h * 0.12} L${f.w} ${f.horizon - f.h * 0.02} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill={p.ink}
        opacity={0.62}
      />
      <ellipse cx={f.w * 0.5} cy={f.horizon - f.h * 0.02} rx={f.w * 0.7} ry={f.h * 0.05} fill={p.accent} opacity={0.14} filter={`url(#${id}-blur30)`} />

      {/* cloud bands — kept low and faint so they never wash out the whale */}
      {Array.from({ length: Math.max(2, Math.round(6 * f.q)) }, (_, i) => {
        const y = f.h * (0.62 + rng() * 0.34);
        return (
          <ellipse
            key={`cl${i}`}
            cx={rng() * f.w}
            cy={y}
            rx={f.w * (0.14 + rng() * 0.3)}
            ry={f.h * (0.014 + rng() * 0.028)}
            fill={i % 3 === 0 ? p.accent : "#ffffff"}
            opacity={0.05 + rng() * 0.07}
            filter={`url(#${id}-blur30)`}
            style={anim(f, "ap-drift-slow", 22 + rng() * 20, rng() * -20, "linear")}
          />
        );
      })}

      {/* the whale — attribute transform on the outer group, CSS motion on the
          inner one so the two never fight */}
      <g transform={`translate(${cx - whaleW / 2} ${cy}) scale(${sc})`}>
        <g style={anim(f, "ap-bob", 11)}>
        <path d={body} fill={p.accent} opacity={0.2} filter={`url(#${id}-blur30)`} transform="translate(0 -1.5)" />
        <path d={body} fill={p.ink} />
        <path d={body} fill="none" stroke={p.accent} strokeOpacity={0.45} strokeWidth={0.7} />
        <path d="M30 24 C36 30 44 31 47 29 C41 25 36 24 30 24 Z" fill={p.ink} />
        <path d="M8 24 C24 30 52 29 84 18" stroke={p.accent} strokeOpacity={0.22} strokeWidth={0.7} fill="none" />
        <circle cx="13" cy="16.6" r="1.15" fill={p.glow} />
        {/* stardust wake */}
        {Array.from({ length: 7 }, (_, i) => (
          <circle
            key={`wk${i}`}
            cx={84 + i * 3.4}
            cy={20 + Math.sin(i) * 3}
            r={1.5 - i * 0.14}
            fill={p.accent}
            opacity={0.55 - i * 0.06}
            style={anim(f, "ap-twinkle", 2 + i * 0.2, i * 0.15)}
          />
        ))}
        </g>
      </g>

      {/* tiny glider for scale */}
      <g transform={`translate(${f.w * 0.24} ${f.h * 0.62}) scale(${f.unit * 0.0009})`}>
        <g style={anim(f, "ap-sway", 7)}>
          <path d="M0 0 L64 18 L8 26 L26 60 L0 30 L-26 60 L-8 26 L-64 18 Z" fill={p.glow} opacity={0.9} />
        </g>
      </g>

      {/* foreground ridge + lighthouse */}
      <path
        d={`M0 ${f.h} L0 ${f.h * 0.9} Q${f.w * 0.18} ${f.h * 0.82} ${f.w * 0.4} ${f.h * 0.93} L${f.w * 0.6} ${f.h} Z`}
        fill={p.ink}
      />
      <g transform={`translate(${f.w * 0.12} ${f.h * 0.9}) scale(${f.unit * 0.0016})`}>
        <g style={anim(f, "ap-breathe", 5)}>
          <path d="M-30 0 L-16 -120 L16 -120 L30 0 Z" fill={p.ink} />
          <path d="M-16 -120 L16 -120 L11 -150 L-11 -150 Z" fill={p.ink} />
          <circle cx="0" cy="-135" r="7" fill={p.glow} />
        </g>
        <g style={{ ...anim(f, "ap-sweep", 14, 0, "linear"), transformBox: "view-box", transformOrigin: "0px -135px" }}>
          <path d="M0 -135 L-190 -215 L-190 -55 Z" fill={p.glow} opacity={0.18} filter={`url(#${id}-blur30)`} />
        </g>
      </g>

      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 2. Dunes — the long journey scene
 * ------------------------------------------------------------------ */
function Dunes({ f, p, rng, id }: SceneProps) {
  const sunX = f.w * 0.5;
  const sunY = f.horizon - f.h * 0.07;
  const sunR = f.unit * (f.wide ? 0.15 : 0.19);
  const ridge = f.horizon;

  return (
    <>
      <defs>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0%" stopColor="#fff6e0" stopOpacity="0.98" />
          <stop offset="62%" stopColor={p.glow} stopOpacity="0.85" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {Stars({ f, rng, count: 46, colors: ["#ffffff", p.glow], spread: 0.4, keyPrefix: `${id}st` })}

      <circle cx={sunX} cy={sunY} r={sunR * 2.1} fill={`url(#${id}-sun)`} opacity={0.34} filter={`url(#${id}-blur60)`} />
      <circle cx={sunX} cy={sunY} r={sunR} fill="#fff4dc" opacity={0.92} style={anim(f, "ap-breathe", 9)} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect
          key={`hz${i}`}
          x={0}
          y={sunY - sunR * 0.5 + i * f.h * 0.028}
          width={f.w}
          height={f.h * 0.012}
          fill={p.sky[1]}
          opacity={0.25 - i * 0.03}
          filter={`url(#${id}-blur30)`}
        />
      ))}

      <path
        d={`M0 ${ridge} Q${f.w * 0.22} ${ridge - f.h * 0.07} ${f.w * 0.46} ${ridge - f.h * 0.01} T${f.w} ${ridge - f.h * 0.05} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill={p.sky[0]}
        opacity={0.75}
      />
      <path
        d={`M0 ${ridge + f.h * 0.1} Q${f.w * 0.3} ${ridge - f.h * 0.02} ${f.w * 0.58} ${ridge + f.h * 0.1} T${f.w} ${ridge + f.h * 0.04} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill={p.ink}
        opacity={0.9}
      />
      <path
        d={`M0 ${f.h * 0.9} Q${f.w * 0.36} ${f.h * 0.78} ${f.w * 0.72} ${f.h * 0.95} T${f.w} ${f.h * 0.88} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill={p.ink}
      />
      <path
        d={`M0 ${f.h * 0.97} Q${f.w * 0.44} ${f.h * 0.86} ${f.w} ${f.h * 0.99} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill="#000"
        opacity={0.45}
      />

      {/* traveller + shadow */}
      <g transform={`translate(${f.w * 0.42} ${f.h * 0.9}) scale(${f.unit * 0.0014})`}>
        <ellipse cx="26" cy="6" rx="52" ry="5" fill="#000" opacity={0.4} />
        <circle cx="0" cy="-46" r="9" fill={p.ink} />
        <path d="M-8 -37 L8 -37 L13 0 L-13 0 Z" fill={p.ink} />
        <path d="M-4 -30 L-26 4" stroke={p.ink} strokeWidth="4" fill="none" />
        <path d="M6 -30 L22 -6 L22 2" stroke={p.ink} strokeWidth="4" fill="none" />
        <path d="M24 -60 L24 4" stroke={p.ink} strokeWidth="3" fill="none" />
        <circle cx="24" cy="-64" r="4" fill={p.glow} style={anim(f, "ap-flicker", 3)} />
      </g>

      {Birds({ f, rng, count: 3, y: f.h * 0.3, color: p.ink })}
      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 3. Forest — the memory-forest scene
 * ------------------------------------------------------------------ */
function Forest({ f, p, rng, id }: SceneProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-shaft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.accent2} stopOpacity="0.42" />
          <stop offset="100%" stopColor={p.accent2} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-orb`}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor={p.accent2} stopOpacity="0.7" />
          <stop offset="100%" stopColor={p.accent2} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={f.w * 0.76} cy={f.h * 0.17} r={f.unit * 0.11} fill="#eafff2" opacity={0.85} />

      {/* light shafts */}
      {Array.from({ length: Math.max(2, Math.round(5 * f.q)) }, (_, i) => (
        <g key={`sh${i}`} transform={`rotate(${-8 - i} ${f.w * 0.5} 0)`}>
          <rect
            x={f.w * (0.06 + i * 0.2)}
            y={0}
            width={f.w * (0.05 + rng() * 0.07)}
            height={f.h * (0.7 + rng() * 0.3)}
            fill={`url(#${id}-shaft)`}
            style={anim(f, "ap-fade", 6 + i * 0.6, i * 0.4)}
          />
        </g>
      ))}

      {/* tree layers */}
      {[0, 1, 2].map((layer) => {
        const depth = 0.5 + layer * 0.22;
        const baseY = f.h * (0.72 + layer * 0.1);
        const scale = f.unit * (0.0022 + layer * 0.0014);
        const count = Math.max(3, Math.round((f.wide ? 7 : 5) * f.q) + layer);
        return (
          <g key={`tr${layer}`} opacity={0.55 + layer * 0.22}>
            {Array.from({ length: count }, (_, i) => {
              const x = f.w * ((i + rng() * 0.5) / count);
              const hh = f.unit * (0.26 + rng() * 0.24) * (0.7 + depth * 0.5);
              const trunkW = f.unit * 0.016;
              return (
                <g key={`t${layer}${i}`} transform={`translate(${x} ${baseY})`}>
                  <rect x={-trunkW / 2} y={-hh} width={trunkW} height={hh} fill={p.ink} rx={trunkW / 2} />
                  {Array.from({ length: 4 }, (_, c) => (
                    <ellipse
                      key={`c${c}`}
                      cx={(rng() - 0.5) * f.unit * 0.2}
                      cy={-hh - c * f.unit * 0.05}
                      rx={f.unit * (0.13 - c * 0.02)}
                      ry={f.unit * (0.06 - c * 0.008)}
                      fill={p.ink}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* fog */}
      {Array.from({ length: Math.max(2, Math.round(4 * f.q)) }, (_, i) => (
        <rect
          key={`fg${i}`}
          x={-f.w * 0.1}
          y={f.h * (0.62 + i * 0.09)}
          width={f.w * 1.2}
          height={f.h * 0.06}
          fill={p.accent}
          opacity={0.1}
          filter={`url(#${id}-blur30)`}
          style={anim(f, "ap-sway", 14 + i * 3, i * 1.2)}
        />
      ))}

      {/* fireflies */}
      {Array.from({ length: Math.max(6, Math.round(26 * f.q)) }, (_, i) => {
        const r = f.unit * (0.012 + rng() * 0.026);
        return (
          <circle
            key={`ff${i}`}
            cx={rng() * f.w}
            cy={f.h * (0.34 + rng() * 0.58)}
            r={r}
            fill={`url(#${id}-orb)`}
            style={anim(f, "ap-rise", 7 + rng() * 8, rng() * 8)}
          />
        );
      })}

      {/* lantern kid on the path */}
      <g transform={`translate(${f.w * (f.wide ? 0.66 : 0.5)} ${f.h * 0.86}) scale(${f.unit * 0.0012})`}>
        <circle cx="0" cy="-42" r="8" fill={p.ink} />
        <path d="M-7 -34 L7 -34 L11 0 L-11 0 Z" fill={p.ink} />
        <path d="M4 -22 L20 -30" stroke={p.ink} strokeWidth="3" fill="none" />
        <circle cx="22" cy="-30" r="6" fill={p.accent2} opacity={0.9} style={anim(f, "ap-breathe", 4)} />
        <circle cx="22" cy="-30" r="16" fill={p.accent2} opacity={0.22} filter={`url(#${id}-blur30)`} />
      </g>

      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 4. Reef — the drowned city scene
 * ------------------------------------------------------------------ */
function Reef({ f, p, rng, id }: SceneProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-dome`}>
          <stop offset="0%" stopColor="#dffcff" stopOpacity="0.8" />
          <stop offset="100%" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx={f.w * 0.5} cy={-f.h * 0.1} r={f.unit * 0.75} fill={`url(#${id}-dome)`} />

      {Array.from({ length: Math.max(3, Math.round(7 * f.q)) }, (_, i) => (
        <g key={`ry${i}`} transform={`rotate(${(rng() - 0.5) * 12} ${f.w * 0.5} 0)`}>
          <rect
            x={f.w * (i / 7) - f.w * 0.04}
            y={0}
            width={f.w * (0.04 + rng() * 0.06)}
            height={f.h}
            fill={`url(#${id}-ray)`}
            style={anim(f, "ap-fade", 7 + i * 0.8, i * 0.5)}
          />
        </g>
      ))}

      {/* drowned skyline */}
      <g fill={p.ink} opacity={0.85}>
        {Array.from({ length: f.wide ? 16 : 9 }, (_, i) => {
          const w = f.w * (0.035 + rng() * 0.055);
          const x = f.w * (i / (f.wide ? 16 : 9)) + rng() * f.w * 0.02;
          const h = f.h * (0.1 + rng() * 0.3);
          return (
            <g key={`sk${i}`}>
              <rect x={x} y={f.horizon - h} width={w} height={h + f.h * 0.2} rx={w * 0.16} />
              <rect x={x + w * 0.3} y={f.horizon - h - f.h * 0.05} width={w * 0.1} height={f.h * 0.05} />
            </g>
          );
        })}
      </g>
      <g fill={p.accent} opacity={0.55}>
        {Array.from({ length: Math.max(6, Math.round(30 * f.q)) }, (_, i) => (
          <rect key={`wd${i}`} x={rng() * f.w} y={f.horizon - f.h * (0.04 + rng() * 0.34)} width={f.unit * 0.008} height={f.unit * 0.014} rx={2} opacity={0.3 + rng() * 0.7} />
        ))}
      </g>

      {/* reef foreground */}
      <path
        d={`M0 ${f.h} L0 ${f.h * 0.88} C${f.w * 0.12} ${f.h * 0.8} ${f.w * 0.2} ${f.h * 0.95} ${f.w * 0.32} ${f.h * 0.9} C${f.w * 0.44} ${f.h * 0.85} ${f.w * 0.5} ${f.h * 1.0} ${f.w * 0.64} ${f.h * 0.92} C${f.w * 0.78} ${f.h * 0.84} ${f.w * 0.86} ${f.h * 0.97} ${f.w} ${f.h * 0.9} L${f.w} ${f.h} Z`}
        fill={p.ink}
      />
      {Array.from({ length: Math.max(2, Math.round(6 * f.q)) }, (_, i) => {
        const x = rng() * f.w;
        const hh = f.unit * (0.08 + rng() * 0.16);
        return (
          <path
            key={`co${i}`}
            d={`M${x} ${f.h * 0.93} q${hh * 0.3} ${-hh} ${hh * 0.8} ${-hh * 1.2}`}
            stroke={i % 2 ? p.accent : p.accent2}
            strokeWidth={f.unit * 0.008}
            fill="none"
            opacity={0.5}
            style={anim(f, "ap-sway", 5 + i, i * 0.4)}
          />
        );
      })}

      {/* bubbles */}
      {Array.from({ length: Math.max(4, Math.round(20 * f.q)) }, (_, i) => (
        <circle
          key={`bb${i}`}
          cx={rng() * f.w}
          cy={f.h * (0.8 + rng() * 0.25)}
          r={f.unit * (0.004 + rng() * 0.012)}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.5}
          style={anim(f, "ap-rise", 8 + rng() * 9, rng() * 8, "linear")}
        />
      ))}

      {/* fish */}
      {Array.from({ length: Math.max(2, Math.round(5 * f.q)) }, (_, i) => {
        const bx = f.w * (0.1 + rng() * 0.7);
        const by = f.h * (0.3 + rng() * 0.42);
        const s = f.unit * (0.03 + rng() * 0.04);
        return (
          <g key={`fi${i}`} transform={`translate(${bx} ${by}) scale(${s / 30})`}>
            <g style={anim(f, "ap-sway", 5 + rng() * 4, rng() * 3)}>
              <path d="M0 0 C10 -14 34 -14 46 0 C34 14 10 14 0 0 Z" fill={i % 2 ? p.accent2 : p.accent} opacity={0.8} />
              <path d="M-2 0 L-18 -12 L-14 0 L-18 12 Z" fill={i % 2 ? p.accent2 : p.accent} opacity={0.7} />
              <circle cx="36" cy="-1" r="2" fill={p.ink} />
            </g>
          </g>
        );
      })}

      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 5. Islands — the floating-world scene
 * ------------------------------------------------------------------ */
function Islands({ f, p, rng, id }: SceneProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0%" stopColor="#fffdf3" stopOpacity="0.95" />
          <stop offset="70%" stopColor={p.glow} stopOpacity="0.45" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={f.w * 0.68} cy={f.h * 0.22} r={f.unit * 0.46} fill={`url(#${id}-sun)`} />

      {/* clouds */}
      {Array.from({ length: Math.max(3, Math.round(9 * f.q)) }, (_, i) => {
        const cw = f.w * (0.12 + rng() * 0.24);
        const cy = f.h * (0.16 + rng() * 0.62);
        const cx0 = rng() * f.w;
        const op = 0.12 + rng() * 0.24;
        return (
          <g key={`cd${i}`} opacity={op} filter={`url(#${id}-blur30)`} style={anim(f, "ap-drift-slow", 26 + rng() * 24, rng() * -26, "linear")}>
            <ellipse cx={cx0} cy={cy} rx={cw} ry={cw * 0.22} fill="#fff" />
            <ellipse cx={cx0 + cw * 0.3} cy={cy - cw * 0.12} rx={cw * 0.55} ry={cw * 0.18} fill="#fff" />
          </g>
        );
      })}

      {/* floating islands */}
      {Array.from({ length: Math.max(2, Math.round((f.wide ? 4 : 3) * 1)) }, (_, i) => {
        const isl = f.w * (0.13 + rng() * 0.16);
        const x = f.w * (0.1 + i * (0.72 / (f.wide ? 4 : 3)) + rng() * 0.06);
        const y = f.h * (0.32 + rng() * 0.4);
        const depth = 0.7 + rng() * 0.6;
        return (
          <g key={`il${i}`} transform={`translate(${x} ${y}) scale(${depth})`}>
           <g style={anim(f, "ap-bob", 12 + rng() * 8, rng() * 4)}>
            <path d={`M${-isl / 2} 0 L${isl / 2} 0 L${isl * 0.14} ${isl * 0.16} L0 ${isl * 0.78} L${-isl * 0.14} ${isl * 0.16} Z`} fill={p.ink} />
            <ellipse cx="0" cy="0" rx={isl / 2} ry={isl * 0.11} fill={p.sky[2]} opacity={0.9} />
            <ellipse cx="0" cy={-isl * 0.03} rx={isl * 0.44} ry={isl * 0.08} fill={p.accent} opacity={0.85} />
            <path d={`M${-isl * 0.2} ${-isl * 0.06} q0 ${isl * 0.3} ${-isl * 0.02} ${isl * 0.42}`} stroke="#fff" strokeOpacity="0.45" strokeWidth={isl * 0.03} fill="none" />
            <g transform={`translate(${isl * 0.12} ${-isl * 0.08})`}>
              <path d={`M${-isl * 0.015} 0 L${isl * 0.015} 0 L${isl * 0.01} ${-isl * 0.16} L${-isl * 0.01} ${-isl * 0.16} Z`} fill={p.ink} />
              <ellipse cx="0" cy={-isl * 0.19} rx={isl * 0.1} ry={isl * 0.07} fill={p.ink} />
            </g>
           </g>
          </g>
        );
      })}

      {/* balloon */}
      <g transform={`translate(${f.w * 0.22} ${f.h * 0.26}) scale(${f.unit * 0.0022})`}>
        <g style={anim(f, "ap-bob", 14)}>
          <path d="M0 -40 C26 -40 34 -20 22 -4 C16 6 10 8 10 14 L-10 14 C-10 8 -16 6 -22 -4 C-34 -20 -26 -40 0 -40 Z" fill={p.accent2} opacity={0.85} />
          <rect x="-8" y="16" width="16" height="10" rx="3" fill={p.ink} />
        </g>
      </g>

      {Birds({ f, rng, count: 4, y: f.h * 0.5, color: p.ink })}
      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 6. Neon — the megacity scene
 * ------------------------------------------------------------------ */
function Neon({ f, p, rng, id }: SceneProps) {
  const horizon = f.horizon;
  const vpX = f.w * 0.5;
  return (
    <>
      <defs>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0%" stopColor={p.accent2} stopOpacity="0.85" />
          <stop offset="100%" stopColor={p.accent2} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-grid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.accent2} stopOpacity="0.5" />
          <stop offset="100%" stopColor={p.accent} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {Stars({ f, rng, count: 54, colors: ["#ffffff", p.accent2], spread: 0.42, keyPrefix: `${id}st` })}

      <circle cx={vpX} cy={horizon - f.h * 0.14} r={f.unit * 0.36} fill={`url(#${id}-sun)`} />
      <circle cx={vpX} cy={horizon - f.h * 0.14} r={f.unit * 0.2} fill={p.accent2} opacity={0.55} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`sl${i}`} x={vpX - f.unit * 0.22} y={horizon - f.h * 0.22 + i * f.unit * 0.045} width={f.unit * 0.44} height={f.unit * 0.012} fill={p.ink} opacity={0.75} />
      ))}

      {/* perspective grid */}
      <g stroke={`url(#${id}-grid)`} strokeWidth={f.unit * 0.003}>
        {Array.from({ length: 15 }, (_, i) => {
          const t = i / 14;
          return <line key={`gv${i}`} x1={vpX + (t - 0.5) * f.w * 0.34} y1={horizon} x2={vpX + (t - 0.5) * f.w * 3.4} y2={f.h} />;
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const t = (i / 12) ** 2.1;
          return <line key={`gh${i}`} x1={0} y1={horizon + t * (f.h - horizon)} x2={f.w} y2={horizon + t * (f.h - horizon)} />;
        })}
      </g>

      {/* skyline */}
      <g>
        {Array.from({ length: f.wide ? 18 : 10 }, (_, i) => {
          const w = f.w * (0.03 + rng() * 0.05);
          const x = (f.w / (f.wide ? 18 : 10)) * i + rng() * f.w * 0.02;
          const h = f.h * (0.08 + rng() * 0.26);
          const tower = (
            <g key={`tw${i}`}>
              <rect x={x} y={horizon - h} width={w} height={h} fill={p.ink} />
              <rect x={x + w * 0.42} y={horizon - h - f.h * 0.06} width={w * 0.08} height={f.h * 0.06} fill={p.ink} />
              <rect x={x + w * 0.3} y={horizon - h - f.h * 0.09} width={w * 0.4} height={w * 0.4} fill={p.accent} opacity={0.75} />
            </g>
          );
          return tower;
        })}
      </g>
      <g fill={p.accent} opacity={0.5}>
        {Array.from({ length: Math.max(8, Math.round(38 * f.q)) }, (_, i) => (
          <rect key={`nw${i}`} x={rng() * f.w} y={horizon - f.h * (0.03 + rng() * 0.3)} width={f.unit * 0.007} height={f.unit * 0.012} opacity={0.35 + rng() * 0.65} />
        ))}
      </g>

      {/* signage */}
      {Array.from({ length: Math.max(1, Math.round(3 * f.q)) }, (_, i) => {
        const x = f.w * (0.1 + rng() * 0.75);
        const y = horizon - f.h * (0.1 + rng() * 0.28);
        const color = i % 2 === 0 ? p.accent : p.accent2;
        return (
          <g key={`sg${i}`} style={anim(f, "ap-flicker", 3 + rng() * 3, rng() * 2)}>
            <rect x={x} y={y} width={f.unit * 0.012} height={f.unit * (0.12 + rng() * 0.16)} rx={f.unit * 0.006} fill={color} opacity={0.9} />
            <rect x={x - f.unit * 0.02} y={y} width={f.unit * 0.05} height={f.unit * 0.12} rx={f.unit * 0.006} fill={color} opacity={0.14} filter={`url(#${id}-blur30)`} />
          </g>
        );
      })}

      {/* light streaks / rain */}
      <g stroke={p.accent2} strokeOpacity={0.28} strokeWidth={f.unit * 0.0016}>
        {Array.from({ length: Math.max(5, Math.round(22 * f.q)) }, (_, i) => {
          const x = rng() * f.w;
          const y = rng() * f.h;
          const len = f.unit * (0.06 + rng() * 0.14);
          return (
            <line
              key={`rn${i}`}
              x1={x}
              y1={y}
              x2={x - len * 0.28}
              y2={y + len}
              style={anim(f, "ap-fall", 1.6 + rng() * 2.4, rng() * 3, "linear")}
            />
          );
        })}
      </g>

      <path
        d={`M0 ${f.h * 0.95} Q${f.w * 0.3} ${f.h * 0.9} ${f.w * 0.55} ${f.h * 0.97} T${f.w} ${f.h * 0.94} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill="#000"
        opacity={0.85}
      />
      <path
        d={`M${f.w * 0.1} ${f.h * 0.98} C${f.w * 0.3} ${f.h * 0.86} ${f.w * 0.55} ${f.h * 0.9} ${f.w * 0.9} ${f.h * 0.98}`}
        stroke={p.accent}
        strokeWidth={f.unit * 0.02}
        fill="none"
        opacity={0.5}
        filter={`url(#${id}-blur30)`}
        style={anim(f, "ap-breathe", 4)}
      />
      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 7. Aurora — the deep-space scene
 * ------------------------------------------------------------------ */
function Aurora({ f, p, rng, id }: SceneProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-rib`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.7" />
          <stop offset="55%" stopColor={p.accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.accent2} stopOpacity="0" />
        </linearGradient>
      </defs>

      {Stars({ f, rng, count: 140, colors: ["#ffffff", p.accent2, p.glow], spread: 0.7, keyPrefix: `${id}st` })}
      <circle cx={f.w * 0.8} cy={f.h * 0.14} r={f.unit * 0.07} fill="#f6fbff" opacity={0.95} />
      <circle cx={f.w * 0.8} cy={f.h * 0.14} r={f.unit * 0.19} fill={p.accent2} opacity={0.16} filter={`url(#${id}-blur60)`} />

      {Array.from({ length: Math.max(2, Math.round(5 * f.q)) }, (_, i) => {
        const y0 = f.h * (0.12 + i * 0.07);
        const y1 = f.h * (0.42 + i * 0.06);
        return (
          <path
            key={`rb${i}`}
            d={`M${-f.w * 0.1} ${y0} C${f.w * 0.3} ${y0 - f.h * 0.16} ${f.w * 0.55} ${y1 + f.h * 0.1} ${f.w * 1.1} ${y1 - f.h * 0.14}`}
            stroke={`url(#${id}-rib)`}
            strokeWidth={f.unit * (0.05 + i * 0.02)}
            fill="none"
            filter={`url(#${id}-blur30)`}
            opacity={0.75 - i * 0.08}
            style={anim(f, "ap-breathe", 8 + i * 1.4, i * 0.8)}
          />
        );
      })}

      {/* mountains */}
      <path
        d={`M0 ${f.h * 0.82} L${f.w * 0.16} ${f.h * 0.6} L${f.w * 0.28} ${f.h * 0.78} L${f.w * 0.46} ${f.h * 0.54} L${f.w * 0.62} ${f.h * 0.76} L${f.w * 0.8} ${f.h * 0.64} L${f.w} ${f.h * 0.84} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill={p.ink}
      />
      <path
        d={`M0 ${f.h * 0.9} L${f.w * 0.22} ${f.h * 0.76} L${f.w * 0.4} ${f.h * 0.92} L${f.w * 0.66} ${f.h * 0.78} L${f.w} ${f.h * 0.93} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill="#000"
        opacity={0.6}
      />
      <ellipse cx={f.w * 0.5} cy={f.h * 0.84} rx={f.w * 0.6} ry={f.h * 0.04} fill={p.accent} opacity={0.16} filter={`url(#${id}-blur30)`} />

      {/* ship + wake */}
      <g transform={`translate(${f.w * 0.34} ${f.h * 0.42}) scale(${f.unit * 0.0016})`}>
        <g style={anim(f, "ap-bob", 8)}>
          <path d="M0 0 L42 -8 L28 6 Z" fill={p.accent2} opacity={0.95} />
          <circle cx="30" cy="0" r="12" fill={p.accent2} opacity={0.28} filter={`url(#${id}-blur30)`} />
        </g>
      </g>
      <path
        d={`M${f.w * 0.34} ${f.h * 0.44} C${f.w * 0.24} ${f.h * 0.5} ${f.w * 0.16} ${f.h * 0.48} ${f.w * 0.04} ${f.h * 0.54}`}
        stroke={p.accent2}
        strokeWidth={f.unit * 0.006}
        strokeDasharray={`${f.unit * 0.02} ${f.unit * 0.02}`}
        fill="none"
        opacity={0.5}
        style={anim(f, "ap-breathe", 5)}
      />

      {Vignette({ f, p, id })}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 8. Clockwork — the mystery scene
 * ------------------------------------------------------------------ */
function Clockwork({ f, p, rng, id }: SceneProps) {
  const cx = f.w * (f.wide ? 0.68 : 0.5);
  const cy = f.h * (f.wide ? 0.42 : 0.34);
  const r = f.unit * (f.wide ? 0.3 : 0.34);

  const gear = (teeth: number, radius: number, color: string, opacity: number) => {
    const pts: string[] = [];
    const steps = teeth * 2;
    for (let i = 0; i < steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      const rad = i % 2 === 0 ? radius : radius * 0.82;
      pts.push(`${Math.cos(a) * rad},${Math.sin(a) * rad}`);
    }
    return (
      <g opacity={opacity}>
        <polygon points={pts.join(" ")} fill="none" stroke={color} strokeWidth={radius * 0.06} />
        <circle r={radius * 0.34} fill="none" stroke={color} strokeWidth={radius * 0.05} />
      </g>
    );
  };

  return (
    <>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {Stars({ f, rng, count: 70, colors: ["#ffffff", p.accent, p.glow], spread: 0.5, keyPrefix: `${id}st` })}
      <circle cx={cx} cy={cy} r={r * 2.2} fill={`url(#${id}-halo)`} filter={`url(#${id}-blur60)`} />

      <g transform={`translate(${cx} ${cy})`}>
        <g style={anim(f, "ap-spin", 90, 0, "linear")}>{gear(22, r * 1.16, p.accent, 0.55)}</g>
        <g style={anim(f, "ap-spin", 60, 0, "linear")}>{gear(26, r, p.accent, 0.35)}</g>
      </g>

      {/* clock face */}
      <circle cx={cx} cy={cy} r={r} fill={p.ink} opacity={0.85} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={p.glow} strokeOpacity={0.75} strokeWidth={r * 0.02} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const inner = r * 0.86;
        const outer = r * 0.96;
        return (
          <line
            key={`tk${i}`}
            x1={cx + Math.cos(a) * inner}
            y1={cy + Math.sin(a) * inner}
            x2={cx + Math.cos(a) * outer}
            y2={cy + Math.sin(a) * outer}
            stroke={p.glow}
            strokeOpacity={0.6}
            strokeWidth={r * (i % 3 === 0 ? 0.028 : 0.014)}
          />
        );
      })}
      <g style={{ ...anim(f, "ap-spin", 44, 0, "linear"), transformOrigin: "50% 100%" }}>
        <rect x={cx - r * 0.03} y={cy - r * 0.6} width={r * 0.06} height={r * 0.6} rx={r * 0.03} fill={p.glow} />
      </g>
      <g style={{ ...anim(f, "ap-spin-rev", 90, 0, "linear"), transformOrigin: "50% 100%" }}>
        <rect x={cx - r * 0.02} y={cy - r * 0.85} width={r * 0.04} height={r * 0.85} rx={r * 0.02} fill={p.accent2} />
      </g>
      <circle cx={cx} cy={cy} r={r * 0.045} fill={p.glow} />

      {/* rooftops + fox */}
      <path
        d={`M0 ${f.h * 0.84} L0 ${f.h * 0.78} L${f.w * 0.14} ${f.h * 0.78} L${f.w * 0.14} ${f.h * 0.72} L${f.w * 0.3} ${f.h * 0.72} L${f.w * 0.3} ${f.h * 0.8} L${f.w * 0.48} ${f.h * 0.8} L${f.w * 0.48} ${f.h * 0.74} L${f.w * 0.64} ${f.h * 0.74} L${f.w * 0.64} ${f.h * 0.82} L${f.w} ${f.h * 0.82} L${f.w} ${f.h} L0 ${f.h} Z`}
        fill={p.ink}
      />
      <g transform={`translate(${f.w * 0.34} ${f.h * 0.72}) scale(${f.unit * 0.0013})`}>
        <path d="M-16 0 L-14 -30 L-30 -46 L-8 -40 L0 -54 L8 -40 L30 -46 L14 -30 L16 0 Z" fill="#000" opacity={0.75} />
        <path d="M10 -20 C34 -22 46 -10 40 0 C34 -12 22 -14 10 -14 Z" fill="#000" opacity={0.75} style={{...anim(f, "ap-sway", 6), transformOrigin: "0% 50%" }} />
        <circle cx="-8" cy="-32" r="2.4" fill={p.glow} style={anim(f, "ap-twinkle", 2.4)} />
      </g>

      {/* drifting lanterns */}
      {Array.from({ length: Math.max(3, Math.round(12 * f.q)) }, (_, i) => (
        <circle
          key={`ln${i}`}
          cx={rng() * f.w}
          cy={f.h * (0.5 + rng() * 0.5)}
          r={f.unit * (0.005 + rng() * 0.009)}
          fill={p.accent2}
          opacity={0.7}
          style={anim(f, "ap-rise", 10 + rng() * 8, rng() * 8, "linear")}
        />
      ))}

      {Vignette({ f, p, id })}
    </>
  );
}

interface SceneProps {
  f: Frame;
  p: Palette;
  rng: Rng;
  id: string;
}

const SCENE_MAP: Record<SceneId, (props: SceneProps) => ReactNode> = {
  skywhale: SkyWhale,
  dunes: Dunes,
  forest: Forest,
  reef: Reef,
  islands: Islands,
  neon: Neon,
  aurora: Aurora,
  clockwork: Clockwork,
};

/* ------------------------------------------------------------------ *
 * Public component
 * ------------------------------------------------------------------ */
export interface SceneArtProps {
  scene: SceneId;
  palette: PaletteId;
  /** intrinsic artwork size — the SVG slices to fill its container */
  width?: number;
  height?: number;
  /** 0–1 vertical position of the horizon */
  horizon?: number;
  detail?: ArtDetail;
  /** enable idle scene animation (CSS driven) */
  animate?: boolean;
  /** stable seed for the deterministic particle layout */
  seed?: string;
  className?: string;
}

function SceneArtInner({
  scene,
  palette,
  width = 800,
  height = 1200,
  horizon,
  detail = "full",
  animate = false,
  seed = scene,
  className,
}: SceneArtProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `ap${rawId}`;
  const p = getPalette(palette);
  // One generator per render, created fresh from the seed: whatever React does
  // with this component body, the sequence always starts in the same place.
  const rng = makeRng(hashString(`${seed}-${palette}-${scene}-${width}x${height}`));
  const wide = width / height > 1.25;

  const f: Frame = {
    w: width,
    h: height,
    horizon: height * (horizon ?? (wide ? 0.72 : 0.62)),
    sx: 0.5,
    sy: 0.42,
    unit: Math.min(width, height),
    wide,
    q: detail === "simple" ? 0.4 : 1,
    anim: animate,
  };

  const Scene = SCENE_MAP[scene] ?? SkyWhale;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor={p.ink} />
          <stop offset="28%" stopColor={p.sky[0]} />
          <stop offset="66%" stopColor={p.sky[1]} />
          <stop offset="100%" stopColor={p.sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}-vig`} cx="50%" cy="46%" r="72%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor={p.ink} stopOpacity="0.85" />
        </radialGradient>
        <filter id={`${id}-blur30`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(3, width * 0.018)} />
        </filter>
        <filter id={`${id}-blur60`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={Math.max(6, width * 0.045)} />
        </filter>
      </defs>

      <rect width={width} height={height} fill={`url(#${id}-sky)`} />
      {Scene({ f, p, rng, id })}
    </svg>
  );
}

export const SceneArt = memo(SceneArtInner);
SceneArt.displayName = "SceneArt";

export default SceneArt;
