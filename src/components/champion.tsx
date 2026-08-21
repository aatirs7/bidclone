"use client";

import Link from "next/link";

import type { BoardRow } from "@/lib/leaderboard";
import { costToPass, formatCents, formatCount } from "@/lib/money";
import { brandGradient } from "@/lib/brand";
import { Money } from "./money";
import { ReignClock } from "./reign-clock";

/**
 * The seat holder, at the size someone paying four figures deserves. This is
 * the first thing on the page and the thing that gets screenshotted. Everything
 * below it is the ledger explaining how they got here.
 */
export function Champion({
  row,
  onTake,
  animate,
}: {
  row: BoardRow;
  onTake: (cents: number) => void;
  animate: boolean;
}) {
  const cost = costToPass(row.totalCents);
  const cpc =
    row.clickCount > 0
      ? formatCents(Math.round(row.totalCents / row.clickCount))
      : null;

  return (
    <section className="seat-glow relative overflow-hidden rounded-2xl border border-gain/30 bg-gradient-to-br from-gain-wash via-panel to-panel lift">
      <span aria-hidden="true" className="seat-sheen" />
      {/* A wash of the entry's own color. The chrome stays disciplined and the
          brand supplies the only real color on the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.13] blur-2xl"
        style={{ background: brandGradient(row.url) }}
      />

      <div className="relative flex flex-col items-center gap-4 p-5 text-center sm:gap-6 sm:p-6 md:flex-row md:items-center md:gap-7 md:text-left">
        <BrandMark row={row} />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-center gap-[10px] md:justify-start">
            <span className="num flex h-7 items-center rounded-full bg-gain px-[10px] text-[12px] font-semibold tracking-[0.02em] text-white">
              01
            </span>
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gain">
              <span className="relative flex h-[5px] w-[5px] rounded-full bg-gain">
                <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
              </span>
              Holds the seat
            </span>
          </div>

          <h2 className="text-[clamp(25px,4.6vw,38px)] font-semibold leading-[1.03] tracking-[-0.04em]">
            <a
              href={`/go/${row.id}`}
              rel="nofollow ugc noopener"
              target="_blank"
              className="hover:underline"
            >
              {row.displayName}
            </a>
          </h2>

          {row.tagline ? (
            <p className="mx-auto mt-[6px] line-clamp-2 max-w-[52ch] text-[13.5px] leading-[1.45] text-ink-soft md:mx-0">
              {row.tagline}
            </p>
          ) : null}

          <dl className="mt-3 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-2 text-[12.5px] text-ink-faint sm:gap-x-6 md:justify-start">
            <Stat label="Paid">
              <span className="num text-[clamp(23px,3.8vw,30px)] font-semibold tracking-[-0.03em] text-gain">
                <Money cents={row.totalCents} animate={animate} />
              </span>
            </Stat>
            {row.reignStartedAt ? (
              <Stat label="Holding">
                <span className="num text-[15px] font-semibold text-ink">
                  <ReignClock since={row.reignStartedAt} bare />
                </span>
              </Stat>
            ) : null}
            <Stat label="Clicks">
              <Link
                href={`/e/${row.id}`}
                className="num text-[15px] font-semibold text-ink hover:underline"
              >
                {formatCount(row.clickCount)}
              </Link>
            </Stat>
            {cpc ? (
              <Stat label="Per click">
                <span className="num text-[15px] font-semibold text-ink">
                  {cpc}
                </span>
              </Stat>
            ) : null}
          </dl>
        </div>

        <div className="flex w-full flex-none flex-col items-center md:w-auto md:self-end">
          <button
            type="button"
            onClick={() => onTake(cost)}
            className="w-full whitespace-nowrap rounded-lg bg-ink px-6 py-3 text-[14px] font-semibold text-ground transition-colors hover:bg-gain md:w-auto"
          >
            Take the top seat, {formatCents(cost)}
          </button>
          <p className="mt-2 text-center text-[11.5px] text-ink-faint md:text-right">
            Or join the board from $1
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-[1px] text-[10px] font-semibold uppercase tracking-[0.14em]">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function BrandMark({ row }: { row: BoardRow }) {
  const size =
    "h-14 w-14 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl flex-none overflow-hidden ring-1 ring-ink/10";
  if (row.logoUrl || row.faviconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={row.logoUrl ?? row.faviconUrl ?? ""}
        alt=""
        className={`${size} bg-panel object-cover`}
      />
    );
  }
  // No mark supplied: a deterministic gradient derived from the URL, so an
  // entry without a logo still reads as a brand rather than a grey box.
  return (
    <div
      className={`${size} flex items-center justify-center`}
      style={{ background: brandGradient(row.url) }}
    >
      <span className="text-[clamp(28px,5vw,44px)] font-semibold text-white/90">
        {row.displayName.replace(/^@/, "").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
