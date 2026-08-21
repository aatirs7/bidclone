"use client";

import { useEffect, useRef } from "react";

import { POWERUP_LIST, type PowerupKind } from "@/lib/powerups";
import { MAX_BID_CENTS, formatCents } from "@/lib/money";
import { ordinal } from "@/lib/ordinal";
import { PowerupIcon } from "./powerup-icon";

/**
 * Everything between wanting a seat and paying for it, in one place. Taking a
 * spot from a row opens this directly rather than sending the visitor back to
 * the top of the page to find a form.
 */
export function BidModal({
  open,
  onClose,
  onContinue,
  url,
  setUrl,
  dollars,
  setDraft,
  commitDraft,
  step,
  amount,
  seatRank,
  selected,
  onToggle,
  submitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  url: string;
  setUrl: (v: string) => void;
  dollars: string;
  setDraft: (v: string) => void;
  commitDraft: () => void;
  step: (direction: number) => void;
  amount: number;
  seatRank: number;
  selected: PowerupKind[];
  onToggle: (kind: PowerupKind) => void;
  submitting: boolean;
  error: string | null;
}) {
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Land on the only field that has to be filled in.
    const id = setTimeout(() => urlRef.current?.focus(), 60);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(id);
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Place a bid"
        className="max-h-[94vh] w-full max-w-[520px] overflow-y-auto rounded-t-2xl border border-rule bg-ground shadow-[0_24px_64px_-16px_rgba(0,0,0,0.5)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">
              {seatRank === 1
                ? "Take the top seat"
                : `Take the ${ordinal(seatRank)} seat`}
            </h2>
            <p className="mt-[2px] text-[13px] text-ink-soft">
              Bids stack. Your total is permanent.
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

        <div className="mt-4 border-y border-rule px-5 py-5 text-center sm:px-6">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Your bid
          </div>
          <div className="flex items-center justify-center gap-3">
            <Stepper label="Lower amount" onClick={() => step(-1)}>
              &minus;
            </Stepper>
            <span className="num flex items-baseline text-[clamp(32px,9vw,44px)] font-semibold tracking-[-0.04em] text-gain">
              <span aria-hidden="true">$</span>
              <input
                value={dollars}
                onChange={(e) =>
                  setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                onFocus={(e) => e.target.select()}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitDraft();
                  }
                }}
                type="text"
                inputMode="numeric"
                aria-label="Bid amount in dollars"
                className="field-input num border-0 bg-transparent p-0 text-left font-semibold tracking-[-0.04em] text-gain outline-none"
                style={{ width: `${Math.max(1, dollars.length)}ch` }}
              />
            </span>
            <Stepper label="Raise amount" onClick={() => step(1)}>
              +
            </Stepper>
          </div>
          <p className="mt-2 text-[12px] text-ink-faint">
            Lands you at{" "}
            <span className="num font-semibold text-ink">
              seat {seatRank}
            </span>
            {amount >= MAX_BID_CENTS
              ? `. ${formatCents(MAX_BID_CENTS)} is the most one payment can carry.`
              : ". Bid again any time to climb."}
          </p>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <label className="flex h-[50px] items-center gap-[10px] rounded-full border border-rule bg-panel px-5 transition-colors focus-within:border-ink focus-within:ring-2 focus-within:ring-gain/40">
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="flex-none text-ink-faint"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.5" />
              <path d="M1.5 8h13M8 1.5a10 10 0 0 1 0 13 10 10 0 0 1 0-13" />
            </svg>
            <input
              ref={urlRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim()) onContinue();
              }}
              type="text"
              inputMode="url"
              autoComplete="url"
              aria-label="Your product URL or handle"
              placeholder="Your product URL or @handle"
              className="field-input h-full w-full border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
          </label>
          <p className="mt-2 text-center text-[11.5px] text-ink-faint">
            Your name and icon come from your own site. Already listed? Enter
            the same URL and your bids stack.
          </p>
        </div>

        <div className="border-t border-rule px-5 py-4 sm:px-6">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Add an edge, optional
          </div>
          <div className="space-y-2">
            {POWERUP_LIST.map((p) => {
              const on = selected.includes(p.kind);
              // Holding the seat is the premise of these, so they are not
              // offered on a bid that does not take it.
              const locked = p.leaderOnly && seatRank !== 1;

              return (
                <div
                  key={p.kind}
                  className={`flex items-center gap-3 rounded-xl border p-[10px] transition-colors ${
                    on ? "border-gain/50 bg-gain-wash" : "border-rule bg-panel"
                  } ${locked ? "opacity-45" : ""}`}
                >
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg border ${
                      on
                        ? "border-gain/40 bg-panel text-gain"
                        : "border-rule bg-ground text-ink-soft"
                    }`}
                  >
                    <PowerupIcon kind={p.kind} size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[13px] font-semibold">{p.name}</h3>
                      <span className="num text-[12px] font-semibold text-gain">
                        {formatCents(p.priceCents)}
                      </span>
                    </div>
                    <p className="mt-[1px] text-[11.5px] leading-[1.35] text-ink-soft">
                      {locked ? "Only when your bid takes the top seat." : p.tease}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onToggle(p.kind)}
                    className={`flex-none rounded-full border px-[11px] py-1 text-[11.5px] font-semibold transition-colors disabled:cursor-not-allowed ${
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
        </div>

        <div className="border-t border-rule px-5 py-4 sm:px-6">
          <div className="space-y-1 text-[13px]">
            <Line label="Bid" value={formatCents(amount)} />
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
                {formatCents(amount + extras)}
              </span>
            </div>
            {extras > 0 ? (
              <p className="pt-1 text-[11.5px] text-ink-faint">
                Only the {formatCents(amount)} bid counts toward your rank.
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
            disabled={submitting || !url.trim()}
            className="mt-4 h-[50px] w-full rounded-full bg-ink text-[15px] font-semibold text-ground transition-all hover:bg-gain active:scale-[0.99] disabled:opacity-50"
          >
            {submitting
              ? "Opening checkout"
              : !url.trim()
                ? "Enter your URL to continue"
                : `Continue to checkout, ${formatCents(amount + extras)}`}
          </button>

          <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-ink-faint">
            One time payment. No refunds. You are buying a position on this page
            and nothing else.
          </p>
        </div>
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

function Stepper({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-rule bg-panel text-[18px] leading-none text-ink-soft transition-all hover:border-ink hover:text-ink active:scale-95"
    >
      {children}
    </button>
  );
}
