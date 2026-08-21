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
import { BidDialog } from "./bid-dialog";
import { Champion } from "./champion";
import { PowerupStrip } from "./powerup-strip";
import { BoardEntry } from "./row";

const POLL_MS = 10_000;
const PULSE_MS = 60_000;
const FLASH_MS = 1_600;

const ITEM =
  "flex items-center gap-[10px] border-b border-rule py-[9px] text-[13px] last:border-b-0";

function clampBid(cents: number) {
  return Math.min(MAX_BID_CENTS, Math.max(MIN_BID_CENTS, Math.round(cents)));
}

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

export function LiveBoard({ initial }: { initial: Board }) {
  const [board, setBoard] = useState(initial);
  // Null means "follow the live cost of the seat". Once the visitor touches a
  // stepper or takes a spot, their number wins. Derived rather than synced, so
  // a poll cannot stomp on what they typed.
  const [override, setOverride] = useState<number | null>(null);
  // Set while the visitor is typing, so the field does not fight them by
  // reformatting mid keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const [leadChanged, setLeadChanged] = useState(false);

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
  const dollars = draft ?? formatCount(Math.round(amount / 100));

  const commitDraft = useCallback(() => {
    const parsed = Number.parseInt(draft ?? "", 10);
    setDraft(null);
    if (Number.isFinite(parsed)) setOverride(clampBid(parsed * 100));
  }, [draft]);

  const step = useCallback(
    (direction: number) => {
      setDraft(null);
      setOverride((current) => {
        const from = current ?? board.seatPriceCents;
        return clampBid(from + stepFor(from, direction) * direction);
      });
    },
    [board.seatPriceCents],
  );

  const takeSpot = useCallback((cents: number) => {
    setOverride(clampBid(cents));
    setOpen(true);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, amountCents: amount, logoUrl }),
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

  const leader = board.rows[0] ?? null;
  // Rank 01 lives in the showcase above, so the ledger lists the challengers.
  const chasers = board.rows.slice(1);
  const visible = showAll ? chasers : chasers.slice(0, 49);

  return (
    <>
      <LiveStrip board={board} />

      <main className="mx-auto max-w-[940px] px-4 sm:px-5">
        {leader ? (
          <div className="pt-4 sm:pt-6">
            <Champion row={leader} onTake={takeSpot} animate={leadChanged} />
          </div>
        ) : (
          <div className="mt-6 border border-rule bg-panel p-10 text-center">
            <p className="text-[clamp(21px,5vw,32px)] font-semibold tracking-[-0.03em]">
              The seat is empty.
              <br className="sm:hidden" /> Be number one here for $1.
            </p>
          </div>
        )}

        {/* Compact pitch band, centered. The form itself lives behind these
            buttons, so the board clears the fold. */}
        <div className="mt-5 border-y border-ink/15 py-5 text-center">
          <p className="text-[clamp(18px,2.8vw,24px)] font-semibold leading-[1.2] tracking-[-0.025em]">
            {leader ? (
              <>
                They paid{" "}
                <span className="num text-gain">
                  {formatCents(leader.totalCents)}
                </span>
                . Get on this board for $1.
              </>
            ) : (
              <>Be number one here for $1.</>
            )}
          </p>
          <p className="mx-auto mt-[6px] max-w-[54ch] text-[13.5px] text-ink-soft">
            Every bid stays on your name. Spend less than the leader and you
            take a lower seat, not nothing.
          </p>

          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => takeSpot(board.seatPriceCents)}
              className="w-full bg-ink px-7 py-3 text-[14.5px] font-semibold tracking-[-0.01em] text-ground transition-colors hover:bg-gain sm:w-auto"
            >
              Take the top seat, {formatCents(board.seatPriceCents)}
            </button>
            <button
              type="button"
              onClick={() => takeSpot(MIN_BID_CENTS)}
              className="w-full border border-rule px-7 py-3 text-[14.5px] font-semibold tracking-[-0.01em] text-ink-soft transition-colors hover:border-ink hover:text-ink sm:w-auto"
            >
              Join the board for $1
            </button>
          </div>
        </div>

        <PowerupStrip />

        <section id="board" className="scroll-mt-20 pt-6">
          <div className="mb-4 text-center">
            <h2 className="ledger-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              <span className="whitespace-nowrap">The board</span>
            </h2>
            <div className="mt-2 text-[16px] font-semibold tracking-[-0.02em]">
              Everyone chasing the seat
              <span className="ml-2 font-normal text-ink-faint">
                <span className="num">{formatCount(board.stats.entryCount)}</span>{" "}
                {board.stats.entryCount === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>

          {chasers.length === 0 ? (
            <div className="border-y border-rule py-10 text-center text-[14px] text-ink-faint">
              {leader
                ? "Nobody is chasing yet. Second place costs $1."
                : "First place costs $1."}
            </div>
          ) : (
            <>
              {visible.map((row, index) => (
                <BoardEntry
                  key={row.id}
                  row={row}
                  position={index + 2}
                  index={index}
                  onTake={takeSpot}
                  dethroned={dropped.has(row.id)}
                />
              ))}
              {!showAll && chasers.length > 49 ? (
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
        </section>

        <section className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-ink/15 pt-8 md:grid-cols-2">
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

        <section id="reigns" className="mt-10 scroll-mt-20">
          <div className="mb-4 text-center">
            <h2 className="ledger-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              <span className="whitespace-nowrap">Longest reigns</span>
            </h2>
            <div className="mt-2 text-[13px] text-ink-soft">
              The one board you cannot buy outright
            </div>
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

      <BidDialog
        open={open}
        onClose={() => setOpen(false)}
        url={url}
        setUrl={setUrl}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        dollars={dollars}
        setDraft={setDraft}
        commitDraft={commitDraft}
        step={step}
        amount={amount}
        seatPriceCents={board.seatPriceCents}
        submitting={submitting}
        error={error}
        onSubmit={submit}
      />
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
  return <li className="py-2 text-[13px] text-ink-faint">{children}</li>;
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

function LiveStrip({ board }: { board: Board }) {
  const { online, visitorsTotal, paidToDateCents } = board.stats;
  return (
    <div className="border-b border-rule bg-panel">
      <div className="mx-auto flex min-h-[34px] max-w-[940px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-[6px] text-[12px] tracking-[0.01em] text-ink-soft sm:px-5 sm:text-[12.5px]">
        <span className="relative h-[6px] w-[6px] flex-none rounded-full bg-gain">
          <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
        </span>
        <span>
          <b className="num font-semibold text-ink">{formatCount(online)}</b>{" "}
          reading now
        </span>
        <span className="text-rule">·</span>
        <span>
          <b className="num font-semibold text-ink">
            {formatCount(visitorsTotal)}
          </b>{" "}
          visitors
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
