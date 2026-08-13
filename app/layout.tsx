import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { maitabFaviconDataUri } from "@/lib/branding/favicon";
import "./globals.css";

/** Display — titles & section headings only */
const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
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
  themeColor: "#faf9f5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased tracking-normal">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
