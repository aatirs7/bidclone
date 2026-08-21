import type { Metadata } from "next";

import { Footer, Masthead } from "@/components/site";
import { Prose, Section } from "@/components/prose";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "What you are buying, and everything that is not included. Payments are final.",
};

export default function TermsPage() {
  const contact = process.env.NEXT_PUBLIC_REPORT_EMAIL ?? "reports@cheapseat.lol";

  return (
    <>
      <Masthead />
      <Prose title="Terms">
        <p>Short version, and it is the operative one.</p>

        <Section title="What you are buying.">
          A position on a public list, ranked by how much you have paid. Nothing
          else. No traffic guarantee, no placement duration, no endorsement.
        </Section>

        <Section title="No refunds.">
          Payments are final. This includes being outbid one minute later,
          traffic that disappoints you, and changing your mind. Bid what you are
          comfortable never seeing again.
        </Section>

        <Section title="We can remove entries.">
          We hide anything illegal, sexual, hateful, deceptive, or malicious, at
          our discretion and without notice. Removal does not come with a
          refund.
        </Section>

        <Section title="Links are nofollow.">
          These placements pass no SEO value and are not sold as backlinks.
        </Section>

        <Section title="Listings are advertisements.">
          Every entry on this site is paid. Nothing on the board is a
          recommendation, a review, or a judgment of quality.
        </Section>

        <Section title="Click counts.">
          We report them as accurately as we can, with bot filtering and hourly
          deduplication. We do not guarantee they match your own analytics,
          because no two systems count the same way.
        </Section>

        <Section title="The site may stop.">
          This is a small project. If it is taken down, entries and rankings go
          with it. No compensation.
        </Section>

        <Section title="Disputes.">
          Email first. Chargebacks get the entry removed permanently and the
          total forfeited.
        </Section>

        <p>
          Contact:{" "}
          <a href={`mailto:${contact}`} className="text-ink underline">
            {contact}
          </a>
        </p>
      </Prose>
      <Footer />
    </>
  );
}
