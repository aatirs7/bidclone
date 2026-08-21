"use client";

import { useState } from "react";

import { POWERUP_LIST } from "@/lib/powerups";
import { PowerupIcon } from "./powerup-icon";
import { formatCents } from "@/lib/money";

/**
 * Sits above the board so people learn the edge exists without scrolling. One
 * centered line closed, the full catalog when opened. The only place on the
 * page that is allowed to look tempting rather than institutional.
 */
export function PowerupStrip({
  open: controlledOpen,
  onOpenChange,
}: {
  /** Supplied when something else on the page needs to open the menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-gain/25 bg-gradient-to-r from-gain-wash/70 via-panel to-gain-wash/70">
      <span
        aria-hidden="true"
        className="seat-sheen"
        style={{ "--sheen-dur": "13.4s", "--sheen-delay": "5.1s" } as React.CSSProperties}
      />

      <button
        type="button"
        onClick={() => setOpen(!open)}
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
              title={p.tease}
              className="flex items-center gap-[6px] rounded-full border border-gain/25 bg-panel/70 px-[10px] py-[4px] text-[12.5px] font-medium text-ink transition-colors hover:border-gain/60"
            >
              <PowerupIcon kind={p.kind} className="text-gain" />
              {p.name}
              <span className="num font-semibold text-gain">
                {formatCents(p.priceCents)}
              </span>
            </span>
          ))}
        </span>

        <span className="flex w-full items-center justify-center gap-[6px] text-[12px] text-ink-soft">
          <span className="underline decoration-dotted underline-offset-2">
            {open ? "Hide" : "Add one to your bid and hold the seat longer"}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </span>
      </button>

      {/* Animating grid rows from 0fr to 1fr is the one way to transition to an
          unknown height without measuring it. The inner wrapper does the
          clipping so nothing jumps at the end of the transition. */}
      <div
        className={`relative grid transition-all duration-300 ease-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-2 border-t border-gain/20 p-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
            {POWERUP_LIST.map((p) => (
              <div
                key={p.kind}
                className="group/card relative flex flex-col items-center overflow-hidden rounded-xl border border-gain/25 bg-panel px-3 py-4 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-gain/60"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-gain opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover/card:opacity-[0.16]"
                />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gain/30 bg-gain-wash text-gain transition-transform duration-200 group-hover/card:scale-110">
                  <PowerupIcon kind={p.kind} size={20} />
                </span>
                <h3 className="relative mt-3 text-[13.5px] font-semibold tracking-[-0.01em]">
                  {p.name}
                </h3>
                <span className="num relative mt-[2px] text-[15px] font-semibold tracking-[-0.02em] text-gain">
                  {formatCents(p.priceCents)}
                </span>
                <p className="relative mt-2 text-[12px] leading-[1.45] text-ink-soft">
                  {p.blurb}
                </p>
              </div>
            ))}
            <p className="col-span-2 px-1 text-center text-[11.5px] text-ink-faint lg:col-span-4">
              Power-ups go live alongside the board. Everything they do is
              visible on this page, so nobody has to take our word for it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
