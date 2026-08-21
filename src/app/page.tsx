import { LiveBoard } from "@/components/live-board";
import { Footer, Masthead } from "@/components/site";
import { getBoardSafe } from "@/lib/leaderboard";

// Rendered fresh, then kept alive by the client polling every 10 seconds.
export const dynamic = "force-dynamic";

export default async function Home() {
  const board = await getBoardSafe();

  return (
    <>
      <Masthead />
      <LiveBoard initial={board} />
      <Footer />
    </>
  );
}
