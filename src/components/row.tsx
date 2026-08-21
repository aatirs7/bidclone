"use client";

import Link from "next/link";

import type { BoardRow } from "@/lib/leaderboard";
import { costToPass, formatCents, formatCount } from "@/lib/money";
import { formatAgo } from "@/lib/time";
import { brandGradient } from "@/lib/brand";
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
  const cost = costToPass(row.totalCents);
  // The chasers immediately behind the seat get a little more room, so the
  // board tapers rather than stopping dead after the showcase.
  const near = position <= 3;

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
      className={`deal-in row-accent lift group relative mb-[10px] flex items-center gap-3 overflow-hidden rounded-xl border border-rule bg-panel transition-colors hover:border-ink/25 sm:gap-4 ${
        near ? "p-[14px] sm:p-[18px]" : "p-3 sm:p-4"
      } ${dethroned ? "row-dethroned" : ""}`}
    >
      <span className="num flex h-8 w-8 flex-none items-center justify-center rounded-full border border-rule text-[12px] font-semibold text-ink-faint sm:h-9 sm:w-9 sm:text-[13px]">
        {String(position).padStart(2, "0")}
      </span>

      <Mark row={row} />

      <div className="min-w-0 flex-1">
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
        {row.tagline ? (
          <p className="mt-[2px] line-clamp-2 text-[13px] leading-[1.45] text-ink-soft">
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
          <Money cents={row.totalCents} />
        </div>
        <button
          type="button"
          onClick={() => onTake(cost)}
          className="whitespace-nowrap rounded-full border border-rule px-3 py-[5px] text-[12px] font-medium text-ink-soft transition-all hover:border-ink hover:bg-ink hover:text-ground active:scale-[0.97]"
        >
          Take for {formatCents(cost)}
        </button>
      </div>
    </article>
  );
}

function Mark({ row }: { row: BoardRow }) {
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
