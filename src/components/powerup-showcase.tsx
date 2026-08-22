"use client";

import { POWERUP_LIST } from "@/lib/powerups";
import { formatCents } from "@/lib/money";
import { PowerupIcon } from "./powerup-icon";

/**
 * The loud part of the site. Everything else is a ledger, so this is where the
 * colour, the motion and the sell all live.
 */
export function PowerupShowcase({
  onPick,
}: {
  onPick?: (kind: string) => void;
}) {
  return (
    <section id="powerups" className="scroll-mt-24 pt-10">
      <div className="mb-5 text-center">
        <h2 className="ledger-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          <span className="whitespace-nowrap">Power-ups</span>
        </h2>
        <p className="mt-2 text-[clamp(19px,3vw,26px)] font-semibold tracking-[-0.025em]">
          Money buys a rank. These buy an advantage.
        </p>
        <p className="mx-auto mt-1 max-w-[52ch] text-[13.5px] text-ink-soft">
          Every one of them is visible on the board, so nobody has to take our
          word for what you bought.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        {POWERUP_LIST.map((p, i) => (
          <button
            key={p.kind}
            type="button"
            onClick={() => onPick?.(p.kind)}
            style={{ animationDelay: `${i * 70}ms` }}
            className="pu-pop-in group relative flex flex-col items-center overflow-hidden rounded-2xl border bg-panel p-3 text-center transition-all duration-200 hover:-translate-y-1 sm:p-5"
          >
            {/* The card's own colour, held to a wash so the page stays calm. */}
            <span
              aria-hidden="true"
              className="pu-glow pointer-events-none absolute -top-10 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl"
              style={{ background: p.accent }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl border transition-colors duration-200"
              style={{ borderColor: `${p.accent}33` }}
            />

            <span
              className="pu-float relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-200 group-hover:scale-110 sm:h-14 sm:w-14"
              style={{
                background: `linear-gradient(140deg, ${p.accent}, ${p.accentTo})`,
                boxShadow: `0 8px 20px -8px ${p.accent}`,
              }}
            >
              <PowerupIcon kind={p.kind} size={24} />
            </span>

            <span
              className="relative mt-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: p.accent }}
            >
              {p.hook}
            </span>
            <h3 className="relative mt-[2px] text-[15px] font-semibold tracking-[-0.015em]">
              {p.name}
            </h3>
            <p className="relative mt-1 text-[11.5px] leading-[1.4] text-ink-soft sm:text-[12.5px] sm:leading-[1.45]">
              {p.tease}
              <span className="hidden sm:inline"> {p.blurb}</span>
            </p>

            <span
              className="relative mt-3 flex w-full items-center justify-center rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-transform duration-200 group-active:scale-95"
              style={{
                background: `linear-gradient(120deg, ${p.accent}, ${p.accentTo})`,
              }}
            >
              Add for {formatCents(p.priceCents)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
