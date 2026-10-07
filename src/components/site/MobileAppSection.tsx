import AnimatedHeading from "@/components/anim/AnimatedHeading";
import Reveal from "@/components/anim/Reveal";
import DownloadButton from "@/components/site/DownloadButton";
import PhoneStage from "@/components/site/PhoneStage";
import ReleasePanel from "@/components/site/ReleasePanel";
import { getRelease } from "@/lib/release";

const FEATURES = [
  {
    title: "Downloads that survive the tunnel",
    body: "Keep up to twelve titles per profile offline at the highest bitrate your storage can take.",
    path: "M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19.5h14",
  },
  {
    title: "Resume on any screen",
    body: "Start on the phone, finish on the TV. Playback hands off on the exact frame you left.",
    path: "M3.5 6.5h13v9h-13zM17 9.5h3.5v6H17zM8 19.5h8",
  },
  {
    title: "Family profiles with PINs",
    body: "A kids shelf with its own limits, its own downloads and its own lock.",
    path: "M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 7a7 7 0 0 1 14 0",
  },
  {
    title: "Atmos tuned for earbuds",
    body: "Spatial mixes rebalanced for phone speakers and buds, not just a living-room bar.",
    path: "M4 14v-4l8-5v14l-8-5Zm12-4a4 4 0 0 1 0 8",
  },
  {
    title: "Data saver for 4G",
    body: "Cap streaming at roughly 0.6 GB an hour on cellular without a visible quality cliff.",
    path: "M5 18V9m4.5 9V5m4.5 13v-7m4.5 7V3",
  },
];

const PLATFORMS = [
  { label: "Google Play", note: "In review" },
  { label: "App Store", note: "Coming soon" },
  { label: "Android TV", note: "Q3" },
  { label: "Web", note: "Live" },
];

function FeatureIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-cyan"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/**
 * AnimatedPrime is a mobile product, so the site has to show the app, not
 * describe it. The device stage renders the real catalogue inside real app
 * screens, and the download panel reports the actual signed build facts.
 */
export default async function MobileAppSection() {
  const release = await getRelease();

  return (
    <section id="app" className="relative py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12%] top-1/4 h-[34rem] w-[34rem] rounded-full bg-violet/14 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-5 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-3xl">
            <Reveal className="flex items-center gap-3" y={14} duration={0.8}>
              <span className="h-px w-10 bg-gradient-to-r from-violet to-cyan" aria-hidden="true" />
              <span className="eyebrow text-fog-500">Chapter 07 — In your pocket</span>
            </Reveal>
            <AnimatedHeading
              as="h2"
              text="The whole cinema, *in your pocket*"
              className="display-lg mt-5 text-fog-100"
            />
            <Reveal y={22} delay={0.12}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-fog-300/85 sm:text-[1.0625rem]">
                AnimatedPrime is built phone-first: downloads that hold up on a plane,
                a shelf that already knows what you were watching, and a player that
                hands off to the biggest screen in the house without losing your place.
              </p>
            </Reveal>
          </div>

          <Reveal y={20} delay={0.18} className="flex shrink-0 flex-col gap-3">
            <DownloadButton release={release} mode="download" size="lg" />
            <DownloadButton release={release} mode="details" variant="outline" size="md" />
          </Reveal>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
          <PhoneStage />

          <div>
            <ul className="flex flex-col gap-5">
              {FEATURES.map((feature, index) => (
                <Reveal
                  key={feature.title}
                  as="li"
                  y={22}
                  delay={index * 0.04}
                  className="flex items-start gap-4 border-b border-white/6 pb-5 last:border-0"
                >
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-violet/25 to-cyan/10">
                    <FeatureIcon path={feature.path} />
                  </span>
                  <span>
                    <span className="block font-display text-[1rem] font-bold tracking-[-0.02em] text-fog-100">
                      {feature.title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-fog-300/75">
                      {feature.body}
                    </span>
                  </span>
                </Reveal>
              ))}
            </ul>

            {/* release sheet — live facts, re-read on the client */}
            <Reveal y={24} className="mt-8">
              <ReleasePanel release={release} />
            </Reveal>
          </div>
        </div>

        {/* platform strip */}
        <div className="mt-14 grid grid-cols-2 gap-4 border-t border-white/8 pt-8 sm:grid-cols-4">
          {PLATFORMS.map((platform) => (
            <Reveal key={platform.label} y={18} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-fog-100">{platform.label}</span>
              <span className="text-[0.62rem] font-semibold tracking-[0.18em] text-fog-700 uppercase">
                {platform.note}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
