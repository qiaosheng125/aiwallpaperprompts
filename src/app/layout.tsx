import type { Metadata } from "next";
import { AnalyticsScripts } from "./analytics";
import { siteName, siteUrl } from "./site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Wallpaper Prompt Gallery - 4K AI Wallpaper Prompts",
    template: "%s | AI Wallpaper Prompt Gallery"
  },
  description:
    "Browse curated 4K AI wallpaper prompts with copy-ready prompt text, negative prompts, style tags, color tags, and desktop wallpaper categories.",
  openGraph: {
    title: "AI Wallpaper Prompt Gallery",
    description:
      "Curated 4K AI wallpaper prompts with copy-ready prompt text and searchable style categories.",
    url: siteUrl,
    siteName,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI Wallpaper Prompt Gallery preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Wallpaper Prompt Gallery",
    description:
      "Browse 4K AI wallpaper prompts for cinematic anime, starlight, sakura, fireworks, fantasy, and desktop wallpapers.",
    images: ["/opengraph-image"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
