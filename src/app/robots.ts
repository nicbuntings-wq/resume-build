// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = "https://cyme.ai";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
