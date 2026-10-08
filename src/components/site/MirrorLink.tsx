import { cn } from "@/lib/utils";
import type { AppRelease } from "@/lib/release";

type Mirror = NonNullable<AppRelease["mirror"]>;

function ExternalGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13.5 4.5h6v6M19.5 4.5 11 13M17.5 14v5.5h-13v-13H10" />
    </svg>
  );
}

/**
 * The second route to the build.
 *
 * The signed APK this site serves is a large, git-ignored artifact, so a deploy
 * that ships without it would otherwise strand everyone on the "awaiting
 * review" copy. The mirror — an upload page on a file host — keeps the app one
 * click away regardless, and it is labelled as a mirror so nobody mistakes it
 * for the checksummed download beside it.
 *
 * `solid` pairs with the dialog's primary button; `inline` sits in a line of
 * small print.
 */
export default function MirrorLink({
  mirror,
  variant = "solid",
  className,
}: {
  mirror: Mirror;
  variant?: "solid" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <a
        href={mirror.url}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="link"
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold tracking-wide text-fog-500 underline decoration-white/20 underline-offset-4 transition-colors hover:text-fog-100",
          className,
        )}
      >
        {mirror.label}
        <ExternalGlyph className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={mirror.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="link"
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2.5 rounded-full border border-white/16 bg-white/[0.03] px-7 py-4 text-sm font-semibold text-fog-100 transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.07]",
        className,
      )}
    >
      Download from {mirror.label}
      <ExternalGlyph />
    </a>
  );
}
