import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { bids, clicks, entries } from "@/db/schema";
import { Footer, Masthead } from "@/components/site";
import { ReignClock } from "@/components/reign-clock";
import { formatCents, formatCount } from "@/lib/money";
import { formatDuration } from "@/lib/time";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const [entry] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);

  if (!entry || entry.status !== "active") return null;

  const [counts] = await db
    .select({
      clicks24h: sql<number>`count(*) filter (where ${clicks.createdAt} > now() - interval '24 hours')::int`,
    })
    .from(clicks)
    .where(eq(clicks.entryId, id));

  const [bidCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bids)
    .where(eq(bids.entryId, id));

  const [ahead] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        gt(entries.totalCents, 0),
        sql`(${entries.totalCents} > ${entry.totalCents}
             or (${entries.totalCents} = ${entry.totalCents}
                 and ${entries.firstBidAt} < ${entry.firstBidAt ?? new Date()}))`,
      ),
    );

  return {
    entry,
    clicks24h: counts?.clicks24h ?? 0,
    bidCount: bidCount?.n ?? 0,
    rank: (ahead?.n ?? 0) + 1,
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const data = await load(id).catch(() => null);
  if (!data) return { title: "Entry" };
  return {
    title: `${data.entry.displayName} on cheapseat.lol`,
    description: `Rank #${data.rank}. ${formatCents(data.entry.totalCents)} paid, ${formatCount(data.entry.clickCount)} clicks.`,
  };
}

export default async function EntryPage({ params }: Params) {
  const { id } = await params;
  const data = await load(id).catch(() => null);
  if (!data) notFound();

  const { entry, clicks24h, bidCount, rank } = data;

  // Total paid divided by clicks delivered. Sometimes an unflattering number.
  // Publishing it anyway is the entire credibility play.
  const cpc = entry.clickCount > 0 ? entry.totalCents / entry.clickCount : null;

  return (
    <>
      <Masthead />
      <main className="mx-auto max-w-[680px] px-5 py-12">
        <Link
          href="/#board"
          className="text-[13px] text-ink-soft hover:text-ink"
        >
          Back to the board
        </Link>

        <div className="mt-5 flex items-start gap-4">
          {entry.faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.faviconUrl}
              alt=""
              className="h-12 w-12 flex-none rounded-[10px] bg-rule object-cover"
            />
          ) : (
            <div className="h-12 w-12 flex-none rounded-[10px] bg-rule" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">
              {entry.displayName}
            </h1>
            <a
              href={`/go/${entry.id}`}
              rel="nofollow ugc noopener"
              target="_blank"
              className="num text-[13px] text-ink-soft hover:text-ink hover:underline"
            >
              {entry.url}
            </a>
            {entry.tagline ? (
              <p className="mt-2 text-sm text-ink-soft">{entry.tagline}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-[14px] sm:grid-cols-3">
          <Stat label="Rank" value={`#${rank}`} />
          <Stat
            label="Total paid"
            value={formatCents(entry.totalCents)}
            gain
          />
          <Stat label="Bids placed" value={formatCount(bidCount)} />
          <Stat label="Clicks" value={formatCount(entry.clickCount)} gain />
          <Stat label="Clicks, last 24h" value={formatCount(clicks24h)} />
          <Stat
            label="Cost per click"
            value={cpc === null ? "No clicks yet" : formatCents(Math.round(cpc))}
          />
        </div>

        <div className="mt-[14px] grid grid-cols-2 gap-[14px] sm:grid-cols-3">
          <Stat
            label={entry.reignStartedAt ? "Holding the seat" : "Longest reign"}
            value={
              entry.reignStartedAt ? (
                <ReignClock since={entry.reignStartedAt.toISOString()} />
              ) : entry.longestReignSeconds > 0 ? (
                formatDuration(entry.longestReignSeconds)
              ) : (
                "Never held it"
              )
            }
          />
          <Stat label="Times at #1" value={formatCount(entry.timesAtOne)} />
          <Stat
            label="First bid"
            value={
              entry.firstBidAt
                ? entry.firstBidAt.toISOString().slice(0, 10)
                : "Not yet"
            }
          />
        </div>

        <p className="mt-8 text-[13px] leading-[1.6] text-ink-faint">
          Clicks are counted through our own redirect, with link previews and
          bots filtered out and one click counted per person per hour. Cost per
          click is total paid divided by total clicks. We publish it whether or
          not it flatters the buyer.
        </p>
      </main>
      <Footer />
    </>
  );
}

function Stat({
  label,
  value,
  gain,
}: {
  label: string;
  value: React.ReactNode;
  gain?: boolean;
}) {
  return (
    <div className="rounded-xl border border-rule bg-panel px-4 py-3">
      <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </div>
      <div
        className={`num text-[17px] font-semibold tracking-[-0.02em] ${
          gain ? "text-gain" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
