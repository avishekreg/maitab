import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
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
  title: "mAITab — Zero-Wait Nightlife & Tab OS",
  description:
    "Zero-hardware nightlife OS for prepaid tabs, gate hospitality, KDS, and social gaming. Part of the mAI ecosystem.",
  applicationName: "mAITab",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "mAITab",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "mAITab — Zero-Wait Nightlife & Tab OS",
    description:
      "Prepaid bar tabs, gate hospitality, KDS, AV takeovers, and social gaming — mAI ecosystem.",
    siteName: "mAITab",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${displayWide.variable} ${sans.variable}`}>
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased tracking-normal">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
