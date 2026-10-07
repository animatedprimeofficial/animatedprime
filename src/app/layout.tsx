import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { CatalogProvider } from "@/components/providers/CatalogProvider";
import { ExplorerProvider } from "@/components/providers/ExplorerProvider";
import { PlayerProvider } from "@/components/providers/PlayerProvider";
import { WatchlistProvider } from "@/components/providers/WatchlistProvider";
import { getCatalog } from "@/lib/catalog";
import { getRelease } from "@/lib/release";

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
    "AnimatedPrime is a premium home for animated films and anime: curated worlds, cinematic discovery and seamless 4K HDR streaming on every screen.",
  keywords: [
    "animated movies",
    "anime streaming",
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
    icon: [
      { url: "/icon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/logo.png", type: "image/png", sizes: "466x466" },
    ],
    apple: [{ url: "/icon-180.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#030409",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Live catalogue + release facts are resolved on the server so the first
  // paint already carries real titles, posters and build information.
  const [catalog, release] = await Promise.all([getCatalog(), getRelease()]);

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <body className="relative antialiased">
        <CatalogProvider catalog={catalog}>
          <ExplorerProvider>
            <WatchlistProvider>
              <PlayerProvider>
                <AppProvider release={release}>
                  <main id="main">{children}</main>
                </AppProvider>
              </PlayerProvider>
            </WatchlistProvider>
          </ExplorerProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
