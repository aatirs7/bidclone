"use client";

import { useState } from "react";

import { POWERUP_LIST } from "@/lib/powerups";
import { formatCents } from "@/lib/money";

/**
 * Sits above the board so people learn the edge exists without scrolling. One
 * centered line closed, the full catalog when opened. The only place on the
 * page that is allowed to look tempting rather than institutional.
 */
export function PowerupStrip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-gain/25 bg-gradient-to-r from-gain-wash/70 via-panel to-gain-wash/70">
      <span aria-hidden="true" className="seat-sheen" />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-[9px] text-center"
      >
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gain">
          <span className="relative flex h-[5px] w-[5px] rounded-full bg-gain">
            <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
          </span>
          Power-ups
        </span>

        <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-[6px]">
          {POWERUP_LIST.map((p) => (
            <span
              key={p.kind}
              className="rounded-full border border-gain/25 bg-panel/70 px-[10px] py-[3px] text-[12.5px] font-medium text-ink"
            >
              {p.name}{" "}
              <span className="num font-semibold text-gain">
                {formatCents(p.priceCents)}
              </span>
            </span>
          ))}
        </span>

        <span className="text-[12px] text-ink-soft underline decoration-dotted underline-offset-2">
          {open ? "Hide" : "Buy an edge, not just a rank"}
        </span>
      </button>

      {open ? (
        <div className="relative grid grid-cols-1 gap-x-8 gap-y-5 border-t border-gain/20 px-5 py-5 text-center sm:grid-cols-2 sm:text-left">
          {POWERUP_LIST.map((p) => (
            <div key={p.kind}>
              <div className="flex items-baseline justify-center gap-2 sm:justify-start">
                <h3 className="text-[14px] font-semibold">{p.name}</h3>
                <span className="num text-[13px] font-semibold text-gain">
                  {formatCents(p.priceCents)}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] leading-[1.45] text-ink-soft">
                {p.blurb}
              </p>
            </div>
          ))}
          <p className="text-[12px] text-ink-faint sm:col-span-2">
            Power-ups go live alongside the board. Everything they do is visible
            on this page, so nobody has to take our word for it.
          </p>
        </div>
      ) : null}
    </div>
  );
}
