import { toHref } from "./normalize-url";

export type FetchedMetadata = {
  displayName: string;
  tagline: string | null;
  faviconUrl: string | null;
};

const TIMEOUT_MS = 3_000;
const MAX_BYTES = 100_000; // og tags live in <head>; we never need more than this.
const UA =
  "Mozilla/5.0 (compatible; dethrone.lol/1.0; +https://dethrone.lol)";

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, property: string): string | null {
  // Attribute order varies wildly in the wild, so match either arrangement.
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decode(m[1]);
  }
  return null;
}

function icon(html: string, base: URL): string | null {
  const m = html.match(
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
  );
  if (!m?.[1]) return null;
  try {
    return new URL(decode(m[1]), base).toString();
  } catch {
    return null;
  }
}

/**
 * Runs inside the webhook, never on the client and never in the checkout path.
 * Everything here is best effort: a site that is slow, hostile, or offline
 * still gets an entry, it just gets the bare domain as its name.
 */
export async function fetchMetadata(
  normalizedUrl: string,
): Promise<FetchedMetadata> {
  const domain = normalizedUrl.split("/")[0];
  const fallback: FetchedMetadata = {
    displayName: domain,
    tagline: null,
    faviconUrl: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
  };

  try {
    const res = await fetch(toHref(normalizedUrl), {
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok || !res.body) return fallback;

    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return fallback;

    // Read only the head-ish prefix, then abandon the rest of the stream.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    await reader.cancel().catch(() => {});
    const html = new TextDecoder().decode(
      chunks.reduce<Uint8Array>((acc, c) => {
        const next = new Uint8Array(acc.length + c.length);
        next.set(acc);
        next.set(c, acc.length);
        return next;
      }, new Uint8Array()),
    );

    const title =
      meta(html, "og:site_name") ??
      meta(html, "og:title") ??
      decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const description =
      meta(html, "og:description") ?? meta(html, "description");

    return {
      displayName: title ? title.slice(0, 60) : domain,
      tagline: description ? description.slice(0, 90) : null,
      faviconUrl: icon(html, new URL(res.url)) ?? fallback.faviconUrl,
    };
  } catch {
    return fallback;
  }
}
