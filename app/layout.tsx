import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { maitabFaviconDataUri } from "@/lib/branding/favicon";
import "./globals.css";

/** Display — ultra-wide geometric titles (hero DNA: Syne + Space Grotesk) */
const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800"],
});

const displayWide = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-wide",
  weight: ["500", "600", "700"],
});

/** Body — high-legibility standard-width sans for all UI copy */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "mAITab — Smart Bar Tab",
  description:
    "Zero-hardware nightlife OS for prepaid tabs, gate hospitality, KDS, and social gaming. Part of the mAI ecosystem.",
  applicationName: "mAITab",
  icons: {
    icon: [{ url: maitabFaviconDataUri(64), type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "mAITab",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "mAITab — Smart Bar Tab",
    description:
      "Prepaid bar tabs, gate hospitality, KDS, AV takeovers, and social gaming — mAI ecosystem.",
    siteName: "mAITab",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${displayWide.variable} ${sans.variable}`}>
      <body className="min-h-[100dvh] bg-zinc-950 font-sans text-zinc-100 antialiased tracking-normal">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
