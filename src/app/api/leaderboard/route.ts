import { NextResponse } from "next/server";

import { getBoardSafe } from "@/lib/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Polled every 10s by the client. Cheap on purpose. */
export async function GET() {
  const board = await getBoardSafe();
  return NextResponse.json(board, {
    headers: {
      // Shields the database on a spike: the CDN answers most of the poll.
      "cache-control": "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
