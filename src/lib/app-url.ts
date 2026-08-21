/**
 * The public origin. Kept free of any heavy imports so the root layout can use
 * it. On Vercel the domain is supplied by the platform, so there is no
 * chicken and egg between the first deploy and knowing the URL.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
