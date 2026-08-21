"use client";

import { useEffect } from "react";

import { POWERUP_LIST, type PowerupKind } from "@/lib/powerups";
import { formatCents } from "@/lib/money";
import { PowerupIcon } from "./powerup-icon";

/**
 * The last step before Stripe. Offered rather than pushed: continuing without
 * adding anything is one click, and the running total is always visible so
 * nobody arrives at checkout surprised by the number.
 */
export function PowerupModal({
  open,
  onClose,
  onContinue,
  selected,
  onToggle,
  bidCents,
  seatRank,
  submitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  selected: PowerupKind[];
  onToggle: (kind: PowerupKind) => void;
  bidCents: number;
  /** The seat this bid takes. Seat-only power-ups are offered only at one. */
  seatRank: number;
  submitting: boolean;
  error: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const extras = selected.reduce((sum, kind) => {
    const spec = POWERUP_LIST.find((p) => p.kind === kind);
    return sum + (spec?.priceCents ?? 0);
  }, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a power-up"
        className="deal-in max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl border border-rule bg-ground p-5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.45)] sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">
              Want an edge with that?
            </h2>
            <p className="mt-[2px] text-[13px] text-ink-soft">
              Optional. Skip it and go straight to checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[19px] leading-none text-ink-faint transition-colors hover:bg-rule hover:text-ink"
          >
            &times;
          </button>
        </div>

        <div className="space-y-2">
          {POWERUP_LIST.map((p) => {
            const on = selected.includes(p.kind);
            // Holding the seat is the whole premise of these two, so they are
            // not offered on a bid that does not take it.
            const locked = p.leaderOnly && seatRank !== 1;

            return (
              <div
                key={p.kind}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  on ? "border-gain/50 bg-gain-wash" : "border-rule bg-panel"
                } ${locked ? "opacity-50" : ""}`}
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg border ${
                    on
                      ? "border-gain/40 bg-panel text-gain"
                      : "border-rule bg-ground text-ink-soft"
                  }`}
                >
                  <PowerupIcon kind={p.kind} size={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[13.5px] font-semibold">{p.name}</h3>
                    <span className="num text-[12.5px] font-semibold text-gain">
                      {formatCents(p.priceCents)}
                    </span>
                  </div>
                  <p className="mt-[1px] text-[12px] leading-[1.4] text-ink-soft">
                    {locked
                      ? "Only for a bid that takes the top seat."
                      : p.tease}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(p.kind)}
                  className={`flex-none rounded-full border px-3 py-[5px] text-[12px] font-semibold transition-colors disabled:cursor-not-allowed ${
                    on
                      ? "border-gain bg-gain text-white"
                      : "border-rule text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {on ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-1 border-t border-rule pt-3 text-[13px]">
          <Line label="Bid" value={formatCents(bidCents)} />
          {selected.map((kind) => {
            const spec = POWERUP_LIST.find((p) => p.kind === kind);
            if (!spec) return null;
            return (
              <Line
                key={kind}
                label={spec.name}
                value={formatCents(spec.priceCents)}
              />
            );
          })}
          <div className="flex justify-between pt-1 font-semibold">
            <span>Total</span>
            <span className="num text-gain">
              {formatCents(bidCents + extras)}
            </span>
          </div>
          {extras > 0 ? (
            <p className="pt-1 text-[11.5px] text-ink-faint">
              Only the {formatCents(bidCents)} bid counts toward your rank.
              Power-ups do not buy position.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-[13px] text-drop" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onContinue}
          disabled={submitting}
          className="mt-4 h-[50px] w-full rounded-full bg-ink text-[15px] font-semibold text-ground transition-all hover:bg-gain active:scale-[0.99] disabled:opacity-60"
        >
          {submitting
            ? "Opening checkout"
            : `Continue to checkout, ${formatCents(bidCents + extras)}`}
        </button>

        <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-ink-faint">
          One time payment. No refunds. You are buying a position on this page
          and nothing else.
        </p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}
