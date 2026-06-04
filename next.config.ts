import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  async redirects() {
    const bareDomain = process.env.NEXT_PUBLIC_BARE_DOMAIN?.trim() || "aiwallpaperprompts.com";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.aiwallpaperprompts.com";
    if (!bareDomain || !siteUrl) {
      return [];
    }
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: bareDomain }],
        destination: `${siteUrl}/:path*`,
        permanent: true
      }
    ];
  }
};

export default nextConfig;
