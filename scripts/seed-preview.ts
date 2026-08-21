/**
 * Fills the DEV database with plausible sample data so the board can be judged
 * visually before any real money exists.
 *
 * This is for design work only. It refuses to run against the production
 * database, because a screenshot of an inflated board is the kind of thing that
 * gets picked apart publicly, and the whole positioning of this site is that
 * its numbers are the honest ones.
 *
 *   npx tsx scripts/seed-preview.ts          fill
 *   npx tsx scripts/seed-preview.ts --clear  empty it again
 */
// Next reads .env.local automatically; a bare script does not.
import { config } from "dotenv";
config({ path: ".env.local" });
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

import * as schema from "../src/db/schema";
import { bids, clicks, entries } from "../src/db/schema";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL ?? "";
if (!url.includes("cheapseat_dev")) {
  console.error(
    "Refusing to run. DATABASE_URL must point at cheapseat_dev, got:",
    url.split("/").pop()?.split("?")[0],
  );
  process.exit(1);
}

const db = drizzle(new Pool({ connectionString: url }), { schema });

const SAMPLE = [
  ["linear.app", "Linear", "Purpose built for product teams. Plan, build, and ship software with a tool that stays out of the way.", 841200, 6677],
  ["cal.com", "Cal.com", "Scheduling infrastructure you can host yourself. Connect your calendar and let people book real availability.", 839000, 4820],
  ["x.com/levelsio", "@levelsio", "Twelve startups in twelve months, still shipping. Follow along for the numbers nobody else publishes.", 524000, 3914],
  ["resend.com", "Resend", "Email for developers. A simple API, real deliverability, and templates that render the same everywhere.", 211000, 2201],
  ["railway.app", "Railway", "Deploy without touching infrastructure. Push code and it runs.", 145500, 1884],
  ["plausible.io", "Plausible Analytics", "Privacy friendly analytics without cookies. Lightweight, open source, and legible on one screen.", 34000, 1102],
  ["tally.so", "Tally", "Forms that behave like documents. Free for almost everything.", 22000, 640],
  ["raycast.com", "Raycast", "A launcher that replaces half your menu bar. Extensions for everything else.", 12500, 388],
  ["posthog.com", "PostHog", "Product analytics, session replay, and feature flags in one place.", 4500, 214],
  ["bun.sh", "Bun", "A fast JavaScript runtime, bundler, and package manager in a single binary.", 100, 37],
] as const;

async function clear() {
  await db.execute(sql`truncate ${clicks}, ${bids}, ${entries} cascade`);
  console.log("cleared");
}

async function seed() {
  await clear();
  const now = Date.now();

  for (const [index, [url, name, tagline, total, clickCount]] of SAMPLE.entries()) {
    // Older entries first, so the tie break and the reign history read sensibly.
    const firstBid = new Date(now - (SAMPLE.length - index) * 3_600_000);
    const [entry] = await db
      .insert(entries)
      .values({
        url,
        displayName: name,
        tagline,
        faviconUrl: `https://www.google.com/s2/favicons?sz=64&domain=${url.split("/")[0]}`,
        totalCents: total,
        clickCount,
        firstBidAt: firstBid,
        lastBidAt: new Date(now - index * 900_000),
        // The leader holds a live clock. Everyone else carries a past reign.
        reignStartedAt: index === 0 ? new Date(now - 15_120_000) : null,
        longestReignSeconds: index === 0 ? 0 : Math.max(0, 40_000 - index * 4_200),
        timesAtOne: index < 4 ? 4 - index : 0,
      })
      .returning({ id: entries.id });

    // A couple of bids each, summing to the total, so the audit trail is
    // consistent with what the board shows.
    const first = Math.round(total * 0.6);
    await db.insert(bids).values([
      {
        entryId: entry.id,
        amountCents: first,
        stripeSessionId: `seed_${index}_a`,
        rankAfter: index + 1,
        createdAt: firstBid,
      },
      {
        entryId: entry.id,
        amountCents: total - first,
        stripeSessionId: `seed_${index}_b`,
        rankAfter: index + 1,
        tookSeatFrom: null,
        createdAt: new Date(now - index * 900_000),
      },
    ]);

    // Recent clicks so the "moving now" panel has something to rank.
    const recent = Math.min(40, Math.ceil(clickCount / 60));
    if (recent > 0) {
      await db.insert(clicks).values(
        Array.from({ length: recent }, (_, i) => ({
          entryId: entry.id,
          // Zero padding would make seed0_1 and seed0_10 collide on the
          // dedupe index, which is the index doing its job.
          visitorHash: `seed${index}_${String(i).padStart(3, "0")}`.padEnd(32, "x"),
          hourBucket: new Date(now).toISOString().slice(0, 13),
          createdAt: new Date(now - i * 60_000),
        })),
      );
    }
  }

  console.log(`seeded ${SAMPLE.length} entries into cheapseat_dev`);
}

async function main() {
  await (process.argv.includes("--clear") ? clear() : seed());
  process.exit(0);
}

void main();
