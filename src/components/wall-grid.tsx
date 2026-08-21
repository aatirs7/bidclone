"use client";

import Link from "next/link";

import type { WallEntry } from "@/lib/leaderboard";
import { brandGradient } from "@/lib/brand";
import { formatCount } from "@/lib/money";
import { formatDuration } from "@/lib/time";
import { ReignClock } from "./reign-clock";

/**
 * Everyone who has ever held the seat, in the order they took it. A ranking can
 * be bought back tomorrow; a plate on this wall cannot be taken off it. That
 * permanence is the point, and it is the one reason to reach the top that has
 * nothing to do with holding it.
 */
export function WallGrid({
  entries,
  seatPriceCents,
}: {
  entries: WallEntry[];
  seatPriceCents: number;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-rule bg-panel px-6 py-16 text-center">
        <p className="text-[clamp(20px,3.6vw,28px)] font-semibold tracking-[-0.03em]">
          The wall is bare.
        </p>
        <p className="mx-auto mt-2 max-w-[42ch] text-[14px] text-ink-soft">
          Nobody has held the seat yet. The first plate costs{" "}
          <span className="num text-gain">
            ${Math.round(seatPriceCents / 100)}
          </span>{" "}
          and never comes down.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map((entry, index) => (
        <Plate key={entry.id} entry={entry} index={index} />
      ))}
    </div>
  );
}

function Plate({ entry, index }: { entry: WallEntry; index: number }) {
  const holding = Boolean(entry.reignStartedAt);
  const mark = entry.logoUrl ?? entry.faviconUrl;

  return (
    <Link
      href={`/e/${entry.id}`}
      style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
      className={`deal-in lift group relative flex flex-col overflow-hidden rounded-xl border p-4 transition-transform duration-200 hover:-translate-y-[2px] ${
        holding ? "seat-glow border-gain/40 bg-gain-wash" : "border-rule bg-panel"
      }`}
    >
      {/* The entry's own color, kept to a wash so the plate stays a plate. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.16] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.3]"
        style={{ background: brandGradient(entry.url) }}
      />

      <div className="relative mb-3 flex items-start justify-between gap-2">
        <span className="num text-[11px] font-semibold tracking-[0.08em] text-ink-faint">
          {String(index + 1).padStart(3, "0")}
        </span>
        {holding ? (
          <span className="flex items-center gap-[5px] text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gain">
            <span className="relative flex h-[5px] w-[5px] rounded-full bg-gain">
              <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
            </span>
            Holds it
          </span>
        ) : null}
      </div>

      <div className="relative">
        {mark ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mark}
            alt=""
            loading="lazy"
            className="h-12 w-12 rounded-xl bg-panel object-cover ring-1 ring-ink/10"
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-ink/10"
            style={{ background: brandGradient(entry.url) }}
          >
            <span className="text-[19px] font-semibold text-white/90">
              {entry.displayName.replace(/^@/, "").charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <h3 className="mt-3 truncate text-[14px] font-semibold tracking-[-0.015em]">
          {entry.displayName}
        </h3>

        <dl className="mt-2 space-y-[3px] text-[11.5px] text-ink-faint">
          <div className="flex justify-between gap-2">
            <dt>Held</dt>
            <dd className="num text-ink-soft">
              {holding && entry.reignStartedAt ? (
                <span className="text-gain">
                  <ReignClock since={entry.reignStartedAt} bare />
                </span>
              ) : entry.seconds > 0 ? (
                formatDuration(entry.seconds)
              ) : (
                "under a minute"
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Took it</dt>
            <dd className="num text-ink-soft">
              {formatCount(entry.timesAtOne)}
              {entry.timesAtOne === 1 ? " time" : " times"}
            </dd>
          </div>
          {entry.claimedAt ? (
            <div className="flex justify-between gap-2">
              <dt>Since</dt>
              <dd className="num text-ink-soft">
                {entry.claimedAt.slice(0, 10)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Link>
  );
}
