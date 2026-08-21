"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Board } from "@/lib/leaderboard";
import {
  MAX_BID_CENTS,
  MIN_BID_CENTS,
  formatCents,
  formatCount,
} from "@/lib/money";
import { formatAgo, formatDuration } from "@/lib/time";
import { LedgerHead, LedgerRow } from "./row";

const POLL_MS = 10_000;
const PULSE_MS = 60_000;

/**
 * The step scales with the amount. A flat step is wrong at both ends: $25 jumps
 * are absurd when the seat costs $1, and $1 jumps are useless when it costs
 * $8,000. The long tail of small bidders is the thing most worth protecting.
 */
function stepFor(cents: number, direction: number) {
  const basis = direction < 0 ? cents - 1 : cents;
  if (basis < 2_000) return 100;
  if (basis < 10_000) return 500;
  if (basis < 50_000) return 2_500;
  return 10_000;
}
const FLASH_MS = 1_600;

const ITEM =
  "flex items-center gap-[10px] border-b border-rule py-[7px] text-[13px] last:border-b-0";

function clampBid(cents: number) {
  return Math.min(MAX_BID_CENTS, Math.max(MIN_BID_CENTS, Math.round(cents)));
}

export function LiveBoard({ initial }: { initial: Board }) {
  const [board, setBoard] = useState(initial);
  // Null means "follow the live cost of the seat". Once the visitor touches a
  // stepper or takes a spot, their number wins. Derived rather than synced, so
  // a poll cannot stomp on what they typed.
  const [override, setOverride] = useState<number | null>(null);
  // Set while the visitor is typing their own number, so the field does not
  // fight them by reformatting mid keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const [leadChanged, setLeadChanged] = useState(false);

  const urlRef = useRef<HTMLInputElement>(null);
  const positions = useRef(new Map<string, number>());

  // Presence heartbeat. One row per visitor per minute, which is what makes the
  // "reading this now" figure a real number rather than a decoration.
  useEffect(() => {
    const beat = () => {
      void fetch("/api/pulse", { method: "POST", keepalive: true }).catch(
        () => {},
      );
    };
    beat();
    const id = setInterval(beat, PULSE_MS);
    return () => clearInterval(id);
  }, []);

  // Polling beats websockets at this scale and will not be the thing that
  // breaks. Paused while the tab is hidden so a backgrounded tab costs nothing.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as Board;
        if (!cancelled) setBoard(next);
      } catch {
        // A dropped poll is not worth telling the visitor about.
      }
    };
    const id = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, []);

  // The signature moment. Anything that lost ground flashes red, the new leader
  // counts up, and everything else on the page holds still.
  useEffect(() => {
    const before = positions.current;
    const after = new Map<string, number>();
    board.rows.forEach((row, index) => after.set(row.id, index));

    if (before.size > 0) {
      const fell = new Set<string>();
      after.forEach((index, id) => {
        const was = before.get(id);
        if (was !== undefined && index > was) fell.add(id);
      });

      const newLeader = board.rows[0]?.id;
      let oldLeader: string | undefined;
      before.forEach((index, id) => {
        if (index === 0) oldLeader = id;
      });

      if (fell.size > 0) {
        setDropped(fell);
        setTimeout(() => setDropped(new Set()), FLASH_MS);
      }
      if (newLeader && oldLeader && newLeader !== oldLeader) {
        setLeadChanged(true);
        setTimeout(() => setLeadChanged(false), FLASH_MS);
      }
    }

    positions.current = after;
  }, [board.rows]);

  const amount = override ?? board.seatPriceCents;

  const takeSpot = useCallback((cents: number) => {
    setOverride(clampBid(cents));
    urlRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    urlRef.current?.focus({ preventScroll: true });
  }, []);

  const step = (direction: number) => {
    setDraft(null);
    setOverride((current) => {
      const from = current ?? board.seatPriceCents;
      return clampBid(from + stepFor(from, direction) * direction);
    });
  };

  const dollars =
    draft ?? formatCount(Math.round(amount / 100));

  const commitDraft = () => {
    const parsed = Number.parseInt(draft ?? "", 10);
    setDraft(null);
    if (Number.isFinite(parsed)) setOverride(clampBid(parsed * 100));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, amountCents: amount }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setSubmitting(false);
    }
  }

  const visible = showAll ? board.rows : board.rows.slice(0, 50);

  return (
    <>
      <LiveStrip board={board} />

      <main className="mx-auto max-w-[940px] px-5">
        <section className="border-b border-ink/15 pt-9 pb-7 sm:pt-14">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[440px]">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                The seat is bought, not earned
              </div>
              <h1 className="text-[clamp(30px,4.6vw,44px)] font-semibold leading-[1.05] tracking-[-0.035em]">
                Take the seat
              </h1>
              <p className="mt-3 text-[14.5px] leading-[1.5] text-ink-soft">
                <b className="font-semibold text-ink">
                  Every bid you place stays on your name.
                </b>{" "}
                Spend less than the leader and you take a lower seat, not
                nothing.
              </p>
            </div>

            <div className="md:text-right">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Price of the seat
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <Stepper label="Lower amount" onClick={() => step(-1)}>
                  &minus;
                </Stepper>
                <span className="num flex items-baseline text-[clamp(36px,7vw,56px)] font-semibold tracking-[-0.035em] text-gain">
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
                        e.currentTarget.blur();
                      }
                    }}
                    type="text"
                    inputMode="numeric"
                    aria-label="Bid amount in dollars"
                    className="num border-0 bg-transparent p-0 text-left font-semibold tracking-[-0.035em] text-gain outline-none md:text-right"
                    style={{ width: `${Math.max(1, dollars.length)}ch` }}
                  />
                </span>
                <Stepper label="Raise amount" onClick={() => step(1)}>
                  +
                </Stepper>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="mt-7 flex flex-col gap-[10px] sm:flex-row"
          >
            <label className="flex h-[50px] flex-1 items-center gap-[10px] border border-rule bg-panel px-[14px] focus-within:border-ink">
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
                type="text"
                inputMode="url"
                autoComplete="url"
                aria-label="Your product URL or handle"
                placeholder="Your product URL or @handle"
                className="h-full w-full border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="h-[50px] bg-ink px-8 text-[15px] font-semibold tracking-[-0.01em] text-ground transition-colors hover:bg-gain disabled:opacity-60"
            >
              {submitting ? "Opening checkout" : "Place bid"}
            </button>
          </form>

          {error ? (
            <p className="mt-2 text-[13px] text-drop" role="alert">
              {error}
            </p>
          ) : null}

          <p className="mt-3 text-[12.5px] text-ink-faint">
            One time payment. No refunds. You are buying a position on this page
            and nothing else. Type any amount between $1 and $1,000. Already
            listed? Enter the same URL and your bids stack.
          </p>

          {board.seatPriceCents > MAX_BID_CENTS ? (
            <p className="mt-2 text-[12.5px] text-ink-soft">
              The seat costs {formatCents(board.seatPriceCents)} and a single
              payment is capped at {formatCents(MAX_BID_CENTS)}. Bid more than
              once to keep climbing, since your total is what counts.
            </p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-x-10 gap-y-7 border-b border-rule py-7 md:grid-cols-2">
          <Panel title="Moving now">
            {board.movers.length === 0 ? (
              <Quiet>No clicks in the last hour.</Quiet>
            ) : (
              board.movers.map((m) => (
                <li key={m.id} className={ITEM}>
                  <Dot src={m.faviconUrl} />
                  <span className="truncate font-medium">{m.displayName}</span>
                  <span className="flex-1" />
                  <span className="num flex-none text-[12.5px] text-ink-soft">
                    {formatCount(m.clicksPerHour)}/h
                  </span>
                </li>
              ))
            )}
          </Panel>

          <Panel title="Seat changes">
            {board.feed.length === 0 ? (
              <Quiet>Nothing has been paid yet.</Quiet>
            ) : (
              board.feed.map((item) => (
                <li key={item.id} className={ITEM}>
                  <Dot src={item.faviconUrl} />
                  <span className="truncate font-medium">
                    {item.displayName}
                  </span>
                  <span className="num flex-none text-[12.5px] text-gain">
                    {item.rank ? `#${item.rank}` : "new"}
                  </span>
                  <span className="flex-1" />
                  <span className="flex-none truncate text-[12px] text-ink-faint">
                    {item.displacedName && item.displacedReignSeconds !== null
                      ? `took it after ${formatDuration(item.displacedReignSeconds)}`
                      : formatAgo(item.at)}
                  </span>
                </li>
              ))
            )}
          </Panel>
        </section>

        <div
          id="board"
          className="mb-3 flex scroll-mt-20 items-baseline justify-between pt-8"
        >
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            The board
          </h2>
          <span className="num text-[12.5px] text-ink-faint">
            {formatCount(board.stats.entryCount)}{" "}
            {board.stats.entryCount === 1 ? "entry" : "entries"}
          </span>
        </div>

        {board.rows.length === 0 ? (
          <div className="border-y border-rule py-12 text-center">
            <p className="text-[15px] font-semibold">
              The seat is empty. First to pay $1 takes it.
            </p>
          </div>
        ) : (
          <>
            <LedgerHead />
            {visible.map((row, index) => (
              <LedgerRow
                key={row.id}
                row={row}
                position={index + 1}
                onTake={takeSpot}
                dethroned={dropped.has(row.id)}
                animate={leadChanged}
              />
            ))}
            {!showAll && board.rows.length > 50 ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-4 w-full border border-rule py-3 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Show all {formatCount(board.rows.length)} entries
              </button>
            ) : null}
          </>
        )}

        <section id="reigns" className="mt-10 scroll-mt-20">
          <div className="mb-3 flex items-baseline justify-between px-[2px]">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Longest reigns
            </h2>
            <span className="text-[12.5px] text-ink-faint">
              The one board you cannot buy outright
            </span>
          </div>
          <div className="border-t border-ink/15 pt-1">
            <ul>
              {board.reigns.length === 0 ? (
                <Quiet>
                  Nobody has held the seat long enough to record one.
                </Quiet>
              ) : (
                board.reigns.map((r, i) => (
                  <li key={r.id} className={ITEM}>
                    <span className="num w-6 flex-none text-[12.5px] font-semibold text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Dot src={r.faviconUrl} />
                    <Link
                      href={`/e/${r.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {r.displayName}
                    </Link>
                    <span className="flex-1" />
                    <span className="num flex-none text-[12.5px] text-ink-soft">
                      {formatDuration(r.seconds)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2 border-b border-ink/15 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h2>
      <ul>{children}</ul>
    </div>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <li className="py-2 text-[13.5px] text-ink-faint">{children}</li>;
}

function Dot({ src }: { src: string | null }) {
  if (!src) return <span className="h-5 w-5 flex-none rounded-[5px] bg-rule" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-5 w-5 flex-none rounded-[5px] bg-rule object-cover"
    />
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
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-rule bg-panel text-[17px] leading-none text-ink-soft transition-colors hover:border-ink hover:text-ink"
    >
      {children}
    </button>
  );
}

function LiveStrip({ board }: { board: Board }) {
  const { online, visitorsTotal, paidToDateCents } = board.stats;
  return (
    <div className="border-b border-rule bg-panel">
      <div className="mx-auto flex min-h-[38px] max-w-[940px] flex-wrap items-center justify-center gap-2 px-5 py-2 text-[12.5px] tracking-[0.01em] text-ink-soft">
        <span className="relative h-[6px] w-[6px] flex-none rounded-full bg-gain">
          <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
        </span>
        <span>
          <b className="num font-semibold text-ink">{formatCount(online)}</b>{" "}
          reading this now
        </span>
        <span className="text-rule">·</span>
        <span>
          <b className="num font-semibold text-ink">
            {formatCount(visitorsTotal)}
          </b>{" "}
          visitors since launch
        </span>
        <span className="text-rule">·</span>
        <span>
          <b className="num font-semibold text-ink">
            {formatCents(paidToDateCents)}
          </b>{" "}
          paid to date
        </span>
      </div>
    </div>
  );
}
