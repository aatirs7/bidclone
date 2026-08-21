import { timingSafeEqual } from "node:crypto";

export { ADMIN_COOKIE } from "./admin-cookie";

/** Constant time, so the secret cannot be recovered a character at a time. */
export function isAdmin(candidate: string | undefined | null): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 8 || !candidate) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
