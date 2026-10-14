#!/usr/bin/env node
/**
 * README screenshots.
 *
 * Drives a local Chrome over the DevTools protocol so the README images are
 * reproducible instead of hand-taken: no Playwright/Puppeteer dependency, just
 * whatever Chromium is already on the machine (the Playwright cache, a Chrome
 * install, or `CHROME_PATH`).
 *
 * The site is animation-heavy, so the harness waits for the real behaviour
 * rather than a fixed timer: the opening curtain has to finish and hand over to
 * the hero, sections are reached with genuine wheel events (the desktop tier
 * hands scrolling to ScrollSmoother, which ignores jumps in `scrollTop`), and
 * each shot waits for its reveal to land before the frame is captured.
 *
 *   node scripts/capture-screenshots.mjs                       # → docs/screenshots
 *   node scripts/capture-screenshots.mjs --base http://localhost:3000
 *   node scripts/capture-screenshots.mjs --only hero,trending
 *   node scripts/capture-screenshots.mjs --tier lite           # force a tier
 *
 * Serve a production build first (`npm run build && npx next start -p 3111`) so
 * the captures show the site without the dev overlay.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

/* ------------------------------------------------------------------ config */

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : true;
};

const BASE = String(flag("base", "http://localhost:3111")).replace(/\/$/, "");
const OUT = path.resolve(String(flag("out", "docs/screenshots")));
const ONLY = flag("only", null);
const TIER = flag("tier", null);
const VERBOSE = Boolean(flag("verbose", false));
const PORT = Number(flag("port", 9333));

/**
 * Desktop is captured at 1440 CSS px — comfortably inside the site's widest
 * breakpoints, so nothing is squashed into a tablet layout. The 1.2 device
 * pixel ratio lands the raster at 1728 px, which is exactly what a retina
 * reader needs for the ~880 px column a README renders in — sharper is bytes
 * nobody can see.
 */
const DESKTOP = { width: 1440, height: 960, dpr: 1.2, mobile: false };
const PHONE = { width: 390, height: 844, dpr: 2.2, mobile: true, touch: true };

/**
 * JPEG, not PNG. The design is photographic — poster art, film grain, layered
 * glows — which is exactly what PNG is worst at: the same hero frame is 1.4 MB
 * as a PNG and under 400 KB at quality 88, and nothing in a README survives a
 * smaller rectangle than that. `--lossless` switches to PNG for the rare case
 * a flat graphic has to stay pixel-exact.
 */
const LOSSLESS = Boolean(flag("lossless", false));
const FORMAT = LOSSLESS ? "png" : "jpeg";
const QUALITY = Number(flag("quality", 88));
const EXT = LOSSLESS ? "png" : "jpg";

/** Wait until `selector` is gone from the DOM. */
const gone = (selector) =>
  `new Promise((done) => {
     if (!document.querySelector(${JSON.stringify(selector)})) return done(true);
     const iv = setInterval(() => {
       if (!document.querySelector(${JSON.stringify(selector)})) { clearInterval(iv); done(true); }
     }, 100);
   })`;

const SHOTS = [
  /*
   * No shot of the opening curtain. Every honest frame of it is a black
   * rectangle with a logo on it — the interesting moment is the *lift*, by
   * which point the mark has already faded and the frame is a slow iris onto
   * the hero. It is described in the README rather than illustrated with an
   * image that reads as a broken screenshot.
   */
  { name: "hero", label: "Hero", viewport: DESKTOP, top: true, expect: { section: "top" } },
  {
    name: "featured",
    label: "Chapter 01 — Featured",
    viewport: DESKTOP,
    target: "#featured",
    offset: 70,
    expect: { section: "featured" },
  },
  {
    name: "trending",
    label: "Chapter 02 — Trending",
    viewport: DESKTOP,
    target: "#trending",
    offset: 70,
    expect: { section: "trending" },
  },
  {
    name: "anime",
    label: "Chapter 03 — Anime",
    viewport: DESKTOP,
    target: "#anime",
    offset: 70,
    expect: { section: "anime" },
  },
  {
    name: "genres",
    label: "Chapter 04 — Genres",
    viewport: DESKTOP,
    target: "#genres",
    offset: 70,
    expect: { section: "genres" },
  },
  {
    name: "immersive",
    label: "Chapter 05 — The world",
    viewport: DESKTOP,
    target: "#immersive",
    offset: 40,
    expect: { section: "immersive" },
  },
  {
    name: "experience",
    label: "Chapter 06 — Why AnimatedPrime",
    viewport: DESKTOP,
    target: "#experience",
    offset: 70,
    expect: { section: "experience" },
  },
  {
    name: "app",
    label: "Chapter 07 — In your pocket",
    viewport: DESKTOP,
    target: "#app",
    offset: 70,
    expect: { section: "app" },
  },
  {
    name: "explorer",
    label: "Chapter 08 — Explore",
    viewport: DESKTOP,
    target: "#explore",
    offset: 70,
    expect: { section: "explore" },
  },
  {
    name: "cta",
    label: "Chapter 09 — Start",
    viewport: DESKTOP,
    target: "#start",
    offset: 70,
    expect: { section: "start" },
  },
  { name: "footer", label: "Footer", viewport: DESKTOP, bottom: true, expect: { tag: "footer" } },
  { name: "hero-phone", label: "Phone — hero", viewport: PHONE, top: true, expect: { section: "top" } },
  {
    name: "trending-phone",
    label: "Phone — trending",
    viewport: PHONE,
    target: "#trending",
    offset: 60,
    expect: { section: "trending" },
  },
  { name: "app-phone", label: "Phone — the app", viewport: PHONE, target: "#app", offset: 60, expect: { section: "app" } },
];

