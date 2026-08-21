import { and, asc, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";

import * as schema from "@/db/schema";
import { entries } from "@/db/schema";

type Tx = Parameters<
  Parameters<NeonDatabase<typeof schema>["transaction"]>[0]
>[0];

export type SeatChange = {
  changed: boolean;
  previousLeaderId: string | null;
  newLeaderId: string | null;
  displacedReignSeconds: number | null;
};

/**
 * Reconciles who holds the seat with who *should* hold it, and closes out the
 * outgoing reign. Called inside the same transaction that moves a total, and
 * again when an entry is hidden, so the seat can never be held by a row that no
 * longer qualifies. Never on a cron: the clock has to be correct the instant
 * the board changes.
 */
export async function settleSeat(tx: Tx): Promise<SeatChange> {
  // Invariant: at most one row has a live reign.
  const [incumbent] = await tx
    .select({ id: entries.id, since: entries.reignStartedAt })
    .from(entries)
    .where(isNotNull(entries.reignStartedAt))
    .limit(1);

  const [actual] = await tx
    .select({ id: entries.id })
    .from(entries)
    .where(and(eq(entries.status, "active"), gt(entries.totalCents, 0)))
    // Ties go to the incumbent: earliest arrival at that total keeps the seat.
    .orderBy(desc(entries.totalCents), asc(entries.firstBidAt))
    .limit(1);

  const previousLeaderId = incumbent?.id ?? null;
  const newLeaderId = actual?.id ?? null;

  if (previousLeaderId === newLeaderId) {
    return {
      changed: false,
      previousLeaderId,
      newLeaderId,
      displacedReignSeconds: null,
    };
  }

  let displacedReignSeconds: number | null = null;

  if (incumbent) {
    displacedReignSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(incumbent.since!).getTime()) / 1000),
    );
    await tx
      .update(entries)
      .set({
        reignStartedAt: null,
        // Accumulated, per section 3 of the spec: total time this entry has
        // held the seat across every stint. A single stint is recorded on the
        // bid that ended it, which is what the launch posts quote.
        longestReignSeconds: sql`${entries.longestReignSeconds} + ${displacedReignSeconds}`,
      })
      .where(eq(entries.id, incumbent.id));
  }

  if (newLeaderId) {
    await tx
      .update(entries)
      .set({
        reignStartedAt: new Date(),
        timesAtOne: sql`${entries.timesAtOne} + 1`,
      })
      .where(eq(entries.id, newLeaderId));
  }

  return {
    changed: true,
    previousLeaderId,
    newLeaderId,
    displacedReignSeconds,
  };
}

/** 1-based position on the active board. Snapshotted onto the bid. */
export async function rankOf(tx: Tx, entryId: string): Promise<number | null> {
  const [me] = await tx
    .select({ total: entries.totalCents, first: entries.firstBidAt })
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);
  if (!me) return null;

  // Ahead of me: a bigger total, or the same total reached earlier.
  const [ahead] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        sql`(${entries.totalCents} > ${me.total}
             or (${entries.totalCents} = ${me.total}
                 and ${entries.firstBidAt} < ${me.first ?? new Date()}))`,
      ),
    );
  return (ahead?.n ?? 0) + 1;
}
