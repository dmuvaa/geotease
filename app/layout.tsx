import type { Metadata } from "next";
import { Fraunces, Source_Code_Pro, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const sourceCode = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://geotease.com"),
  title: {
    default: "GeoTease",
    template: "%s · GeoTease",
  },
  description:
    "A global geography guessing game. Read the clue, explore the map, drop a pin, and see how close you were.",
  openGraph: {
    title: "GeoTease",
    description: "Think you know where it is? Clues. Maps. One location.",
    url: "https://geotease.com",
    siteName: "GeoTease",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoTease",
    description: "Think you know where it is?",
  },
};

const themeBoot = `try{var t=localStorage.getItem("geotease-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${sourceCode.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <Script id="geotease-theme" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        {children}
      </body>
    </html>
  );
}
