import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";

import { after } from "next/server";

import { db } from "@/db";
import { applyHourlyBoost } from "@/lib/boost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Presence heartbeat. One row per visitor per minute, deduped by a unique
 * index, which is what makes "reading this now" a real number we can publish
 * rather than a decoration.
 */
export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (ua.length < 20) return new Response(null, { status: 204 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const visitor = createHash("sha256")
      .update(ip + ua + (process.env.CLICK_SALT ?? ""))
      .digest("hex")
      .slice(0, 32);
    const bucket = new Date().toISOString().slice(0, 16);

    await db.execute(sql`
      insert into ${sql.identifier("visits")} (visitor_hash, minute_bucket)
      values (${visitor}, ${bucket})
      on conflict do nothing
    `);
  } catch (error) {
    console.error("[pulse] failed", error);
  }

  // House clicks on the current leader, at most once an hour. After the
  // response, so presence never waits on it.
  after(async () => {
    try {
      const added = await applyHourlyBoost();
      if (added > 0) console.log("[boost] added", added, "to the leader");
    } catch (error) {
      console.error("[boost] failed", error);
    }
  });

  return new Response(null, { status: 204 });
}
