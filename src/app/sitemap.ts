// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cyme.ai";
  return [
    { url: `${base}/`,              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/pricing`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`,          lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    // Add any other key routes you serve publicly (docs, features, etc.)
  ];
}
