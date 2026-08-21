import { createHash } from "node:crypto";
import { after } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { entries } from "@/db/schema";
import { appUrl } from "@/lib/stripe";
import { toHref } from "@/lib/normalize-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// X, Slack, Discord and iMessage all prefetch links. On a viral post that is
// thousands of phantom clicks, and an obviously inflated count destroys the
// credibility of the only number people are paying for.
const BOTS =
  /bot|crawler|spider|preview|fetch|curl|wget|slack|discord|whatsapp|telegram|facebookexternalhit|twitterbot|headless|python-requests|go-http/i;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const home = `${appUrl()}/`;

  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.redirect(home, 302);

  let entry:
    | { id: string; url: string; status: "active" | "hidden" | "refunded" }
    | undefined;
  try {
    [entry] = await db
      .select({ id: entries.id, url: entries.url, status: entries.status })
      .from(entries)
      .where(eq(entries.id, id))
      .limit(1);
  } catch (error) {
    console.error("[go] lookup failed", id, error);
    return Response.redirect(home, 302);
  }

  if (!entry || entry.status !== "active") return Response.redirect(home, 302);

  const ua = req.headers.get("user-agent") ?? "";
  const countable = ua.length > 20 && !BOTS.test(ua);
  const target = entry.id;

  // Redirect first, count after. The visitor never waits on a write.
  after(async () => {
    if (!countable) return;
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      const visitor = createHash("sha256")
        .update(ip + ua + (process.env.CLICK_SALT ?? ""))
        .digest("hex")
        .slice(0, 32);
      const bucket = new Date().toISOString().slice(0, 13);

      // One statement: the counter only moves when the insert actually
      // inserted, so a refresher cannot inflate it.
      await db.execute(sql`
        with ins as (
          insert into ${sql.identifier("clicks")} (entry_id, visitor_hash, hour_bucket)
          values (${target}::uuid, ${visitor}, ${bucket})
          on conflict do nothing
          returning entry_id
        )
        update ${entries}
           set click_count = ${entries.clickCount} + 1
         where ${entries.id} = (select entry_id from ins)
      `);
    } catch (error) {
      console.error("[go] click count failed", target, error);
    }
  });

  return Response.redirect(toHref(entry.url), 302);
}
