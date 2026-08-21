# cheapseat.lol handoff

Everything another engineer or agent needs to continue this build. Read this
before touching anything.

---

## 1. What this is

A public leaderboard where the top spot is bought outright. Pay more than the
entry above you and take its place. Three mechanics carry the product:

1. **Bids stack.** Every payment adds to a lifetime total. Being pushed down
   does not reset you, so one purchase becomes a defense loop. This is the
   business.
2. **The reign clock.** Time held at #1 is tracked and displayed live. A total
   is a number you paid once; a reign is something being taken from you while
   you watch.
3. **Public click data.** Every outbound link is counted and cost per click is
   published, flattering or not. This reframes the purchase from a joke into
   ad spend.

Identity is the normalized URL. There is no auth and there are no accounts.

---

## 2. Standing rules

These are not preferences. Violating them breaks the product.

- **No em dashes** anywhere in code, copy, or comments.
- **No cron jobs.** Reign accounting happens inside the Stripe webhook
  transaction so the clock is correct the instant the board changes.
- **The server validates every amount.** A client supplied price is never
  trusted.
- **Use the pooled Neon connection string** (host contains `-pooler`). The
  direct string exhausts connections under load and is the most common way this
  stack falls over during a spike.
- **Never fabricate totals or click counts** on production. The entire
  positioning is that these numbers are the honest ones.
- **`total_cents` is written only by the Stripe webhook**, and only as a
  recomputed `SUM` over `bids`.

---

## 3. Current state

| Area | Status |
| --- | --- |
| Schema and migrations | Done, applied to Neon |
| URL normalization plus tests | Done, 6 tests passing |
| Stripe checkout route | Done |
| Stripe webhook including reign handoff | Done, **never exercised by a real payment** |
| `/go/[id]` click redirect | Done |
| Board UI | Done, ledger design |
| Reign clock and seat change flash | Done |
| `/e/[id]` entry pages | Done |
| `/admin`, `/rules`, `/terms` | Done |
| Dynamic OG image | Done |
| Live at | https://cheapseat.lol |

**Not yet verified:** no real payment has been put through, so the webhook path
is proven only by construction and unit level reasoning. This is the single
highest priority item. See section 8.

**Not yet verified:** mobile layout has not been visually confirmed on a real
device. The responsive rules exist (CPC, Held and Take collapse below the `md`
breakpoint, leaving rank, entry, clicks and total) but nobody has looked at it
on a phone. Most traffic will arrive from a phone.

---

## 4. Stack and infrastructure

Next.js App Router (Next 16), TypeScript, Tailwind v4, Neon Postgres, Drizzle
ORM, Stripe Checkout, Vercel.

- **Vercel project:** `dethrone` under `aatir-siddiquis-projects`, connected to
  the GitHub repo. Pushing to `main` deploys.
- **Domains:** `cheapseat.lol` and `www.cheapseat.lol` point at the project.
  There is also a `dethone.lol` on the account, one letter off from a taken
  competitor domain. It should be retired, not used.
- **Neon:** provisioned through the Vercel marketplace integration. Two
  databases on the same project:
  - `neondb` is **production**. Real data only.
  - `cheapseat_dev` is **local development**. Sample data lives here so nothing
    fabricated can ever surface on the live site.
- **Stripe:** live mode. A webhook endpoint is registered against
  `https://cheapseat.lol/api/stripe/webhook` for `checkout.session.completed`.

### Environment

`.env.local` drives local work and points at `cheapseat_dev`. It also keeps
`DATABASE_URL_PRODUCTION` for reference. Production values are set in Vercel:
`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_APP_URL`, `ADMIN_SECRET`, `CLICK_SALT`,
`NEXT_PUBLIC_REPORT_EMAIL`.

---

## 5. Commands

```bash
npm run dev                        # local, against cheapseat_dev
npm test                           # URL normalization, blocklist, arithmetic
npm run build                      # must pass clean
npx eslint src --max-warnings 0    # must pass clean

npm run db:generate                # after any schema change
npm run db:migrate

npx tsx scripts/seed-preview.ts           # fill cheapseat_dev with samples
npx tsx scripts/seed-preview.ts --clear   # empty it
```

The seed script refuses to run unless `DATABASE_URL` contains `cheapseat_dev`.
Do not weaken that guard.

---

## 6. Architecture, and why

### The money path

`checkout.session.completed` is the only place an entry is created or a total
changes. Inside one transaction:

1. Upsert the entry on its normalized URL.
2. Insert the bid, guarded by a unique index on `stripe_session_id`. A replayed
   webhook inserts nothing.
3. Recompute `total_cents` as a `SUM` over `bids`. Never increment. Even if the
   conflict guard were bypassed, a replay could not double count.
4. Settle the seat: if the leader changed, close the outgoing reign, add the
   elapsed seconds to `longest_reign_seconds`, and start the new leader's clock.
5. Snapshot `rank_after` and, when a seat changed hands, `took_seat_from` and
   `displaced_reign_seconds` onto the bid, so the activity feed reports what was
   true at the time rather than recomputing a rank that has since moved.

The signature is verified against the **raw request body** (`await req.text()`).
Verifying against parsed JSON is the most common reason bids get paid for and
never appear on the board, and it fails silently.

Metadata fetch for a new URL runs in `after()`, outside the response, with a 3
second timeout. It can never fail the webhook.

