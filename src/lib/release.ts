import "server-only";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export interface AppRelease {
  /** available: a real artifact (or external URL) exists */
  available: boolean;
  source: "local" | "external" | "none";
  version: string;
  channel: "stable" | "beta";
  fileName: string;
  /** where the button should send the browser */
  downloadUrl?: string;
  /** external links open in a new tab with the release page as the referrer */
  external: boolean;
  sizeBytes?: number;
  sizeLabel?: string;
  sha256?: string;
  releasedAt?: string;
  minAndroid: string;
  targetAndroid: string;
  changelog: string[];
  checkedAt: string;
}

const DOWNLOAD_DIR = path.join(process.cwd(), "public", "downloads");

const DEFAULTS = {
  version: process.env.ANDROID_APK_VERSION ?? "1.4.0",
  channel: (process.env.ANDROID_APK_CHANNEL as "stable" | "beta" | undefined) ?? "stable",
  minAndroid: process.env.ANDROID_MIN_ANDROID ?? "Android 9 (API 28)",
  targetAndroid: "Android 15 (API 35)",
  changelog: [
    "New: offline downloads for the whole family profile.",
    "New: continue-watching handoff between phone, tablet and TV.",
    "Faster cold start on mid-range devices.",
    "Fixed: subtitles drifting on long Dolby Atmos titles.",
  ],
};

interface ReleaseManifest {
  version?: string;
  channel?: "stable" | "beta";
  minAndroid?: string;
  changelog?: string[];
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

/** Streams the artifact so a large APK never has to sit in memory. */
function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

function versionFromFileName(fileName: string): string | undefined {
  const match = /v?(\d+\.\d+(?:\.\d+)?)/.exec(fileName);
  return match?.[1];
}

async function readManifest(): Promise<ReleaseManifest | null> {
  try {
    const raw = await readFile(path.join(DOWNLOAD_DIR, "release.json"), "utf8");
    return JSON.parse(raw) as ReleaseManifest;
  } catch {
    return null;
  }
}

/**
 * Resolves the Android build.
 *
 * Order of preference: a build dropped into `public/downloads` (so the size and
 * checksum in the UI are real, measured facts rather than marketing copy), then
 * an external release URL, then an explicit "not available yet" state that the
 * UI turns into a notify-me flow.
 */
async function resolveRelease(): Promise<AppRelease> {
  const checkedAt = new Date().toISOString();
  const manifest = await readManifest();
  const meta = {
    version: manifest?.version ?? DEFAULTS.version,
    channel: manifest?.channel ?? DEFAULTS.channel,
    minAndroid: manifest?.minAndroid ?? DEFAULTS.minAndroid,
    changelog: manifest?.changelog ?? DEFAULTS.changelog,
  };

  try {
    const entries = await readdir(DOWNLOAD_DIR);
    const apk = entries.filter((entry) => entry.toLowerCase().endsWith(".apk")).sort().pop();
    if (apk) {
      const filePath = path.join(DOWNLOAD_DIR, apk);
      const [stats, sha256] = await Promise.all([stat(filePath), hashFile(filePath)]);
      return {
        available: true,
        source: "local",
        version: versionFromFileName(apk) ?? meta.version,
        channel: meta.channel,
        fileName: apk,
        downloadUrl: `/downloads/${apk}`,
        external: false,
        sizeBytes: stats.size,
        sizeLabel: humanSize(stats.size),
        sha256,
        releasedAt: stats.mtime.toISOString(),
        minAndroid: meta.minAndroid,
        targetAndroid: DEFAULTS.targetAndroid,
        changelog: meta.changelog,
        checkedAt,
      };
    }
  } catch {
    /* no local build — fall through to the hosted release */
  }

  const externalUrl = process.env.ANDROID_APK_URL;
  if (externalUrl) {
    return {
      available: true,
      source: "external",
      version: meta.version,
      channel: meta.channel,
      fileName: `animatedprime-android-${meta.version}.apk`,
      downloadUrl: externalUrl,
      external: true,
      sizeLabel: process.env.ANDROID_APK_SIZE,
      sha256: process.env.ANDROID_APK_SHA256,
      releasedAt: process.env.ANDROID_APK_RELEASED_AT,
      minAndroid: meta.minAndroid,
      targetAndroid: DEFAULTS.targetAndroid,
      changelog: meta.changelog,
      checkedAt,
    };
  }

  return {
    available: false,
    source: "none",
    version: meta.version,
    channel: meta.channel,
    fileName: `animatedprime-android-${meta.version}.apk`,
    external: false,
    minAndroid: meta.minAndroid,
    targetAndroid: DEFAULTS.targetAndroid,
    changelog: meta.changelog,
    checkedAt,
  };
}

// Hashing a build is expensive, so resolve once per server process.
let cached: Promise<AppRelease> | null = null;

export function getRelease(): Promise<AppRelease> {
  if (!cached) cached = resolveRelease().catch(() => resolveRelease());
  return cached;
}

export function resetReleaseCache(): void {
  cached = null;
}
