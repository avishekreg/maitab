import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { maitabFaviconDataUri } from "@/lib/branding/favicon";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
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
    statusBarStyle: "black-translucent",
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
  themeColor: "#08090C",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-[100dvh] bg-nightlife-bg antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
