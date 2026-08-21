import type { Metadata } from "next";
import { Caveat, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { appUrl } from "@/lib/app-url";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// One handwritten face, used only for margin notes. The interface stays
// straight faced; the annotations are the aside.
const hand = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: "cheapseat.lol",
  description:
    "The top seat is up for grabs and it is cheap. Bids stack, clicks are public, and the seat has a clock on it. New seats start at $1.",
  openGraph: {
    title: "cheapseat.lol",
    description:
      "Take the top seat from whoever is sitting in it. New seats start at $1, bids stack, and the clock starts the moment you land.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${hand.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applied before first paint so the wrong theme never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cheapseat-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
