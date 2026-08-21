import type { Metadata } from "next";

import { Footer, Masthead } from "@/components/site";
import { WallGrid } from "@/components/wall-grid";
import { getBoardSafe } from "@/lib/leaderboard";
import { formatCount } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Wall",
  description:
    "Everyone who has ever held the top seat. A rank can be bought back tomorrow. A plate on this wall cannot be taken down.",
};

export default async function WallPage() {
  const board = await getBoardSafe();

  return (
    <>
      <Masthead />
      <main className="mx-auto max-w-[940px] px-4 pb-4 pt-8 sm:px-5">
        <div className="mb-7 text-center">
          <h1 className="ledger-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            <span className="whitespace-nowrap">The Wall</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-[clamp(20px,3.4vw,28px)] font-semibold leading-[1.15] tracking-[-0.03em]">
            Everyone who has ever held the seat.
          </p>
          <p className="mx-auto mt-3 max-w-[52ch] text-[14px] leading-[1.5] text-ink-soft">
            A rank can be taken back tomorrow. A plate here cannot. Reach number
            one for one minute and your name is on this page for as long as the
            site exists, in the order you got there.
          </p>
          {board.wall.length > 0 ? (
            <p className="mt-3 text-[12.5px] text-ink-faint">
              <span className="num">{formatCount(board.wall.length)}</span>{" "}
              {board.wall.length === 1 ? "name" : "names"} so far
            </p>
          ) : null}
        </div>

        <WallGrid entries={board.wall} seatPriceCents={board.seatPriceCents} />
      </main>
      <Footer />
    </>
  );
}
