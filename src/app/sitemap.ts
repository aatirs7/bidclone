import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/app-url";

/** robots.txt points here, so it has to exist. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/wall`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/rules`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
