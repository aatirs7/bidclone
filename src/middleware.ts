import { NextResponse, type NextRequest } from "next/server";

// Deliberately not from lib/admin: that module pulls in node:crypto,
// which the edge runtime cannot load.
import { ADMIN_COOKIE } from "@/lib/admin-cookie";

export const config = { matcher: "/admin" };

/**
 * The admin key can arrive in the URL once. Middleware trades it for an
 * httpOnly cookie and strips it from the address bar, so the secret stops
 * appearing in history, referrers, and screenshots. A Server Component cannot
 * set a cookie, which is why this lives here.
 */
export function middleware(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.searchParams.delete("key");

  const res = NextResponse.redirect(url);
  // Validity is checked by the page and by the hide route. Setting it here only
  // moves the value out of the URL.
  res.cookies.set(ADMIN_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