/* ------------------------------------------------------------- chrome hunt */

async function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  // The Playwright cache is where a machine with no Chrome install keeps one —
  // newest revision first, arm64 before x64.
  const cache = path.join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) {
    const revisions = (await readdir(cache))
      .filter((entry) => entry.startsWith("chromium-"))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const revision of revisions) {
      for (const flavour of ["chrome-mac-arm64", "chrome-mac", "chrome-linux64", "chrome-linux"]) {
        candidates.push(
          path.join(
            cache,
            revision,
            flavour,
            "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
          ),
          path.join(cache, revision, flavour, "chrome-linux64/chrome"),
        );
      }
    }
  }

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("No Chrome found. Set CHROME_PATH=/path/to/chrome and try again.");
  }
  return found;
}

/* -------------------------------------------------------------- cdp client */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  const events = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error(`CDP socket failed: ${wsUrl}`)), { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const waiters = events.get(message.method);
    if (waiters?.length) {
      events.set(message.method, []);
      for (const waiter of waiters) waiter(message.params);
    }
  });

  return {
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error(`CDP timed out: ${method}`));
          }
        }, 45_000);
      });
    },
    once(method) {
      return new Promise((resolve) => {
        const waiters = events.get(method) ?? [];
        waiters.push(resolve);
        events.set(method, waiters);
      });
    },
    close: () => socket.close(),
  };
}

/* ------------------------------------------------------------------ helpers */

async function openPage() {
  const response = await fetch(`http://127.0.0.1:${PORT}/json/new?url=about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Could not open a tab: ${response.status}`);
  const target = await response.json();
  const session = await connect(target.webSocketDebuggerUrl);
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  return session;
}

const evaluate = async (session, expression, awaitPromise = false) => {
  const result = await session.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed");
  }
  return result.result.value;
};

/** Reads the document's real scroll offset, whatever is driving it. */
const scrollY = (session) => evaluate(session, "window.scrollY");

/**
 * Scrolls with genuine wheel events and closes the gap by measurement.
 *
 * The desktop tier gives scrolling to ScrollSmoother, which owns the scroll
 * position and smooths every input — so this nudges repeatedly and re-measures
 * until the target element really sits where it should, rather than trusting a
 * single jump. Events land in the left gutter, far from any card that would
 * light up a hover treatment in the capture.
 */
async function scrollToY(session, getTop, { tolerance = 3, rounds = 90 } = {}) {
  for (let round = 0; round < rounds; round += 1) {
    const top = await evaluate(session, getTop);
    if (top === null || Number.isNaN(top)) break;
    if (Math.abs(top) <= tolerance) return true;
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: 6,
      y: 400,
      deltaX: 0,
      deltaY: Math.max(-1400, Math.min(1400, top)),
    });
    await sleep(140);
  }
  return false;
}

/**
 * What is actually framed, read from the composited page: which section owns the
 * upper middle of the viewport, and what it says. A capture that silently
 * screenshots the wrong chapter (or a blank one) is worse than no capture, so
 * every shot asserts on this after the fact.
 */
const framing = `(() => {
  const squash = (value) =>
    value
      .split(String.fromCharCode(10)).join(" ")
      .split(String.fromCharCode(13)).join(" ")
      .split(String.fromCharCode(9)).join(" ")
      .trim();
  const probe = document.elementFromPoint(innerWidth / 2, innerHeight * 0.34);
  const section = probe?.closest("section");
  const curtain = document.querySelector("div.grain.fixed");
  return {
    section: section?.id ?? null,
    tag: probe?.closest("footer") ? "footer" : null,
    curtain: !!curtain,
    curtainText: squash(curtain?.innerText ?? "").slice(0, 70),
    text: squash(probe?.textContent ?? "").slice(0, 70),
  };
})()`;

