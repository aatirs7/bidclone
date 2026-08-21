"use client";

import { useState } from "react";

import { POWERUP_LIST } from "@/lib/powerups";
import { formatCents } from "@/lib/money";

/**
 * Sits above the board so people learn the edge exists without scrolling. One
 * line closed, the full catalog when opened.
 */
export function PowerupStrip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-rule bg-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-[10px] text-left"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Power-ups
        </span>
        <span className="hidden flex-1 gap-2 overflow-hidden text-[12.5px] text-ink-soft sm:flex">
          {POWERUP_LIST.map((p, i) => (
            <span key={p.kind} className="whitespace-nowrap">
              {i > 0 ? <span className="mr-2 text-rule">·</span> : null}
              {p.name}{" "}
              <span className="num text-gain">
                {formatCents(p.priceCents)}
              </span>
            </span>
          ))}
        </span>
        <span className="flex-1 text-[12.5px] text-ink-soft sm:hidden">
          Buy an edge, from {formatCents(200)}
        </span>
        <span className="flex-none text-[12px] text-ink-faint">
          {open ? "Hide" : "What are these?"}
        </span>
      </button>

      {open ? (
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-rule px-4 py-4 sm:grid-cols-2">
          {POWERUP_LIST.map((p) => (
            <div key={p.kind}>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[13.5px] font-semibold">{p.name}</h3>
                <span className="num text-[13px] font-semibold text-gain">
                  {formatCents(p.priceCents)}
                </span>
              </div>
              <p className="mt-[2px] text-[12.5px] leading-[1.45] text-ink-soft">
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
