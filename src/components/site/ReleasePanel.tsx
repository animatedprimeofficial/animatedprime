"use client";

import DownloadButton from "@/components/site/DownloadButton";
import { useRelease } from "@/hooks/useRelease";
import type { AppRelease } from "@/lib/release";
import { cn } from "@/lib/utils";

/**
 * The release sheet.
 *
 * Version, size, channel and the changelog all come from the resolved build
 * rather than from copy, so the panel cannot contradict the artifact the button
 * actually hands over. It re-checks itself client-side, which is what lets a
 * freshly uploaded APK switch this from "awaiting review" to "available"
 * without a redeploy.
 */
export default function ReleasePanel({
  release: initial,
  className,
}: {
  release: AppRelease;
  className?: string;
}) {
  const { release, refreshing } = useRelease(initial);

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold tracking-[-0.03em] text-fog-100">
            v{release.version}
          </span>
          <span className="rounded-full border border-white/12 px-2.5 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] text-fog-500 uppercase">
            {release.channel}
          </span>
        </span>

        <span className="text-xs text-fog-500">
          {[
            release.sizeLabel,
            release.minAndroid,
            release.source === "local" ? "direct download" : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>

        <span className="flex items-center gap-2 text-xs text-fog-500">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              release.available ? "bg-mint" : "bg-amber",
              refreshing && "animate-pulse",
            )}
          />
          {release.available ? "Signed build available" : "Awaiting final review"}
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-2">
        {release.changelog.slice(0, 3).map((entry) => (
          <li
            key={entry}
            className="flex items-start gap-2.5 text-[0.8rem] leading-relaxed text-fog-300/80"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet" aria-hidden="true" />
            {entry}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DownloadButton release={release} mode="download" size="md" />
        <span className="text-[0.68rem] text-fog-700">
          {release.sha256
            ? "SHA-256 published in the release sheet"
            : "APK · no store account needed"}
        </span>
      </div>
    </div>
  );
}