/** One-line digest of what the frame contains, for the run log. */
const headline = (frame) =>
  String(frame.curtainText || frame.text)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 44);

const waitForElement = (selector) =>
  `new Promise((done) => {
     const found = () => document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect().height > 0;
     if (found()) return done(true);
     const iv = setInterval(() => { if (found()) { clearInterval(iv); done(true); } }, 100);
     setTimeout(() => { clearInterval(iv); done(false); }, 15000);
   })`;

/* --------------------------------------------------------------------- run */

const chromePath = await findChrome();
await mkdir(OUT, { recursive: true });

const profile = path.join(homedir(), "Library/Caches/freebuff-readme-chrome");
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--window-size=1440,960",
    "about:blank",
  ],
  { stdio: "ignore", detached: false },
);

let closing = false;
const shutdown = () => {
  if (closing) return;
  closing = true;
  chrome.kill("SIGTERM");
};
process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

// Wait for the debugging endpoint rather than guessing at a startup delay.
const deadline = Date.now() + 20_000;
let version = null;
while (Date.now() < deadline) {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (response.ok) {
      version = await response.json();
      break;
    }
  } catch {
    /* not up yet */
  }
  await sleep(200);
}
if (!version) throw new Error(`Chrome never opened a DevTools endpoint on :${PORT}`);
console.log(`chrome ${version.Browser}`);

const wanted = ONLY ? String(ONLY).split(",").map((name) => name.trim()) : null;
const shots = SHOTS.filter((shot) => !wanted || wanted.includes(shot.name));

