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
  onPick,
}: {
  onPick?: (kind: string) => void;
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
    <div className="relative mt-3 overflow-hidden rounded-xl border border-rule bg-panel">
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
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Power-ups
        </span>

        <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-[6px]">
          {POWERUP_LIST.map((p) => (
            <span
              key={p.kind}
              className="group/pill relative flex items-center gap-[6px] rounded-full border px-[10px] py-[4px] text-[12.5px] font-medium text-ink transition-all hover:-translate-y-[1px]"
              style={{
                borderColor: `${p.accent}66`,
                background: `${p.accent}14`,
              }}
            >
              <PowerupIcon kind={p.kind} style={{ color: p.accent }} />
              {p.name}
              <span
                className="num font-semibold"
                style={{ color: p.accent }}
              >
                {formatCents(p.priceCents)}
              </span>

              {/* Explains itself without needing the panel opened. */}
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-[210px] -translate-x-1/2 rounded-lg border border-rule bg-panel p-2 text-left text-[11.5px] font-normal leading-[1.4] text-ink-soft opacity-0 shadow-lg transition-opacity duration-150 group-hover/pill:opacity-100"
              >
                <b
                  className="block font-semibold"
                  style={{ color: p.accent }}
                >
                  {p.hook}
                </b>
                {p.blurb}
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
          <div className="grid grid-cols-2 gap-2 border-t border-rule p-3 sm:gap-3 sm:p-4 lg:grid-cols-3">
            {POWERUP_LIST.map((p) => (
              <button
                key={p.kind}
                type="button"
                onClick={() => onPick?.(p.kind)}
                className="group/card relative flex flex-col items-center overflow-hidden rounded-xl border bg-panel px-3 py-4 text-center transition-all duration-200 hover:-translate-y-[2px]"
                style={{ borderColor: `${p.accent}33` }}
              >
                <span
                  aria-hidden="true"
                  className="pu-glow pointer-events-none absolute -top-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full blur-2xl"
                  style={{ background: p.accent }}
                />
                <span
                  className="pu-float relative flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover/card:scale-110"
                  style={{
                    background: `linear-gradient(140deg, ${p.accent}, ${p.accentTo})`,
                    boxShadow: `0 8px 18px -8px ${p.accent}`,
                  }}
                >
                  <PowerupIcon kind={p.kind} size={19} />
                </span>
                <span
                  className="relative mt-2 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: p.accent }}
                >
                  {p.hook}
                </span>
                <h3 className="relative mt-[1px] text-[13.5px] font-semibold">
                  {p.name}
                </h3>
                <span
                  className="relative mt-[2px] rounded-full px-[10px] py-[2px] text-[12px] font-semibold text-white"
                  style={{
                    background: `linear-gradient(120deg, ${p.accent}, ${p.accentTo})`,
                  }}
                >
                  {formatCents(p.priceCents)}
                </span>
                <p className="relative mt-2 text-[12px] leading-[1.4] text-ink-soft">
                  {p.blurb}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
