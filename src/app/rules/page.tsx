import type { Metadata } from "next";

import { Footer, Masthead } from "@/components/site";
import { Prose, Rule, Section } from "@/components/prose";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "There is no algorithm. Whoever has paid the most is first. That is the entire system.",
};

export default function RulesPage() {
  return (
    <>
      <Masthead />
      <Prose title="How this works">
        <p className="text-[17px] text-ink">
          There is no algorithm. Whoever has paid the most is first. That is the
          entire system.
        </p>

        <Rule />

        <Section title="Bids stack.">
          Every payment you make is added to your running total. If you get
          pushed down, you do not start over. You pay the difference.
        </Section>

        <Section title="One URL, one entry.">
          We normalize what you paste, so foo.com and https://www.foo.com/?ref=x
          are the same entry. An @handle is treated as your X profile.
        </Section>

        <Section title="Ties go to whoever got there first.">
          If you match the leader&apos;s total exactly, they keep the seat. To
          take it you have to exceed it.
        </Section>

        <Section title="The clock.">
          The moment you take first place, a timer starts. It runs until someone
          takes it from you. Your longest run is recorded on the reigns board,
          which is the one thing here you cannot buy outright.
        </Section>

        <Section title="Clicks are counted honestly.">
          Every click on your entry goes through our redirect and gets logged.
          We filter link previews and bots, and we count one click per person
          per hour. Your entry page shows your total clicks, your last 24 hours,
          and what you have paid per click. That last number is sometimes
          unflattering. We show it anyway.
        </Section>

        <Section title="Minimum bid is $1.">
          Maximum is $1,000 per transaction. Bid again to go higher.
        </Section>

        <Section title="No refunds.">
          You are buying a position on a page. That is what you get.
        </Section>
      </Prose>
      <Footer />
    </>
  );
}