`settleSeat()` in `src/lib/seat.ts` is shared with the admin hide route, so
hiding the current leader passes the seat on immediately rather than leaving a
clock running on an invisible row.

### Click tracking

`/go/[id]` redirects first and counts after via `after()`, so the visitor never
waits on a write. A unique index on `(entry_id, visitor_hash, hour_bucket)`
enforces one click per person per hour. The counter increment is inside the same
statement as the insert, via a CTE, so it only fires when a row was actually
inserted. Refreshers cannot inflate it.

Bot filtering by user agent matters more than it looks. X, Slack, Discord and
iMessage all prefetch links; on a viral post that is thousands of phantom
clicks, and obviously inflated counts would destroy the credibility of the only
number people are paying for.

`visitor_hash` is `sha256(ip + user agent + CLICK_SALT)` truncated to 32 chars.
It cannot be reversed to an IP.

### Load behavior

The board query is cached 5 seconds per instance with an in flight collapse, so
concurrent misses share one query. Clicks per hour and the visitor stats are
cached 60 and 30 seconds. `/api/leaderboard` also sets
`s-maxage=5, stale-while-revalidate=10` so the CDN absorbs most polling. Clients
poll every 10 seconds and pause while the tab is hidden.

### Design

The visual register is a trading floor in daylight: institutional, numerate,
straight faced, with the absurdity carried entirely by the copy. The board is a
ledger, not a stack of cards, which is what separates it from the competing
boards on this trend.

Palette is exactly four colors and nothing else ever gets one:

| Token | Hex | Used for |
| --- | --- | --- |
| ground | `#F3F4F1` | cool limestone background |
| ink | `#15171A` | text |
| gain | `#0B7A4B` | currency and upward movement only |
| drop | `#B23A2F` | a position dropping only |

Type is Instrument Sans for the interface and IBM Plex Mono for every number.
Tabular figures are mandatory, otherwise totals jitter horizontally as they tick
and the page feels cheap. Ranks are set `01`, `02` so the column holds steady.

The signature moment: when a position changes while you are watching, the
displaced row flashes red and the new leader counts up to its total. Everything
else holds still. Gated behind `prefers-reduced-motion`.

---

## 7. Layout of the code

```
src/db/schema.ts          entries, bids, clicks, visits
src/db/index.ts           lazy pooled Neon client
src/lib/normalize-url.ts  identity, the thing most likely to corrupt data
src/lib/seat.ts           reign settlement and ranking
src/lib/leaderboard.ts    all board queries, with TTL caches
src/lib/blocklist.ts      domains and substrings
src/lib/metadata.ts       og:title, og:description, favicon
src/lib/money.ts          formatting and cost to pass arithmetic
src/lib/admin.ts          constant time secret check
src/middleware.ts         moves the admin key out of the URL into a cookie
src/components/row.tsx    the ledger grid, shared by header and rows
src/components/live-board.tsx  polling, seat change diff, hero, panels
scripts/seed-preview.ts   dev only sample data
```

### Two traps already hit, do not reintroduce

- **A Server Component cannot set a cookie.** The admin key handoff lives in
  `src/middleware.ts` for this reason.
- **Middleware runs on the edge runtime and cannot import `node:crypto`.** The
  cookie name is isolated in `src/lib/admin-cookie.ts` so middleware never pulls
  in `src/lib/admin.ts`.

---

## 8. What to do next, in order

1. **Prove the webhook with one real $1 payment on production.** Nothing else
   matters until this passes. Confirm the entry appears with the right total,
   then resend the same event from the Stripe dashboard and confirm the total
   does **not** double.
2. **Check the board on a real phone.** Most traffic arrives from a phone.
3. **Populate the blocklist** beyond the starter list in `src/lib/blocklist.ts`.
   Within an hour of any traction someone will submit a porn link, a scam, or a
   slur.
4. **Seed 5 to 8 real entries at real amounts** using your own projects. An
   empty board converts nobody. Real payments only.
5. **Check the OG image** in the X card validator.
6. Confirm `/admin` works in production and that you can hide an entry.

---

## 9. Known risks

- **Stripe account.** This runs on an existing activated account that carries
  other business activity. A novelty site taking many small card payments with
  no shipped product is a pattern Stripe's risk team recognizes, and a freeze
  would affect everything on that account, not just this site. The mitigations
  in place are an unambiguous no refunds notice above the pay button, a
  `CHEAPSEAT` statement descriptor, and a real terms page. Expect chargebacks
  and price them in.
- **Per payment cap.** A single payment is capped at $1,000 while the seat can
  cost far more. The UI states this and tells the bidder to pay more than once,
  since the total is what counts. If this proves to be a conversion problem,
  raising `MAX_BID_CENTS` in `src/lib/money.ts` is the lever.
- **`longest_reign_seconds` accumulates** total time held across every stint,
  per the spec's explicit wording, even though the column name and the "Longest
  reigns" board both read as a single best stint. Individual stint lengths are
  recorded on the bid that ended them. If you want the best single reign
  instead, change the `+` to `greatest()` in `src/lib/seat.ts`.
- **Visitor stats are self hosted**, not from a third party analytics product,
  because the numbers are displayed publicly and have to be defensible. A
  heartbeat writes one `visits` row per visitor per minute.

---

## 10. Out of scope

Accounts, categories, per vertical boards, refunds, bid history charts, email
notifications, a public API, and anything involving crypto. If the thing works
there will be time to add them. If it does not, none of them would have saved it.
