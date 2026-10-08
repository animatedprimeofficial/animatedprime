import AnimeSection from "@/components/site/AnimeSection";
import CTASection from "@/components/site/CTASection";
import ExperienceSection from "@/components/site/ExperienceSection";
import FeaturedMovies from "@/components/site/FeaturedMovies";
import Footer from "@/components/site/Footer";
import GenreSection from "@/components/site/GenreSection";
import HeroSection from "@/components/site/HeroSection";
import ImmersiveScene from "@/components/site/ImmersiveScene";
import MobileAppSection from "@/components/site/MobileAppSection";
import MovieExplorer from "@/components/site/MovieExplorer";
import TickerBand from "@/components/site/TickerBand";
import TrendingMovies from "@/components/site/TrendingMovies";
import { getRelease } from "@/lib/release";

export default async function Home() {
  // Resolved once per process and reused by the layout, so the closing CTA can
  // offer the real build instead of a link to nowhere.
  const release = await getRelease();

  return (
    <>
      <HeroSection />
      <TickerBand />
      <FeaturedMovies />
      <TrendingMovies />
      <AnimeSection />
      <GenreSection />
      <ImmersiveScene />
      <ExperienceSection />
      <MobileAppSection />
      <MovieExplorer />
      <CTASection release={release} />
      <Footer />
    </>
  );
}