const results = [];
let failed = 0;
for (const shot of shots) {
  const session = await openPage();
  const view = shot.viewport;

  // A forced tier has to be in place before the first script runs, or the
  // curtain and the canvases have already sized themselves.
  if (TIER) {
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `try { localStorage.setItem("animatedprime:perf", ${JSON.stringify(TIER)}); } catch {}`,
    });
  }

  await session.send("Emulation.setDeviceMetricsOverride", {
    width: view.width,
    height: view.height,
    deviceScaleFactor: view.dpr,
    mobile: Boolean(view.mobile),
  });
  if (view.touch) await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  /*
   * Wait on the *new* document, not on `readyState` — read straight after
   * `Page.navigate` that still answers for the outgoing about:blank page, which
   * is always "complete", and the harness happily screenshots a blank tab while
   * the curtain is still down.
   */
  const loaded = session.once("Page.loadEventFired");
  await session.send("Page.navigate", { url: `${BASE}/` });
  await Promise.race([loaded, sleep(15_000)]);

  // Mounted and interactive: React has published its tier and the hero exists.
  const mounted = await evaluate(
    session,
    `new Promise((done) => {
       const ready = () => document.documentElement.dataset.perf !== undefined && document.querySelector("#top");
       if (ready()) return done(true);
       const iv = setInterval(() => { if (ready()) { clearInterval(iv); done(true); } }, 50);
       setTimeout(() => { clearInterval(iv); done(false); }, 15000);
     })`,
    true,
  );
  if (!mounted) throw new Error(`${shot.name}: the app never mounted`);

  // Curtain up, then let the hero's entrance land.
  await evaluate(session, gone("div.grain.fixed"), true);
  await sleep(shot.settle ?? 2200);

  if (shot.target) await evaluate(session, waitForElement(shot.target), true);

  if (shot.top) {
    await scrollToY(session, "window.scrollY");
  } else if (shot.bottom) {
    await scrollToY(session, "document.documentElement.scrollHeight - window.innerHeight - window.scrollY", {
      tolerance: 2,
      rounds: 200,
    });
    await sleep(900);
  } else if (shot.target) {
    const offset = shot.offset ?? 60;
    await scrollToY(
      session,
      `document.querySelector(${JSON.stringify(shot.target)}).getBoundingClientRect().top - ${offset}`,
    );
    // Reveals are staggered inside sections; give the last one time to land.
    await sleep(shot.settle ?? 1500);
    await scrollToY(
      session,
      `document.querySelector(${JSON.stringify(shot.target)}).getBoundingClientRect().top - ${offset}`,
      { tolerance: 2 },
    );
  }

  // Let any scrub-linked parallax settle at its final resting value.
  await sleep(650);

  // --- did we frame what we said we would? --------------------------------
  const frame = await evaluate(session, framing);
  const want = shot.expect ?? {};
  const framed =
    (!want.section || frame.section === want.section) &&
    (!want.tag || frame.tag === want.tag) &&
    (!want.curtain || frame.curtain);

  const tier = await evaluate(session, "document.documentElement.dataset.perf ?? '?'");
  const webgl = await evaluate(
    session,
    `(() => {
       const all = document.querySelectorAll("canvas");
       const c = all[0];
       if (all.length > 1) return all.length + " canvases";
       if (!c) return "none";
       const gl = c.getContext("webgl2") ?? c.getContext("webgl");
       if (!gl) return "no-context";
       const dbg = gl.getExtension("WEBGL_debug_renderer_info");
       return dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 40) : "webgl";
     })()`,
  );

  const capture = await session.send("Page.captureScreenshot", {
    format: FORMAT,
    ...(LOSSLESS ? {} : { quality: QUALITY }),
  });

  /*
   * Read the bytes back and measure them. The framing probe proves the right
   * section was on screen, but not that anything was *painted* in it — a
   * compositor that never composited, a surface that raced the capture, or a
   * stalled renderer all produce a plausible-looking PNG. Spread, colour and
   * edge density catch that a size gate cannot.
   */
  const stats = await evaluate(
    session,
    `new Promise((done) => {
       const img = new Image();
       img.onload = () => {
         const canvas = document.createElement("canvas");
         canvas.width = img.naturalWidth;
         canvas.height = img.naturalHeight;
         const ctx = canvas.getContext("2d", { willReadFrequently: true });
         ctx.drawImage(img, 0, 0);
         const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
         let sum = 0, sumSq = 0, colour = 0, edges = 0, pairs = 0;
         for (let y = 0; y < height; y += 3) {
           let prev = null;
           for (let x = 0; x < width; x += 3) {
             const i = (y * width + x) * 4;
             const r = data[i], g = data[i + 1], b = data[i + 2];
             const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
             sum += luma;
             sumSq += luma * luma;
             if (Math.max(r, g, b) - Math.min(r, g, b) > 18) colour += 1;
             if (prev !== null) {
               pairs += 1;
               if (Math.abs(luma - prev) > 45) edges += 1;
             }
             prev = luma;
           }
         }
         const n = Math.ceil(height / 3) * Math.ceil(width / 3);
         const mean = sum / n;
         done({
           w: width,
           h: height,
           mean: +mean.toFixed(1),
           sd: +Math.sqrt(Math.max(0, sumSq / n - mean * mean)).toFixed(1),
           colour: +(colour / n).toFixed(3),
           edges: +(edges / pairs).toFixed(4),
         });
       };
       img.onerror = () => done(null);
       img.src = "data:image/${EXT};base64," + ${JSON.stringify(capture.data)};
     })`,
    true,
  );

  const file = path.join(OUT, `${shot.name}.${EXT}`);
  await writeFile(file, Buffer.from(capture.data, "base64"));
  const { size } = await stat(file);
  results.push({ name: shot.name, size, tier, webgl, framed, frame, stats });
  if (!framed) {
    failed += 1;
    console.log(`  ${shot.name.padEnd(16)} MISFRAMED — wanted ${JSON.stringify(want)}, got ${JSON.stringify(frame)}`);
  } else if (!stats) {
    failed += 1;
    console.log(`  ${shot.name.padEnd(16)} UNREADABLE — the captured bytes did not decode`);
  } else if (stats.sd < 6 || stats.edges < 0.004) {
    failed += 1;
    console.log(`  ${shot.name.padEnd(16)} BLANK — ${JSON.stringify(stats)}`);
  } else {
    console.log(
      `  ${shot.name.padEnd(16)} ${String(Math.round(size / 1024)).padStart(4)} KB  ${stats.w}x${stats.h}  sd=${String(stats.sd).padStart(5)} colour=${String(stats.colour).padStart(5)} edges=${String(stats.edges).padStart(7)}  ${headline(frame)}`,
    );
  }
  if (VERBOSE) {
    const state = await evaluate(
      session,
      `(() => {
         const centre = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
         return {
           scrollY: Math.round(window.scrollY),
           centre: centre ? centre.tagName.toLowerCase() + "." + String(centre.className).slice(0, 40) : null,
           textAtCentre: centre ? (centre.textContent ?? "").trim().slice(0, 60) : null,
           smoothContent: !!document.querySelector("#smooth-content"),
         };
       })()`,
    );
    console.log(`    ${JSON.stringify(state)}`);
  }

  session.close();
}

const total = results.reduce((sum, result) => sum + result.size, 0);
console.log(
  `\n${results.length} shots → ${path.relative(process.cwd(), OUT)}  (${(total / 1024 / 1024).toFixed(1)} MB)`,
);
if (failed) {
  console.error(`${failed} shot(s) need attention`);
  process.exitCode = 1;
}
shutdown();
