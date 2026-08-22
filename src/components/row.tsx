"use client";

import Link from "next/link";

import type { BoardRow } from "@/lib/leaderboard";
import {
  costToPassWith,
  formatCents,
  formatCount,
  isHidden,
} from "@/lib/money";
import { formatAgo } from "@/lib/time";
import { brandGradient } from "@/lib/brand";
import { PowerupBadges } from "./powerup-badges";
import { Money } from "./money";

/**
 * A leaderboard row, not a spreadsheet row. Rank, mark, name, what they do,
 * when they last moved, clicks, and the price. Cost per click and reign history
 * live on the entry page, where someone actually wants them.
 */
export function BoardEntry({
  row,
  position,
  index,
  onTake,
  dethroned,
}: {
  row: BoardRow;
  position: number;
  /** Position in the rendered list, used only to stagger the load. */
  index: number;
  onTake: (cents: number) => void;
  dethroned: boolean;
}) {
  const cost = costToPassWith(row.totalCents, row.activePowerups);
  const hidden = isHidden(row.activePowerups);

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
      // Fixed height, so a long name or a tall logo cannot make one row
      // taller than the next. The board has to scan as a column.
      className={`deal-in row-accent row-hover lift group relative mb-[10px] flex h-[84px] items-center gap-3 overflow-hidden rounded-xl border border-rule bg-panel px-3 sm:h-[88px] sm:gap-4 sm:px-[18px] ${
        dethroned ? "row-dethroned" : ""
      }`}
    >
      <span className="num flex h-8 w-8 flex-none items-center justify-center rounded-full border border-rule text-[12px] font-semibold text-ink-faint sm:h-9 sm:w-9 sm:text-[13px]">
        {String(position).padStart(2, "0")}
      </span>

      <Mark row={row} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] sm:text-[16px]">
            <a
              href={`/go/${row.id}`}
              rel="nofollow ugc noopener"
              target="_blank"
              className="hover:underline"
            >
              {row.displayName}
            </a>
          </h3>
          <PowerupBadges kinds={row.activePowerups} className="flex-none" />
        </div>
        {row.tagline ? (
          <p className="mt-[1px] truncate text-[12.5px] leading-[1.4] text-ink-soft sm:text-[13px]">
            {row.tagline}
          </p>
        ) : null}
        <div className="mt-[5px] flex items-center gap-2 text-[12px] text-ink-faint">
          {row.lastBidAt ? <span>{formatAgo(row.lastBidAt)}</span> : null}
          {row.lastBidAt ? <span aria-hidden="true">·</span> : null}
          <Link
            href={`/e/${row.id}`}
            className="num font-medium text-gain hover:underline"
          >
            {formatCount(row.clickCount)} clicks
          </Link>
        </div>
      </div>

      <div className="flex flex-none flex-col items-center gap-[6px]">
        <div className="num text-center text-[18px] font-semibold tracking-[-0.025em] sm:text-[20px]">
          {hidden ? (
            <span className="text-ink-faint" title="Hidden by Smoke Screen">
              $&bull;&bull;&bull;
            </span>
          ) : (
            <Money cents={row.totalCents} />
          )}
        </div>
        <button
          type="button"
          onClick={() => onTake(cost)}
          className="relative whitespace-nowrap rounded-full border border-rule px-3 py-[5px] text-[12px] font-medium text-ink-soft transition-all group-hover:border-ink/40 group-hover:text-ink hover:border-ink hover:bg-ink hover:text-ground active:scale-[0.97]"
        >
          Take for {formatCents(cost)}
        </button>
      </div>
    </article>
  );
}

function Mark({ row }: { row: BoardRow }) {
  // Fixed box for every entry, so a wide logo cannot widen the column.
  const box =
    "h-11 w-11 sm:h-12 sm:w-12 flex-none rounded-xl overflow-hidden ring-1 ring-ink/10";
  const mark = row.logoUrl ?? row.faviconUrl;
  if (mark) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mark}
        alt=""
        loading="lazy"
        className={`${box} bg-panel object-cover`}
      />
    );
  }
  // Deterministic gradient rather than a grey box, so every row reads as a
  // brand. The color on this page comes from the entries, never the chrome.
  return (
    <div
      className={`${box} flex items-center justify-center`}
      style={{ background: brandGradient(row.url) }}
    >
      <span className="text-[18px] font-semibold text-white/90">
        {row.displayName.replace(/^@/, "").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
