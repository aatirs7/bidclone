import { and, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { bids, clicks, entries, visits } from "@/db/schema";
import { costToPass, MIN_BID_CENTS } from "./money";

export type BoardRow = {
  id: string;
  url: string;
  displayName: string;
  tagline: string | null;
  faviconUrl: string | null;
  totalCents: number;
  clickCount: number;
  /** ISO string while this entry holds the seat, otherwise null. */
  reignStartedAt: string | null;
  longestReignSeconds: number;
};

export type Mover = {
  id: string;
  displayName: string;
  faviconUrl: string | null;
  clicksPerHour: number;
};

export type FeedItem = {
  id: string;
  entryId: string;
  displayName: string;
  faviconUrl: string | null;
  rank: number | null;
  totalCents: number;
  at: string;
  displacedName: string | null;
  displacedReignSeconds: number | null;
};

export type Reign = {
  id: string;
  displayName: string;
  faviconUrl: string | null;
  seconds: number;
};

export type Board = {
  rows: BoardRow[];
  movers: Mover[];
  feed: FeedItem[];
  reigns: Reign[];
  stats: {
    online: number;
    visitorsTotal: number;
    paidToDateCents: number;
    entryCount: number;
  };
  /** What it costs to take the seat right now. Drives the headline. */
  seatPriceCents: number;
};

/**
 * Per-instance TTL cache. On a spike an uncached sort on every request is what
 * takes the site down at the exact moment it matters, and every polling client
 * hits the same route every 10 seconds.
 */
function ttlCache<T>(ms: number, load: () => Promise<T>) {
  let value: T | undefined;
  let expires = 0;
  let inFlight: Promise<T> | undefined;

  return async (): Promise<T> => {
    if (value !== undefined && Date.now() < expires) return value;
    // Collapse the stampede: concurrent misses share one query.
    inFlight ??= load()
      .then((next) => {
        value = next;
        expires = Date.now() + ms;
        return next;
      })
      .finally(() => {
        inFlight = undefined;
      });
    return inFlight;
  };
}

const loadRows = ttlCache(5_000, async (): Promise<BoardRow[]> => {
  const rows = await db
    .select({
      id: entries.id,
      url: entries.url,
      displayName: entries.displayName,
      tagline: entries.tagline,
      faviconUrl: entries.faviconUrl,
      totalCents: entries.totalCents,
      clickCount: entries.clickCount,
      reignStartedAt: entries.reignStartedAt,
      longestReignSeconds: entries.longestReignSeconds,
    })
    .from(entries)
    .where(and(eq(entries.status, "active"), gt(entries.totalCents, 0)))
    // Ties break by earliest arrival: the incumbent keeps the seat.
    .orderBy(desc(entries.totalCents), sql`${entries.firstBidAt} asc`);

  return rows.map((r) => ({
    ...r,
    reignStartedAt: r.reignStartedAt?.toISOString() ?? null,
  }));
});

const loadMovers = ttlCache(60_000, async (): Promise<Mover[]> => {
  return db
    .select({
      id: entries.id,
      displayName: entries.displayName,
      faviconUrl: entries.faviconUrl,
      clicksPerHour: sql<number>`count(*)::int`,
    })
    .from(clicks)
    .innerJoin(entries, eq(entries.id, clicks.entryId))
    .where(
      and(
        eq(entries.status, "active"),
        sql`${clicks.createdAt} > now() - interval '1 hour'`,
      ),
    )
    .groupBy(entries.id, entries.displayName, entries.faviconUrl)
    .orderBy(sql`count(*) desc`)
    .limit(5);
});

const loadFeed = ttlCache(10_000, async (): Promise<FeedItem[]> => {
  const displaced = sql`(select d.display_name from ${entries} d where d.id = ${bids.tookSeatFrom})`;
  const rows = await db
    .select({
      id: bids.id,
      entryId: entries.id,
      displayName: entries.displayName,
      faviconUrl: entries.faviconUrl,
      rank: bids.rankAfter,
      totalCents: entries.totalCents,
      at: bids.createdAt,
      displacedName: sql<string | null>`${displaced}`,
      displacedReignSeconds: bids.displacedReignSeconds,
    })
    .from(bids)
    .innerJoin(entries, eq(entries.id, bids.entryId))
    .where(eq(entries.status, "active"))
    .orderBy(desc(bids.createdAt))
    .limit(6);

  return rows.map((r) => ({ ...r, at: r.at.toISOString() }));
});

const loadReigns = ttlCache(60_000, async (): Promise<Reign[]> => {
  return db
    .select({
      id: entries.id,
      displayName: entries.displayName,
      faviconUrl: entries.faviconUrl,
      seconds: entries.longestReignSeconds,
    })
    .from(entries)
    .where(
      and(eq(entries.status, "active"), gt(entries.longestReignSeconds, 0)),
    )
    .orderBy(desc(entries.longestReignSeconds))
    .limit(10);
});

const loadStats = ttlCache(30_000, async () => {
  const [row] = await db
    .select({
      // A visitor writes one row a minute while the tab is open.
      online: sql<number>`(select count(distinct ${visits.visitorHash})::int from ${visits} where ${visits.createdAt} > now() - interval '2 minutes')`,
      visitorsTotal: sql<number>`(select count(distinct ${visits.visitorHash})::int from ${visits})`,
      paidToDateCents: sql<number>`(select coalesce(sum(${bids.amountCents}), 0)::int from ${bids})`,
      entryCount: sql<number>`(select count(*)::int from ${entries} where ${entries.status} = 'active' and ${entries.totalCents} > 0)`,
    })
    .from(sql`(select 1) as _`);

  return (
    row ?? {
      online: 0,
      visitorsTotal: 0,
      paidToDateCents: 0,
      entryCount: 0,
    }
  );
});

export async function getBoard(): Promise<Board> {
  const [rows, movers, feed, reigns, stats] = await Promise.all([
    loadRows(),
    loadMovers(),
    loadFeed(),
    loadReigns(),
    loadStats(),
  ]);

  return {
    rows,
    movers,
    feed,
    reigns,
    stats,
    seatPriceCents: rows[0] ? costToPass(rows[0].totalCents) : MIN_BID_CENTS,
  };
}

const EMPTY: Board = {
  rows: [],
  movers: [],
  feed: [],
  reigns: [],
  stats: { online: 0, visitorsTotal: 0, paidToDateCents: 0, entryCount: 0 },
  seatPriceCents: MIN_BID_CENTS,
};

/** An empty board is a valid state, not an error. Never 500 the front page. */
export async function getBoardSafe(): Promise<Board> {
  try {
    return await getBoard();
  } catch (error) {
    console.error("[leaderboard] query failed", error);
    return EMPTY;
  }
}
