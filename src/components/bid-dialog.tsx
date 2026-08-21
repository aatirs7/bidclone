"use client";

import { useEffect, useRef } from "react";

import { MAX_BID_CENTS, formatCents } from "@/lib/money";

/**
 * The form lives behind a button rather than occupying the top of the page.
 * Everything above the board should be the board, and the seat holder.
 */
export function BidDialog({
  open,
  onClose,
  url,
  setUrl,
  logoUrl,
  setLogoUrl,
  dollars,
  setDraft,
  commitDraft,
  step,
  amount,
  seatPriceCents,
  submitting,
  error,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  setUrl: (v: string) => void;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  dollars: string;
  setDraft: (v: string) => void;
  commitDraft: () => void;
  step: (direction: number) => void;
  amount: number;
  seatPriceCents: number;
  submitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Focus lands on the field the visitor has to fill in, not the dialog.
    const id = setTimeout(() => urlRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(id);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Place a bid"
        className="w-full max-w-[540px] rounded-t-2xl border border-rule bg-ground p-6 shadow-[0_24px_64px_-16px_rgba(21,23,26,0.35)] sm:rounded-2xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">
              Take a seat
            </h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              Bids stack. Your total is permanent.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[20px] leading-none text-ink-faint transition-colors hover:text-ink"
          >
            &times;
          </button>
        </div>

        <div className="mb-5 border-y border-rule py-5 text-center">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Your bid
          </div>
          <div className="flex items-center justify-center gap-3">
            <Stepper label="Lower amount" onClick={() => step(-1)}>
              &minus;
            </Stepper>
            <span className="num flex items-baseline text-[clamp(34px,9vw,48px)] font-semibold tracking-[-0.035em] text-gain">
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
                className="num border-0 bg-transparent p-0 text-left font-semibold tracking-[-0.035em] text-gain outline-none"
                style={{ width: `${Math.max(1, dollars.length)}ch` }}
              />
            </span>
            <Stepper label="Raise amount" onClick={() => step(1)}>
              +
            </Stepper>
          </div>
          <p className="mt-3 text-[12.5px] text-ink-faint">
            {amount >= seatPriceCents
              ? "This takes the seat."
              : `Anything under ${formatCents(seatPriceCents)} takes a lower seat, not nothing.`}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-[10px]">
          <input
            ref={urlRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="text"
            inputMode="url"
            autoComplete="url"
            aria-label="Your product URL or handle"
            placeholder="Your product URL or @handle"
            className="h-[50px] w-full border border-rule bg-panel px-[14px] text-[15px] text-ink outline-none focus:border-ink placeholder:text-ink-faint"
          />
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            type="text"
            inputMode="url"
            aria-label="Logo image URL, optional"
            placeholder="Logo image URL (optional). We use your favicon if you skip it."
            className="h-[44px] w-full border border-rule bg-panel px-[14px] text-[13.5px] text-ink outline-none focus:border-ink placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full bg-ink text-[15px] font-semibold tracking-[-0.01em] text-ground transition-colors hover:bg-gain disabled:opacity-60"
          >
            {submitting
              ? "Opening checkout"
              : `Pay ${formatCents(amount)} and take your seat`}
          </button>
        </form>

        {error ? (
          <p className="mt-3 text-[13px] text-drop" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-[12px] leading-[1.5] text-ink-faint">
          One time payment. No refunds. You are buying a position on this page
          and nothing else. Already listed? Enter the same URL and your bids
          stack.
          {seatPriceCents > MAX_BID_CENTS
            ? ` A single payment is capped at ${formatCents(MAX_BID_CENTS)}, so taking the seat takes more than one bid.`
            : ""}
        </p>
      </div>
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
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-rule bg-panel text-[18px] leading-none text-ink-soft transition-colors hover:border-ink hover:text-ink"
    >
      {children}
    </button>
  );
}
