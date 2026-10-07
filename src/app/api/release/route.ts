import { NextResponse } from "next/server";
import { getRelease, resetReleaseCache } from "@/lib/release";

export const dynamic = "force-dynamic";

/**
 * Release facts for the Android build. The download dialog calls this when the
 * user asks to re-check, so the copy is never a hard-coded lie copied into the
 * marketing page.
 */
export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (refresh) resetReleaseCache();

  const release = await getRelease();

  return NextResponse.json(release, {
    headers: { "cache-control": "no-store" },
  });
}
