import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { isBlocked } from "@/lib/blocklist";
import { MAX_BID_CENTS, MIN_BID_CENTS } from "@/lib/money";
import { normalizeUrl } from "@/lib/normalize-url";
import { appUrl, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { url, amountCents } = (body ?? {}) as {
    url?: unknown;
    amountCents?: unknown;
  };

  if (typeof url !== "string") {
    return NextResponse.json({ error: "Enter a URL." }, { status: 400 });
  }

  const normalized = normalizeUrl(url);
  if (!normalized) {
    return NextResponse.json(
      { error: "That does not look like a URL." },
      { status: 400 },
    );
  }

  if (isBlocked(normalized)) {
    return NextResponse.json(
      { error: "That destination is not allowed." },
      { status: 400 },
    );
  }

  // The price is a server-side validated integer. Nothing price-shaped is
  // trusted off the client.
  const amount = Number(amountCents);
  if (
    !Number.isInteger(amount) ||
    amount < MIN_BID_CENTS ||
    amount > MAX_BID_CENTS
  ) {
    return NextResponse.json(
      { error: "Amount must be between $1 and $1,000." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          // Inline price_data, not a catalog Product. The amount is arbitrary
          // and changes with every bid, so a reusable Price makes no sense.
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `Rank bid: ${normalized}`,
              description:
                "Placement on cheapseat.lol. No refunds. You are buying a position on the page and nothing else.",
            },
          },
        },
      ],
      metadata: { url: normalized, amount_cents: String(amount) },
      payment_intent_data: { statement_descriptor_suffix: "CHEAPSEAT" },
      success_url: `${appUrl()}/?bid=success`,
      cancel_url: `${appUrl()}/`,
    }, { idempotencyKey: randomUUID() });

    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] failed", error);
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 500 },
    );
  }
}
