import { getPalette, type PaletteId, type SceneId } from "@/lib/palettes";

export interface PosterTextureSubject {
  title: string;
  palette: PaletteId;
  scene: SceneId;
  year: number;
  rating: number;
  genre: string;
}

function rngFrom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Paints a poster into a canvas so the WebGL layer can show real, on-brand key
 * art instead of flat colour planes. Same palette source as the DOM artwork, so
 * a title looks like itself in both worlds.
 */
export function createPosterCanvas(
  subject: PosterTextureSubject,
  width = 512,
  height = 768,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const p = getPalette(subject.palette);
  const random = rngFrom(`${subject.title}-${subject.palette}`);
  const unit = Math.min(width, height);

  // sky
  const sky = ctx.createLinearGradient(0, 0, width * 0.3, height);
  sky.addColorStop(0, p.ink);
  sky.addColorStop(0.3, p.sky[0]);
  sky.addColorStop(0.68, p.sky[1]);
  sky.addColorStop(1, p.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // low light source
  const horizon = height * 0.66;
  const glow = ctx.createRadialGradient(width * 0.5, horizon - height * 0.08, 0, width * 0.5, horizon - height * 0.08, unit * 0.8);
  glow.addColorStop(0, `${p.glow}cc`);
  glow.addColorStop(0.45, `${p.glow}33`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // stars
  for (let i = 0; i < 90; i += 1) {
    ctx.globalAlpha = 0.2 + random() * 0.7;
    ctx.fillStyle = i % 4 === 0 ? p.accent : "#ffffff";
    const r = 0.6 + random() * 2.2;
    ctx.beginPath();
    ctx.arc(random() * width, random() * height * 0.6, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // scene silhouette
  ctx.fillStyle = p.ink;
  if (subject.scene === "neon" || subject.scene === "clockwork" || subject.scene === "reef") {
    const count = 9;
    for (let i = 0; i < count; i += 1) {
      const w = width * (0.05 + random() * 0.09);
      const x = (width / count) * i + random() * width * 0.02;
      const h = height * (0.08 + random() * 0.28);
      ctx.fillRect(x, horizon - h, w, h + height * 0.2);
    }
  } else if (subject.scene === "forest") {
    for (let i = 0; i < 10; i += 1) {
      const x = random() * width;
      const h = height * (0.18 + random() * 0.26);
      ctx.fillRect(x - width * 0.012, horizon - h, width * 0.024, h);
      for (let c = 0; c < 3; c += 1) {
        ctx.beginPath();
        ctx.ellipse(x, horizon - h - c * height * 0.03, width * (0.11 - c * 0.02), height * (0.035 - c * 0.006), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // rolling ranges + dunes
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    const steps = 6;
    for (let i = 0; i <= steps; i += 1) {
      const x = (width / steps) * i;
      ctx.lineTo(x, horizon - height * (0.02 + random() * 0.16));
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.88);
    ctx.quadraticCurveTo(width * 0.35, height * 0.78, width * 0.7, height * 0.95);
    ctx.quadraticCurveTo(width * 0.9, height * 0.99, width, height * 0.9);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // signature subject for the whale scene
  if (subject.scene === "skywhale") {
    ctx.save();
    ctx.translate(width * 0.5, height * 0.36);
    ctx.scale(width / 100, width / 100);
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.bezierCurveTo(-44, -8, -36, -12, -26, -13);
    ctx.bezierCurveTo(-14, -14, 2, -13, 14, -8);
    ctx.lineTo(26, -17);
    ctx.lineTo(32, -7);
    ctx.lineTo(42, -14);
    ctx.lineTo(38, -2);
    ctx.bezierCurveTo(30, 4, 10, 8, -10, 9);
    ctx.bezierCurveTo(-26, 10, -40, 7, -46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `${p.accent}77`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = p.glow;
    ctx.beginPath();
    ctx.arc(-37, -3.4, 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // mood wash + vignette
  const wash = ctx.createLinearGradient(0, height * 0.4, 0, height);
  wash.addColorStop(0, "transparent");
  wash.addColorStop(1, `${p.sky[1]}55`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.45, unit * 0.18, width * 0.5, height * 0.5, unit * 0.95);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, `${p.ink}f2`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // title lockup
  const titleSize = Math.max(18, width * 0.088);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = `700 ${titleSize}px "Outfit", system-ui, sans-serif`;
  const words = subject.title.toUpperCase().split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > width * 0.86 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  const lineHeight = titleSize * 1.05;
  const baseY = height * 0.86 - (lines.length - 1) * lineHeight;
  lines.forEach((line, index) => {
    ctx.fillText(line, width * 0.07, baseY + index * lineHeight);
  });

  ctx.font = `600 ${Math.max(9, width * 0.03)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = `${p.accent}`;
  ctx.fillText(`${subject.genre.toUpperCase()}`, width * 0.07, baseY + lines.length * lineHeight + height * 0.018);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`${subject.year}  ·  ★ ${subject.rating.toFixed(1)}`, width * 0.07, baseY + lines.length * lineHeight + height * 0.048);

  return canvas;
}
