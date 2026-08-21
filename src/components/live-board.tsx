"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Board } from "@/lib/leaderboard";
import {
  MAX_BID_CENTS,
  MIN_BID_CENTS,
  formatCents,
  formatCount,
} from "@/lib/money";
import { formatAgo, formatDuration } from "@/lib/time";
import { normalizeUrl } from "@/lib/normalize-url";
import { ordinal } from "@/lib/ordinal";
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
  // stepper or takes a spot, their number wins.
  const [override, setOverride] = useState<number | null>(null);
  // Set while the visitor is typing, so the field does not fight them by
  // reformatting mid keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const [leadChanged, setLeadChanged] = useState(false);
  const [powerupsOpen, setPowerupsOpen] = useState(false);

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

  // Sets the amount and puts the cursor where the visitor has to type. There is
  // no dialog: the next click after this goes straight to Stripe.
  const takeSpot = useCallback((cents: number) => {
    setOverride(clampBid(cents));
    // Focus first and inside the click gesture, otherwise iOS refuses to raise
    // the keyboard. The scroll follows, and must not fight the focus.
    urlRef.current?.focus({ preventScroll: true });
    urlRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

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

  /**
   * Which seat this amount buys for somebody not yet on the board. The
   * headline names it, so lowering the bid tells you what you are settling
   * for rather than leaving you to work it out.
   */
  const seatForAmount = useMemo(() => {
    let ahead = 0;
    // A tie leaves the incumbent in place, so an equal total sits behind.
    for (const row of board.rows) if (row.totalCents >= amount) ahead += 1;
    return ahead + 1;
  }, [amount, board.rows]);

  /**
   * What this bid actually buys, worked out on the client from the same rules
   * the server uses. Bids stack, and a tie leaves the incumbent in place, so
   * an equal total sits behind rather than level.
   */
  const preview = useMemo(() => {
    const normalized = normalizeUrl(url);
    if (!normalized) return null;

    const existingIndex = board.rows.findIndex((r) => r.url === normalized);
    const existing = existingIndex >= 0 ? board.rows[existingIndex] : null;
    const newTotal = (existing?.totalCents ?? 0) + amount;

    let ahead = 0;
    for (const row of board.rows) {
      if (existing && row.id === existing.id) continue;
      if (row.totalCents >= newTotal) ahead += 1;
    }

    return {
      rank: ahead + 1,
      newTotal,
      currentRank: existing ? existingIndex + 1 : null,
      name: existing?.displayName ?? normalized,
    };
  }, [url, amount, board.rows]);

  const leader = board.rows[0] ?? null;
  // Rank 01 lives in the showcase, so the board lists the challengers.
  const chasers = board.rows.slice(1);
  const visible = showAll ? chasers : chasers.slice(0, 49);

  return (
    <main className="mx-auto max-w-[940px] px-4 sm:px-5">
      <LivePill board={board} />

      <section className="pt-5 text-center sm:pt-6">
        <h1 className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[clamp(24px,3.6vw,34px)] font-semibold tracking-[-0.035em]">
          <span>
            {seatForAmount === 1
              ? "Take the top seat for"
              : `Take the ${ordinal(seatForAmount)} seat for`}
          </span>
          <span className="flex items-center gap-2 sm:gap-3">
            <Stepper label="Lower amount" onClick={() => step(-1)}>
              &minus;
            </Stepper>
            <span className="num flex items-baseline text-[clamp(28px,4.6vw,42px)] font-semibold tracking-[-0.04em] text-gain">
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
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-[600px] text-[13.5px] leading-[1.45] text-ink-soft">
          <b className="font-semibold text-gain">New seats start at $1.</b>{" "}
          Paying less than the leader still puts you on the board, at whatever
          seat that bid can take. Every bid stays on your name.
        </p>

        <form
          onSubmit={submit}
          className="mx-auto mt-4 flex max-w-[620px] flex-col gap-[10px] sm:flex-row"
        >
          <label className="flex h-[48px] flex-1 items-center gap-[10px] rounded-full border border-rule bg-panel px-5 transition-colors focus-within:border-ink focus-within:ring-2 focus-within:ring-gain/40">
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
              className="field-input h-full w-full border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="h-[48px] flex-none rounded-full bg-ink px-8 text-[15px] font-semibold tracking-[-0.01em] text-ground transition-all hover:bg-gain active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Opening checkout" : "Place bid"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 text-[13px] text-drop" role="alert">
            {error}
          </p>
        ) : null}

        {preview ? (
          <div className="mx-auto mt-3 flex max-w-[620px] flex-col items-center gap-1 rounded-xl border border-gain/25 bg-gain-wash px-4 py-[10px] text-[13px]">
            <p>
              {preview.currentRank ? (
                <>
                  <b className="font-semibold">{preview.name}</b> is already at{" "}
                  <span className="num">#{preview.currentRank}</span>. Adding{" "}
                  <span className="num text-gain">{formatCents(amount)}</span>{" "}
                  takes it to{" "}
                  <span className="num font-semibold text-gain">
                    #{preview.rank}
                  </span>{" "}
                  on{" "}
                  <span className="num">{formatCents(preview.newTotal)}</span>{" "}
                  total.
                </>
              ) : (
                <>
                  This puts you at{" "}
                  <span className="num font-semibold text-gain">
                    #{preview.rank}
                  </span>{" "}
                  of {formatCount(board.stats.entryCount + 1)}.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setPowerupsOpen(true);
                // There are two strips, one per breakpoint. Scroll to whichever
                // is actually rendered rather than to a duplicated id.
                const visible = Array.from(
                  document.querySelectorAll<HTMLElement>("[data-powerups]"),
                ).find((el) => el.offsetParent !== null);
                visible?.scrollIntoView({ block: "center", behavior: "smooth" });
              }}
              className="text-[12px] text-ink-soft underline decoration-dotted underline-offset-2 transition-colors hover:text-ink"
            >
              Want an edge as well? See power-ups
            </button>
          </div>
        ) : null}

        <p className="mt-[10px] text-[12px] text-ink-faint">
          Already listed? Enter the same URL and your bids stack. One time
          payment, no refunds, and your name and icon come from your own site.
        </p>
      </section>

      {leader ? (
        <div className="pt-5">
          <Champion row={leader} onTake={takeSpot} animate={leadChanged} />
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-rule bg-panel p-10 text-center">
          <p className="text-[clamp(21px,5vw,32px)] font-semibold tracking-[-0.03em]">
            The seat is empty.
            <br className="sm:hidden" /> Be number one here for $1.
          </p>
        </div>
      )}

      <div data-powerups className="hidden scroll-mt-24 md:block">
        <PowerupStrip open={powerupsOpen} onOpenChange={setPowerupsOpen} />
      </div>

      <section id="board" className="scroll-mt-20 pt-6">
        <h2 className="ledger-heading mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          <span className="whitespace-nowrap">
            The board{" "}
            <span className="num text-ink-faint">
              {formatCount(board.stats.entryCount)}
            </span>{" "}
            {board.stats.entryCount === 1 ? "entry" : "entries"}
          </span>
        </h2>

        {chasers.length === 0 ? (
          <div className="rounded-2xl border border-rule bg-panel py-10 text-center text-[14px] text-ink-faint">
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
                className="mt-4 w-full rounded-full border border-rule py-3 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Show all {formatCount(board.rows.length)} entries
              </button>
            ) : null}
          </>
        )}
      </section>

      <div data-powerups className="mt-8 scroll-mt-24 md:hidden">
        <PowerupStrip open={powerupsOpen} onOpenChange={setPowerupsOpen} />
      </div>

      <section className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-rule pt-8 md:grid-cols-2">
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
                <span className="truncate font-medium">{item.displayName}</span>
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

      <section id="reigns" className="mt-11 scroll-mt-20">
        <div className="mb-4 text-center">
          <h2 className="ledger-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            <span className="whitespace-nowrap">Longest reigns</span>
          </h2>
          <div className="mt-2 text-[13px] text-ink-soft">
            The one board you cannot buy outright
          </div>
        </div>
        <ul className="rounded-2xl border border-rule bg-panel px-4 py-2">
          {board.reigns.length === 0 ? (
            <Quiet>Nobody has held the seat long enough to record one.</Quiet>
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
      </section>
    </main>
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
      <h2 className="mb-2 border-b border-rule pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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
  if (!src) return <span className="h-5 w-5 flex-none rounded-md bg-rule" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-5 w-5 flex-none rounded-md bg-rule object-cover"
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
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-rule bg-panel text-[18px] leading-none text-ink-soft transition-all hover:border-ink hover:text-ink active:scale-95"
    >
      {children}
    </button>
  );
}

/** A pill, not a full width bar. These stats are a badge, not a system banner. */
function LivePill({ board }: { board: Board }) {
  const { online, visitorsTotal, paidToDateCents } = board.stats;
  return (
    <div className="flex justify-center pt-3">
      <div className="lift flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-rule bg-panel px-4 py-[7px] text-[12.5px] text-ink-soft">
        <span className="relative h-[6px] w-[6px] flex-none rounded-full bg-gain">
          <span className="pulse-ring absolute -inset-[3px] rounded-full bg-gain opacity-25" />
        </span>
        <span>
          <b className="num font-semibold text-gain">{formatCount(online)}</b>{" "}
          online
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
