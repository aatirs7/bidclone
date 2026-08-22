"use client";

import { useEffect, useState } from "react";

import { POWERUP_LIST, type PowerupKind } from "@/lib/powerups";
import { formatCents } from "@/lib/money";
import { PowerupIcon } from "./powerup-icon";

const DISMISS_KEY = "cheapseat-powerup-popup";
const DELAY_MS = 15_000;

/**
 * One nudge, once, after the visitor has had time to read the board. Dismissal
 * is remembered so it never becomes the thing people remember about the site.
 */
export function PowerupPopup({
  onPick,
}: {
  onPick?: (kind: PowerupKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pick] = useState(
    () => POWERUP_LIST[Math.floor(Math.random() * POWERUP_LIST.length)],
  );

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // Private mode. Showing it is fine, it just will not be remembered.
    }
    const id = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Nothing to do; it reappears next visit at worst.
    }
  }

  if (!open) return null;

  return (
    <div className="pu-pop-in fixed bottom-4 right-4 z-40 w-[300px] max-w-[calc(100vw-2rem)]">
      <div
        className="relative overflow-hidden rounded-2xl border bg-panel p-4 shadow-[0_20px_48px_-16px_rgba(0,0,0,0.45)]"
        style={{ borderColor: `${pick.accent}55` }}
      >
        <span
          aria-hidden="true"
          className="pu-glow pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
          style={{ background: pick.accent }}
        />

        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[17px] leading-none text-ink-faint transition-colors hover:bg-rule hover:text-ink"
        >
          &times;
        </button>

        <div className="relative flex items-center gap-3">
          <span
            className="pu-float flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white"
            style={{
              background: `linear-gradient(140deg, ${pick.accent}, ${pick.accentTo})`,
              boxShadow: `0 8px 18px -8px ${pick.accent}`,
            }}
          >
            <PowerupIcon kind={pick.kind} size={20} />
          </span>
          <div className="min-w-0">
            <div
              className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: pick.accent }}
            >
              {pick.hook}
            </div>
            <div className="text-[14px] font-semibold">{pick.name}</div>
          </div>
        </div>

        <p className="relative mt-2 text-[12.5px] leading-[1.45] text-ink-soft">
          {pick.blurb}
        </p>

        <button
          type="button"
          onClick={() => {
            close();
            onPick?.(pick.kind);
          }}
          className="relative mt-3 w-full rounded-full py-[9px] text-[13px] font-semibold text-white transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(120deg, ${pick.accent}, ${pick.accentTo})`,
          }}
        >
          Add it for {formatCents(pick.priceCents)}
        </button>
      </div>
    </div>
  );
}
