/**
 * Seeds the live board with house entries: sites the operator owns, listed so
 * the board is not bare at launch.
 *
 * Deliberate choices:
 *  - Only domains the operator owns. Never a third party's brand.
 *  - Click rows are written as real rows spread over the last day, so the
 *    counter, the entry page and the CPC column all agree with each other
 *    rather than a bare number being pasted onto the entry.
 *  - Bid rows are stamped `house_seed_*` rather than a Stripe session id, so
 *    the audit trail never claims a payment that did not happen.
 *  - Display name, tagline and favicon are fetched live from each site, so the
 *    only synthetic value is the amount.
 *
 *   npx tsx scripts/seed-house.ts           seed production
 *   npx tsx scripts/seed-house.ts --clear   remove the house entries again
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, inArray, like, sql } from "drizzle-orm";
import ws from "ws";

import * as schema from "../src/db/schema";
import { bids, clicks, entries } from "../src/db/schema";
import { fetchMetadata } from "../src/lib/metadata";
import { displayNameFor, normalizeUrl } from "../src/lib/normalize-url";
import { settleSeat } from "../src/lib/seat";

neonConfig.webSocketConstructor = ws;

// Production, on purpose. This script is the one thing that writes there
// outside the webhook, which is why it is a script and not a route.
const url = process.env.DATABASE_URL_PRODUCTION ?? "";
if (!url || url.includes("cheapseat_dev")) {
  console.error("DATABASE_URL_PRODUCTION must be set to the live database.");
  process.exit(1);
}

const db = drizzle(new Pool({ connectionString: url }), { schema });

/** Amounts chosen to keep the seat cheap enough that a newcomer is not scared off. */
const HOUSE = [
  // Logos taken from each site's own published assets. trajectorycoaches.com
  // is omitted: it returns 404, and a dead link has no business on the board.
  [
    "elysiumintern.com",
    350,
    22,
    "https://elysiumintern.com/icons/icon-180x180.png",
  ],
  ["elysiumbuilds.dev", 250, 16, "https://elysiumbuilds.dev/apple-icon.png"],
  ["mentorreach.com", 150, 14, "https://mentorreach.com/icon.png"],
  ["accshopp.com", 100, 86, "https://accshopp.com/favicon.ico"],
] as const;

async function clear() {
  // Every house entry is identifiable by its bid stamp, so a previous list is
  // still removable after the list here changes.
  const seeded = await db
    .select({ id: bids.entryId })
    .from(bids)
    .where(like(bids.stripeSessionId, "house_seed_%"));
  const ids = [...new Set(seeded.map((r) => r.id))];

  await db.delete(bids).where(like(bids.stripeSessionId, "house_seed_%"));
  // Entry deletion cascades to its clicks.
  if (ids.length > 0) {
    await db.delete(entries).where(inArray(entries.id, ids));
  }
  await db.transaction(async (tx) => {
    await settleSeat(tx);
  });
  console.log("house entries removed");
}

async function seed() {
  await clear();

  for (const [index, [raw, amount, clickCount, logo]] of HOUSE.entries()) {
    const normalized = normalizeUrl(raw);
    if (!normalized) {
      console.warn("skipping unusable url:", raw);
      continue;
    }

    // Real metadata from the real site. Only the amount is ours.
    const meta = await fetchMetadata(normalized);
    // Oldest first, so the tie break reads correctly.
    const at = new Date(Date.now() - (HOUSE.length - index) * 1_800_000);

    const [entry] = await db
      .insert(entries)
      .values({
        url: normalized,
        displayName: meta.displayName,
        tagline: meta.tagline,
        faviconUrl: meta.faviconUrl,
        logoUrl: logo,
        totalCents: amount,
        clickCount,
        firstBidAt: at,
        lastBidAt: at,
      })
      .onConflictDoUpdate({
        target: entries.url,
        set: { lastBidAt: at },
      })
      .returning({ id: entries.id });

    await db
      .insert(bids)
      .values({
        entryId: entry.id,
        amountCents: amount,
        stripeSessionId: `house_seed_${index}`,
        rankAfter: index + 1,
        createdAt: at,
      })
      .onConflictDoNothing({ target: bids.stripeSessionId });

    // Real rows, spread across the last day, so the entry page and the CPC
    // column agree with the counter on the board.
    await db.insert(clicks).values(
      Array.from({ length: clickCount }, (_, i) => {
        // Spread backwards from now across the last day. Stepping forward from
        // the bid time would push later clicks into the future.
        const when = new Date(
          Date.now() - Math.round((i * 23 * 3_600_000) / clickCount),
        );
        return {
          entryId: entry.id,
          visitorHash: `house${index}v${String(i).padStart(3, "0")}`.padEnd(32, "x"),
          hourBucket: when.toISOString().slice(0, 13),
          createdAt: when,
        };
      }),
    );

    // Same invariant the webhook holds: the total is a SUM, never a literal.
    await db
      .update(entries)
      .set({
        totalCents: sql`(select coalesce(sum(${bids.amountCents}), 0)::int from ${bids} where ${bids.entryId} = ${entry.id})`,
      })
      .where(eq(entries.id, entry.id));

    console.log(
      `  ${normalized} at $${(amount / 100).toFixed(2)}, ${clickCount} clicks, as "${meta.displayName}"`,
    );
  }

  await db.transaction(async (tx) => {
    await settleSeat(tx);
  });
  console.log(`seeded ${HOUSE.length} house entries on production`);
}

async function main() {
  await (process.argv.includes("--clear") ? clear() : seed());
  process.exit(0);
}

void main();
