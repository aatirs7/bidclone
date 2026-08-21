import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/app-url";

/**
 * The counted redirect is disallowed: it exists to attribute a human click,
 * and crawlers walking it would both inflate nothing useful and waste writes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/go/", "/admin", "/api/"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
