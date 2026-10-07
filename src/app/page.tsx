import CTASection from "@/components/site/CTASection";
import ExperienceSection from "@/components/site/ExperienceSection";
import FeaturedMovies from "@/components/site/FeaturedMovies";
import Footer from "@/components/site/Footer";
import GenreSection from "@/components/site/GenreSection";
import HeroSection from "@/components/site/HeroSection";
import ImmersiveScene from "@/components/site/ImmersiveScene";
import MovieExplorer from "@/components/site/MovieExplorer";
import TickerBand from "@/components/site/TickerBand";
import TrendingMovies from "@/components/site/TrendingMovies";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TickerBand />
      <FeaturedMovies />
      <TrendingMovies />
      <GenreSection />
      <ImmersiveScene />
      <ExperienceSection />
      <MovieExplorer />
      <CTASection />
      <Footer />
    </>
  );
}
