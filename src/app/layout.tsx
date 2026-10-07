import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { ExplorerProvider } from "@/components/providers/ExplorerProvider";
import { PlayerProvider } from "@/components/providers/PlayerProvider";
import { WatchlistProvider } from "@/components/providers/WatchlistProvider";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AnimatedPrime — Animation. Reimagined.",
  description:
    "AnimatedPrime is a premium home for animated movies: curated worlds, cinematic discovery and seamless 4K HDR streaming on every screen.",
  keywords: [
    "animated movies",
    "animation streaming",
    "premium streaming platform",
    "family movies",
    "AnimatedPrime",
  ],
  authors: [{ name: "AnimatedPrime" }],
  openGraph: {
    title: "AnimatedPrime — Animation. Reimagined.",
    description:
      "Your next animated adventure starts here. Discover and stream unforgettable animated worlds.",
    type: "website",
    siteName: "AnimatedPrime",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimatedPrime — Animation. Reimagined.",
    description: "Your next animated adventure starts here.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#030409",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <body className="relative antialiased">
        <ExplorerProvider>
          <WatchlistProvider>
            <PlayerProvider>
              <AppProvider>
                <main id="main">{children}</main>
              </AppProvider>
            </PlayerProvider>
          </WatchlistProvider>
        </ExplorerProvider>
      </body>
    </html>
  );
}
