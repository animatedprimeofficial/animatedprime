import { QUALITY_BADGES } from "@/lib/movies";

const EXTRA = ["New adventures every Friday", "Family profiles", "Original scores", "Skip-free streaming"];

/**
 * The projector room ticker. Pure CSS marquee (duplicated track, translated
 * -50%) so it costs nothing and never fights the scroll system.
 */
export default function TickerBand() {
  const items = [...QUALITY_BADGES, ...EXTRA];

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-y border-white/8 bg-white/[0.015] py-5 mask-fade-x"
    >
      <div className="flex w-max animate-marquee gap-10 pr-10 will-change-transform">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10">
            {items.map((item) => (
              <span key={`${copy}-${item}`} className="flex items-center gap-10">
                <span className="text-[0.7rem] font-semibold tracking-[0.32em] whitespace-nowrap text-fog-500 uppercase">
                  {item}
                </span>
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 shrink-0 text-violet" fill="currentColor">
                  <path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
