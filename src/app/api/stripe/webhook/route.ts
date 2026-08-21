import { after } from "next/server";
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/db";
import { bids, entries, powerups } from "@/db/schema";
import { isBlocked } from "@/lib/blocklist";
import { fetchMetadata } from "@/lib/metadata";
import {
  displayNameFor,
  normalizeLogoUrl,
  normalizeUrl,
} from "@/lib/normalize-url";
import { rankOf, settleSeat } from "@/lib/seat";
import { POWERUPS, isPowerupKind } from "@/lib/powerups";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The only place an entry is created or a total is changed. */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // The RAW body. Parsing to JSON first breaks the signature check, and it
    // fails silently: bids get paid for and never appear on the board.
    const raw = await req.text();
    event = stripe().webhooks.constructEvent(
      raw,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("[webhook] signature verification failed", error);
    return new Response("Invalid signature.", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("Ignored.", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return new Response("Unpaid.", { status: 200 });
  }

  // Re-normalize rather than trusting what came back from Stripe, and re-check
  // the blocklist in case it grew between checkout and payment.
  const url = normalizeUrl(session.metadata?.url ?? "");
  const paid = session.amount_total ?? 0;
  const logoUrl = normalizeLogoUrl(session.metadata?.logo_url);

  // Power-ups ride in the same session, so the amount paid is not the bid.
  // The bid is what is left after their catalog prices, derived from money
  // actually received rather than from metadata, which cannot be trusted.
  const chosen = (session.metadata?.powerups ?? "")
    .split(",")
    .filter(isPowerupKind);
  const powerupTotal = chosen.reduce(
    (sum, kind) => sum + POWERUPS[kind].priceCents,
    0,
  );
  const amount = paid - powerupTotal;

  if (!url || isBlocked(url) || amount <= 0) {
    console.warn("[webhook] dropping session", session.id, url, amount);
    return new Response("Dropped.", { status: 200 });
  }

  try {
    const outcome = await db.transaction(async (tx) => {
      const now = new Date();

      const [entry] = await tx
        .insert(entries)
        .values({
          url,
          displayName: displayNameFor(url),
          logoUrl,
          firstBidAt: now,
          lastBidAt: now,
        })
        .onConflictDoUpdate({
          target: entries.url,
          // A bidder who supplies a logo replaces whatever was there. Omitting
          // it leaves the existing mark alone.
          set: logoUrl ? { lastBidAt: now, logoUrl } : { lastBidAt: now },
        })
        .returning({ id: entries.id, faviconUrl: entries.faviconUrl });

      const [bid] = await tx
        .insert(bids)
        .values({
          entryId: entry.id,
          amountCents: amount,
          stripeSessionId: session.id,
        })
        // A replayed webhook conflicts here and inserts nothing.
        .onConflictDoNothing({ target: bids.stripeSessionId })
        .returning({ id: bids.id });

      // Recomputed as a sum, never incremented, so a replay cannot double count
      // even if the conflict guard above were somehow bypassed.
      await tx
        .update(entries)
        .set({
          totalCents: sql`(select coalesce(sum(${bids.amountCents}), 0)::int from ${bids} where ${bids.entryId} = ${entry.id})`,
        })
        .where(eq(entries.id, entry.id));

      // Same transaction as the total. The clock has to be right the instant
      // the board changes.
      const seat = await settleSeat(tx);

      if (bid) {
        const rank = await rankOf(tx, entry.id);
        await tx
          .update(bids)
          .set({
            rankAfter: rank,
            tookSeatFrom:
              seat.changed && seat.newLeaderId === entry.id
                ? seat.previousLeaderId
                : null,
            displacedReignSeconds:
              seat.changed && seat.newLeaderId === entry.id
                ? seat.displacedReignSeconds
                : null,
          })
          .where(eq(bids.id, bid.id));
      }

      // Power-ups are keyed on the session id plus the kind, so a replayed
      // webhook conflicts here exactly as the bid does.
      if (chosen.length > 0) {
        const now2 = Date.now();
        await tx
          .insert(powerups)
          .values(
            chosen.map((kind) => ({
              entryId: entry.id,
              kind,
              amountCents: POWERUPS[kind].priceCents,
              stripeSessionId: `${session.id}:${kind}`,
              expiresAt: POWERUPS[kind].durationMs
                ? new Date(now2 + POWERUPS[kind].durationMs)
                : null,
            })),
          )
          .onConflictDoNothing({ target: powerups.stripeSessionId });
      }

      return { entryId: entry.id, needsMetadata: !entry.faviconUrl };
    });

    // First bid for this URL: go get its real name and icon. Best effort, after
    // the response, and it can never fail the webhook.
    if (outcome.needsMetadata) {
      after(async () => {
        try {
          const meta = await fetchMetadata(url);
          await db
            .update(entries)
            .set({
              displayName: meta.displayName,
              tagline: meta.tagline,
              faviconUrl: meta.faviconUrl,
            })
            .where(eq(entries.id, outcome.entryId));
        } catch (error) {
          console.error("[webhook] metadata fetch failed", url, error);
        }
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    // A real failure: let Stripe retry. Every step above is idempotent.
    console.error("[webhook] processing failed", session.id, error);
    return new Response("Processing error.", { status: 500 });
  }
}
