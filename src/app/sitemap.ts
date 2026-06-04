import type { MetadataRoute } from "next";
import { siteUrl } from "./site";
import { allTags, galleryItems, slugifyTag } from "@/data/gallery";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    }
  ];
  const wallpapers: MetadataRoute.Sitemap = galleryItems.map((item) => ({
    url: `${siteUrl}/wallpapers/${item.slug}`,
    lastModified: new Date(item.createdAt),
    changeFrequency: "monthly",
    priority: 0.7
  }));
  const categories: MetadataRoute.Sitemap = allTags.map((tag) => ({
    url: `${siteUrl}/categories/${slugifyTag(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6
  }));
  return [...staticPages, ...wallpapers, ...categories];
}
