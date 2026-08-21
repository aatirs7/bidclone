# dethrone.lol

A public leaderboard where the top spot is bought outright. Bids stack, clicks
are public, and first place has a clock on it.

Built from `dethrone.md`. Visual target is `dethrone-mockup.html`.

## Stack

Next.js App Router, TypeScript, Tailwind v4, Neon Postgres, Drizzle ORM, Stripe
Checkout, Vercel. No auth. Identity is the normalized URL.

## Standing rules

- No em dashes anywhere in code, copy, or comments.
- No cron jobs. Reign accounting happens inside the Stripe webhook transaction.
- The server validates every amount. A client supplied price is never trusted.
- Use the pooled Neon connection string, not the direct one.

## Local setup

```bash
npm install
npm run db:migrate        # already applied against the linked Neon project
npm run dev
```

Environment lives in `.env.local`. `DATABASE_URL` and the rest of the Neon vars
were provisioned through the Vercel marketplace integration and are already
pooled. Two values still need filling in:

| Variable                | Where it comes from                                        |
| ----------------------- | ---------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe dashboard, API keys, "Powering an integration you built" |
| `STRIPE_WEBHOOK_SECRET` | Printed by `npm run stripe:listen`                          |

## Stripe

No Products and no Prices. The amount is arbitrary and changes every bid, so
checkout uses inline `price_data`.

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints whsec_...
stripe trigger checkout.session.completed                      # test without spending
```

Production endpoint, from the terminal:

```bash
stripe webhook_endpoints create \
  --url https://dethrone.lol/api/stripe/webhook \
  --enabled-events checkout.session.completed
```

Account activation cannot be done from the CLI. Stripe needs business details, a
bank account, and identity verification through the dashboard before live
payments work.

## How the money path holds together

`checkout.session.completed` is the only place an entry is created or a total
changes. Three guarantees, all inside one transaction:

1. `bids.stripe_session_id` is unique, so a replayed webhook inserts nothing.
2. `entries.total_cents` is recomputed as a `SUM` over `bids`, never
   incremented, so even a bypassed conflict guard cannot double count.
3. The seat is settled in the same transaction as the total, so the reign clock
   is correct the instant the board changes.

The signature is verified against the raw request body. Verifying against parsed
JSON is the most common reason bids get paid for and never appear on the board,
and it fails silently.

## Click tracking

Every outbound link goes through `/go/[id]`, which redirects first and counts
after via `after()`. A unique index on `(entry_id, visitor_hash, hour_bucket)`
counts one click per person per hour, and the counter increment sits inside the
conflict guard so refreshers cannot inflate it. Link previews from X, Slack,
Discord and iMessage are filtered by user agent.

`visitor_hash` is `sha256(ip + user agent + CLICK_SALT)`, truncated. It cannot be
reversed to an IP.

## Tests

```bash
npm test
```

Covers URL normalization, which is the thing most likely to silently corrupt
data, plus the blocklist and the cost to pass arithmetic.

## Routes

| Route                  | What it is                              |
| ---------------------- | --------------------------------------- |
| `/`                    | The entire product                      |
| `/e/[id]`              | Entry page with click data and CPC      |
| `/go/[id]`             | Counted redirect                        |
| `/rules`, `/terms`     | Copy                                    |
| `/admin?key=...`       | Moderation table, gated by `ADMIN_SECRET` |
| `/api/checkout`        | Creates a Stripe Checkout session       |
| `/api/stripe/webhook`  | The only writer of totals               |
| `/api/leaderboard`     | Polled every 10s, cached 5s             |
| `/api/pulse`           | Presence heartbeat                      |

## Before launch

- [ ] Stripe account activated, separate from Elysium Ventures
- [ ] `stripe trigger checkout.session.completed` passes against local webhook
- [ ] One real $1 payment end to end on production
- [ ] Blocklist populated beyond the starter list in `src/lib/blocklist.ts`
- [ ] Board seeded with 5 to 8 real entries at real amounts
- [ ] OG image checked in the X card validator
- [ ] Follow-up post templates queued

Do not fabricate totals or click counts. The whole positioning is that these
numbers are the honest ones.
