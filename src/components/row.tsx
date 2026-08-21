"use client";

import Link from "next/link";

import type { BoardRow } from "@/lib/leaderboard";
import { costToPass, formatCents, formatCount } from "@/lib/money";
import { formatDuration } from "@/lib/time";
import { Money } from "./money";
import { ReignClock } from "./reign-clock";

function Favicon({
  row,
  size,
}: {
  row: BoardRow;
  size: "large" | "small";
}) {
  const box = size === "large" ? "h-[38px] w-[38px] rounded-[9px]" : "h-[26px] w-[26px] rounded-[6px]";
  if (!row.faviconUrl) {
    return <div className={`${box} flex-none bg-rule`} />;
  }
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

function Rank({ position, lead }: { position: number; lead: boolean }) {
  return (
    <div
      className={`num w-[26px] flex-none pt-[3px] text-[13px] font-semibold sm:w-8 ${
        lead ? "text-gain" : "text-ink-faint"
      }`}
    >
      {String(position).padStart(2, "0")}
    </div>
  );
}

function TakeButton({
  row,
  position,
  onTake,
  compact,
}: {
  row: BoardRow;
  position: number;
  onTake: (cents: number) => void;
  compact?: boolean;
}) {
  const cost = costToPass(row.totalCents);
  return (
    <button
      type="button"
      onClick={() => onTake(cost)}
      className={`whitespace-nowrap rounded-[7px] border border-rule bg-transparent text-ink-soft transition-colors hover:border-ink hover:text-ink ${
        compact ? "hidden px-2 py-1 text-[12px] sm:block" : "px-[11px] py-[5px] text-[12.5px]"
      }`}
    >
      {position === 1
        ? `Take the seat, ${formatCents(cost)}`
        : `Take #${position} for ${formatCents(cost)}`}
    </button>
  );
}

export function FullRow({
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
  return (
    <article
      className={`relative mb-2 flex items-start gap-[14px] rounded-xl border p-[14px] sm:px-[18px] sm:py-4 ${
        lead ? "border-gain bg-gain-wash" : "border-rule bg-panel"
      } ${dethroned ? "row-dethroned" : ""}`}
    >
      <Rank position={position} lead={lead} />
      <Favicon row={row} size="large" />

      <div className="min-w-0 flex-1">
        <h3 className="mb-[3px] text-[15px] font-semibold tracking-[-0.01em]">
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
          <p className="mb-[7px] hidden text-[13.5px] leading-[1.45] text-ink-soft sm:block">
            {row.tagline}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1 text-[12.5px] text-ink-faint">
          <Link href={`/e/${row.id}`} className="num font-medium text-gain hover:underline">
            {formatCount(row.clickCount)} clicks
          </Link>
          {row.reignStartedAt ? (
            <ReignClock since={row.reignStartedAt} />
          ) : row.longestReignSeconds > 0 ? (
            <span className="num">
              reigned {formatDuration(row.longestReignSeconds)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-none flex-col items-end gap-2 pt-[2px]">
        <div
          className={`num text-[19px] font-semibold tracking-[-0.02em] ${
            lead ? "text-gain" : ""
          }`}
        >
          <Money cents={row.totalCents} animate={animate && lead} />
        </div>
        <TakeButton row={row} position={position} onTake={onTake} />
      </div>
    </article>
  );
}

export function CompactRow({
  row,
  position,
  onTake,
  dethroned,
}: {
  row: BoardRow;
  position: number;
  onTake: (cents: number) => void;
  dethroned: boolean;
}) {
  return (
    <article
      className={`relative mb-2 flex items-center gap-[14px] rounded-xl border border-rule bg-panel px-[14px] py-3 sm:px-[18px] ${
        dethroned ? "row-dethroned" : ""
      }`}
    >
      <Rank position={position} lead={false} />
      <Favicon row={row} size="small" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium tracking-[-0.01em]">
          <a
            href={`/go/${row.id}`}
            rel="nofollow ugc noopener"
            target="_blank"
            className="hover:underline"
          >
            {row.displayName}
          </a>
        </h3>
      </div>
      <Link
        href={`/e/${row.id}`}
        className="num hidden flex-none text-[12.5px] font-medium text-gain hover:underline sm:block"
      >
        {formatCount(row.clickCount)} clicks
      </Link>
      <TakeButton row={row} position={position} onTake={onTake} compact />
      <div className="num flex-none text-[15px] font-semibold tracking-[-0.02em]">
        {formatCents(row.totalCents)}
      </div>
    </article>
  );
}
