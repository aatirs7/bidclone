/**
 * Identity on dethrone is the normalized URL, so this function decides who is
 * who. Two people bidding on the same site must collide into one entry,
 * otherwise they fragment their own totals by accident.
 *
 *   https://www.Foo.com/?ref=x  ->  foo.com
 *   FOO.com/                    ->  foo.com
 *   @jack                       ->  x.com/jack
 *
 * Returns null for anything unusable. Pure, so it is trivially testable.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // An @handle is an alternate identity form for the same person.
  if (raw.startsWith("@")) {
    const handle = raw.slice(1).trim().toLowerCase();
    if (!/^[a-z0-9_]{1,30}$/.test(handle)) return null;
    return `x.com/${handle}`;
  }

  // Any scheme at all, with or without the slashes. Without this check,
  // "mailto:a@b.com" gets https:// prepended and parses as the host b.com.
  const scheme = raw.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme && scheme !== "http" && scheme !== "https") return null;

  const withProtocol = scheme ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  // Credentials in the authority are a phishing shape, never a real identity.
  if (parsed.username || parsed.password) return null;

  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  // A hostname with no dot is not a public site (localhost, intranet names).
  if (!host.includes(".") || host.endsWith(".")) return null;
  // Bare IPs are almost always abuse, and they have no metadata worth fetching.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;

  // Query params and fragments are tracking noise, never identity.
  let path = parsed.pathname.toLowerCase();
  while (path.endsWith("/")) path = path.slice(0, -1);

  return host + path;
}

/** The clickable form of a stored identity. Storage drops the protocol; links need it. */
export function toHref(normalized: string): string {
  return `https://${normalized}`;
}
