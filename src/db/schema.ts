import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const entryStatus = pgEnum("entry_status", [
  "active",
  "hidden",
  "refunded",
]);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Normalized identity. See lib/normalize-url.ts. Never a raw user string. */
    url: text("url").notNull(),
    displayName: text("display_name").notNull(),
    tagline: text("tagline"),
    faviconUrl: text("favicon_url"),
    /** Supplied by the bidder at checkout. Takes precedence over the favicon. */
    logoUrl: text("logo_url"),
    /** Only ever written by the Stripe webhook, always as a recomputed sum of bids. */
    totalCents: integer("total_cents").notNull().default(0),
    clickCount: integer("click_count").notNull().default(0),
    firstBidAt: timestamp("first_bid_at", { withTimezone: true }),
    lastBidAt: timestamp("last_bid_at", { withTimezone: true }),

    // ── The reign mechanic ────────────────────────────────────────────────
    // A total is a number you paid once. A reign is something being taken from
    // you while you watch. Set only when this entry holds the seat.
    reignStartedAt: timestamp("reign_started_at", { withTimezone: true }),
    longestReignSeconds: integer("longest_reign_seconds").notNull().default(0),
    timesAtOne: integer("times_at_one").notNull().default(0),

    status: entryStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("entries_url_key").on(t.url),
    // Serves the board sort and the tie-break in one scan.
    index("entries_rank_idx").on(t.totalCents.desc(), t.firstBidAt.asc()),
    index("entries_reign_idx").on(t.longestReignSeconds.desc()),
  ],
);

export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    /** Idempotency key. A replayed webhook conflicts here and is dropped. */
    stripeSessionId: text("stripe_session_id").notNull(),

    // Snapshotted so the activity feed reports what was true at the time
    // rather than recomputing a rank that has since moved.
    rankAfter: integer("rank_after"),
    /** Set when this bid took the seat. The entry it was taken from. */
    tookSeatFrom: uuid("took_seat_from"),
    /** How long the displaced leader had held it. */
    displacedReignSeconds: integer("displaced_reign_seconds"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("bids_stripe_session_id_key").on(t.stripeSessionId),
    index("bids_entry_idx").on(t.entryId),
    index("bids_created_idx").on(t.createdAt.desc()),
  ],
);

export const clicks = pgTable(
  "clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    /** sha256(ip + ua + CLICK_SALT), truncated. Not reversible to an IP. */
    visitorHash: text("visitor_hash").notNull(),
    /** ISO hour, e.g. 2026-08-21T14. The dedupe window. */
    hourBucket: text("hour_bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One visitor, one entry, one hour, one click. The index does the deduping.
    uniqueIndex("clicks_dedupe").on(t.entryId, t.visitorHash, t.hourBucket),
    index("clicks_created_idx").on(t.createdAt.desc()),
    index("clicks_entry_idx").on(t.entryId),
  ],
);

/**
 * Presence, for the strip under the masthead. Our own numbers, in our own
 * database, so we can render them publicly and stand behind them.
 */
export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorHash: text("visitor_hash").notNull(),
    /** ISO minute. One row per visitor per minute, so "online" is derivable. */
    minuteBucket: text("minute_bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("visits_dedupe").on(t.visitorHash, t.minuteBucket),
    index("visits_created_idx").on(t.createdAt.desc()),
  ],
);

export type Entry = typeof entries.$inferSelect;
export type Bid = typeof bids.$inferSelect;
