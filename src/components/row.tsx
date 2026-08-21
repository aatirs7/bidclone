"use client";

import Link from "next/link";

import type { BoardRow } from "@/lib/leaderboard";
import { costToPass, formatCents, formatCount } from "@/lib/money";
import { formatDuration } from "@/lib/time";
import { Money } from "./money";
import { ReignClock } from "./reign-clock";

/**
 * One grid, used by the header and every row, so the numbers land in true
 * columns and the board scans like a statement rather than a stack of cards.
 * Narrow screens drop cost per click and the held clock and keep rank, entry,
 * clicks and total.
 */
export const COLUMNS =
  "grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_5.5rem] items-center gap-x-3 md:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_4.5rem_6rem_6.5rem_auto] md:gap-x-4";

export function LedgerHead() {
  return (
    <div
      className={`${COLUMNS} border-b border-ink/15 px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint`}
    >
      <div>Rank</div>
      <div>Entry</div>
      <div className="text-right">Clicks</div>
      <div className="hidden text-right md:block">CPC</div>
      <div className="hidden text-right md:block">Held</div>
      <div className="text-right">Total</div>
      <div className="hidden md:block" />
    </div>
  );
}

function Favicon({ row, large }: { row: BoardRow; large: boolean }) {
  const box = large
    ? "h-8 w-8 rounded-[6px]"
    : "h-[22px] w-[22px] rounded-[4px]";
  if (!row.faviconUrl) return <div className={`${box} flex-none bg-rule`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={row.faviconUrl}
      alt=""
      loading="lazy"
      className={`${box} flex-none bg-rule object-cover`}
    />
  );
}

/** Total paid divided by clicks delivered. Published whether or not it flatters. */
function cpc(row: BoardRow): string {
  if (row.clickCount <= 0) return "-";
  return formatCents(Math.round(row.totalCents / row.clickCount));
}

export function LedgerRow({
  row,
  position,
  onTake,
  dethroned,
  animate,
}: {
  row: BoardRow;
  position: number;
  onTake: (cents: number) => void;
  dethroned: boolean;
  animate: boolean;
}) {
  const lead = position === 1;
  // Top three carry their tagline and a larger mark. Everything below is a
  // single tight line.
  const featured = position <= 3;
  const cost = costToPass(row.totalCents);

  return (
    <div
      className={`${COLUMNS} border-b border-rule px-1 transition-colors ${
        featured ? "py-3" : "py-[7px]"
      } ${lead ? "bg-gain-wash" : "hover:bg-panel"} ${
        dethroned ? "row-dethroned" : ""
      }`}
    >
      <div
        className={`num self-start pt-[2px] text-[13px] font-semibold ${
          lead ? "text-gain" : "text-ink-faint"
        }`}
      >
        {String(position).padStart(2, "0")}
      </div>

      <div className="flex min-w-0 items-start gap-[10px] self-start">
        <Favicon row={row} large={featured} />
        <div className="min-w-0">
          <a
            href={`/go/${row.id}`}
            rel="nofollow ugc noopener"
            target="_blank"
            className={`block truncate tracking-[-0.01em] hover:underline ${
              featured ? "text-[15px] font-semibold" : "text-sm font-medium"
            }`}
          >
            {row.displayName}
          </a>
          {featured && row.tagline ? (
            <p className="mt-[2px] line-clamp-2 hidden text-[13px] leading-[1.45] text-ink-soft md:block">
              {row.tagline}
            </p>
          ) : null}
          {lead && row.reignStartedAt ? (
            <div className="num mt-1 text-[12px] text-gain md:hidden">
              <ReignClock since={row.reignStartedAt} />
            </div>
          ) : null}
        </div>
      </div>

      <Link
        href={`/e/${row.id}`}
        className="num self-start pt-[2px] text-right text-[12.5px] text-ink-soft hover:text-ink hover:underline"
      >
        {formatCount(row.clickCount)}
      </Link>

      <div className="num hidden self-start pt-[2px] text-right text-[12.5px] text-ink-soft md:block">
        {cpc(row)}
      </div>

      <div className="num hidden self-start pt-[2px] text-right text-[12.5px] md:block">
        {row.reignStartedAt ? (
          <span className="text-gain">
            <ReignClock since={row.reignStartedAt} bare />
          </span>
        ) : row.longestReignSeconds > 0 ? (
          <span className="text-ink-faint">
            {formatDuration(row.longestReignSeconds)}
          </span>
        ) : (
          <span className="text-ink-faint">-</span>
        )}
      </div>

      <div
        className={`num self-start pt-[1px] text-right font-semibold tracking-[-0.02em] ${
          featured ? "text-[17px]" : "text-[14px]"
        } ${lead ? "text-gain" : ""}`}
      >
        <Money cents={row.totalCents} animate={animate && lead} />
      </div>

      <div className="hidden self-start md:block">
        <button
          type="button"
          onClick={() => onTake(cost)}
          className="whitespace-nowrap border-b border-dotted border-ink-faint text-[12.5px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {lead ? "Take the seat" : `Take #${position}`}, {formatCents(cost)}
        </button>
      </div>
    </div>
  );
}
