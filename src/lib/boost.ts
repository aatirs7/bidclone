import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { clicks, entries } from "@/db/schema";

/**
 * House clicks applied to whoever currently holds the seat.
 *
 * Deliberate constraints:
 *  - Rows are tagged `boost_*` in visitor_hash, so real and house clicks can
 *    always be separated by a single query. Nothing here is irreversible.
 *  - Linear, not compounding. A percentage rate reaches millions inside two
 *    days and gets spotted against the visitor counter on the same page.
 *  - Off the render path. Triggered by the presence heartbeat rather than a
 *    cron, so there is no scheduler to keep alive and no cost when idle.
 *  - Killed instantly by setting BOOST_ENABLED to anything but "true".
 */
const MIN_PER_HOUR = 20;
const MAX_PER_HOUR = 100;
const INTERVAL_MS = 3_600_000;
const TAG = "boost_";

export function boostEnabled(): boolean {
  return process.env.BOOST_ENABLED === "true";
}

/**
 * Adds one hour's worth to the current leader if an hour has passed since the
 * last batch. Returns how many were added, or zero when nothing was due.
 */
export async function applyHourlyBoost(): Promise<number> {
  if (!boostEnabled()) return 0;

  // Whoever is actually holding the seat right now.
  const [leader] = await db
    .select({ id: entries.id })
    .from(entries)
    .where(and(eq(entries.status, "active"), isNotNull(entries.reignStartedAt)))
    .limit(1);
  if (!leader) return 0;

  // Last batch, from the tag rather than a separate table to track.
  const [last] = await db
    .select({ at: clicks.createdAt })
    .from(clicks)
    .where(sql`${clicks.visitorHash} like ${TAG + "%"}`)
    .orderBy(desc(clicks.createdAt))
    .limit(1);

  if (last && Date.now() - new Date(last.at).getTime() < INTERVAL_MS) return 0;

  const amount =
    MIN_PER_HOUR + Math.floor(Math.random() * (MAX_PER_HOUR - MIN_PER_HOUR + 1));

  const now = Date.now();
  const stamp = now.toString(36);
  await db
    .insert(clicks)
    .values(
      Array.from({ length: amount }, (_, i) => {
        // Spread across the hour just passed so the timestamps do not all
        // land on the same second.
        const when = new Date(now - Math.round((i * INTERVAL_MS) / amount));
        return {
          entryId: leader.id,
          visitorHash: `${TAG}${stamp}_${String(i).padStart(3, "0")}`.padEnd(
            32,
            "x",
          ),
          hourBucket: when.toISOString().slice(0, 13),
          createdAt: when,
        };
      }),
    )
    .onConflictDoNothing();

  // The counter is always recomputed from rows, never incremented, so it
  // cannot drift away from what the clicks table actually holds.
  await db
    .update(entries)
    .set({
      clickCount: sql`(select count(*)::int from ${clicks} where ${clicks.entryId} = ${leader.id})`,
    })
    .where(eq(entries.id, leader.id));

  return amount;
}

/** Real minus house, for when you need to know what actually happened. */
export async function organicClickCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(clicks)
    .where(
      sql`${clicks.visitorHash} not like ${TAG + "%"} and ${clicks.visitorHash} not like 'house%'`,
    );
  return row?.n ?? 0;
}

/** Removes every house click. The undo button. */
export async function clearBoosts(): Promise<number> {
  const removed = await db
    .delete(clicks)
    .where(sql`${clicks.visitorHash} like ${TAG + "%"}`)
    .returning({ id: clicks.id });

  await db.update(entries).set({
    clickCount: sql`(select count(*)::int from ${clicks} where ${clicks.entryId} = ${entries.id})`,
  });

  return removed.length;
}
