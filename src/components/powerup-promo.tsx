"use client";

import { POWERUPS, type PowerupKind } from "@/lib/powerups";
import { formatCents } from "@/lib/money";
import { PowerupIcon } from "./powerup-icon";

/**
 * A single power-up sold inline, for the gaps between sections. Carries its
 * own colour so it reads as an ad rather than as part of the ledger.
 */
export function PowerupPromo({
  kind,
  onPick,
  className = "",
}: {
  kind: PowerupKind;
  onPick?: (kind: PowerupKind) => void;
  className?: string;
}) {
  const p = POWERUPS[kind];

  return (
    <button
      type="button"
      onClick={() => onPick?.(kind)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-panel p-3 text-left transition-all duration-200 hover:-translate-y-[2px] sm:gap-4 sm:p-4 ${className}`}
      style={{ borderColor: `${p.accent}40` }}
    >
      <span
        aria-hidden="true"
        className="pu-glow pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: p.accent }}
      />
      <span
        className="relative flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110"
        style={{
          background: `linear-gradient(140deg, ${p.accent}, ${p.accentTo})`,
          boxShadow: `0 8px 18px -8px ${p.accent}`,
        }}
      >
        <PowerupIcon kind={kind} size={20} />
      </span>

      <span className="relative min-w-0 flex-1">
        <span
          className="block text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: p.accent }}
        >
          {p.hook}
        </span>
        <span className="block text-[14px] font-semibold tracking-[-0.01em]">
          {p.name}
        </span>
        <span className="block truncate text-[12px] text-ink-soft">
          {p.tease}
        </span>
      </span>

      <span
        className="relative flex-none rounded-full px-3 py-[6px] text-[12.5px] font-semibold text-white"
        style={{
          background: `linear-gradient(120deg, ${p.accent}, ${p.accentTo})`,
        }}
      >
        {formatCents(p.priceCents)}
      </span>
    </button>
  );
}
