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
    <section className="seat-glow relative overflow-hidden rounded-2xl border border-gain/30 bg-gradient-to-br from-gain-wash via-panel to-panel shadow-[0_1px_2px_rgba(21,23,26,0.04),0_12px_32px_-12px_rgba(11,122,75,0.18)]">
      <span aria-hidden="true" className="seat-sheen" />
      {/* A wash of the entry's own color. The chrome stays disciplined and the
          brand supplies the only real color on the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.13] blur-2xl"
        style={{ background: brandGradient(row.url) }}
      />

      <div className="relative flex flex-col items-center gap-4 p-5 text-center sm:gap-6 sm:p-8 md:flex-row md:items-center md:gap-9 md:text-left">
        <BrandMark row={row} />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gain md:justify-start">
            <span className="relative flex h-[6px] w-[6px] rounded-full bg-gain">
              <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
            </span>
            Holds the seat
          </div>

          <h2 className="text-[clamp(26px,7vw,48px)] font-semibold leading-[1.03] tracking-[-0.04em]">
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
            <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-[1.5] text-ink-soft md:mx-0">
              {row.tagline}
            </p>
          ) : null}

          <dl className="mt-4 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-3 text-[12.5px] text-ink-faint sm:mt-5 sm:gap-x-7 md:justify-start">
            <Stat label="Paid">
              <span className="num text-[clamp(24px,5vw,36px)] font-semibold tracking-[-0.03em] text-gain">
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

        <div className="w-full flex-none md:w-auto md:self-end">
          <button
            type="button"
            onClick={() => onTake(cost)}
            className="w-full whitespace-nowrap rounded-lg bg-ink px-6 py-3 text-[14px] font-semibold text-ground transition-colors hover:bg-gain md:w-auto"
          >
            Take the seat, {formatCents(cost)}
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
    "h-14 w-14 sm:h-24 sm:w-24 rounded-xl sm:rounded-2xl flex-none overflow-hidden ring-1 ring-ink/10";
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
