# Tripmate

Tripmate is an AI travel-planning web app built with Next.js App Router, TypeScript, Tailwind, Prisma, PostgreSQL, NextAuth v5, Stripe, Resend, and the Vercel AI SDK. It generates trip bundles (flights + hotel) scored against user preferences, authorizes payment with Stripe manual capture, and only confirms a booking when a real provider returns a fulfilment reference.

The project is deliberately honest about integration boundaries: where a provider is real, Tripmate marks the booking `CONFIRMED`; where the provider is mocked, it marks it `PENDING_FULFILLMENT` with no confirmation number. It never presents a fabricated confirmation number as a real booking.

## What is real vs. what is honest-mock

| Subsystem             | Behavior                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Auth                  | Real. NextAuth v5 + Prisma Adapter, bcrypt credentials with lazy scrypt migration, Google OAuth, JWT sessions.                      |
| Payments              | Real Stripe. Payment is **authorized** (manual capture), captured on provider success, **voided** on provider failure.              |
| Flight / hotel search | Amadeus Self-Service when `AMADEUS_*` is set. Otherwise deterministic mock providers. UI flags mock data.                           |
| Booking fulfilment    | Only marked `CONFIRMED` when provider returns a non-mock reference. Otherwise `PENDING_FULFILLMENT` with no confirmation number.    |
| AI chat               | Real. Vercel AI SDK with Anthropic (preferred) or OpenAI. Streams responses. Falls back to deterministic replies without API keys.  |
| Email                 | Real. Resend. Without `RESEND_API_KEY`, emails are logged to stdout for local dev.                                                  |
| Reminders             | Real. Vercel cron → `/api/cron/reminders`. Idempotent dispatch with per-kind offsets.                                               |
| Shareable itineraries | Real. Signed tokens, soft-revokable, 30-day expiry by default. Public page strips PII (passport numbers, card info, email, phone). |

## Stack

- Next.js 14 (App Router) + React 18
- TypeScript strict, Tailwind CSS 3, shadcn-style UI primitives
- Prisma ORM + PostgreSQL
- NextAuth v5 (`next-auth@beta`) + `@auth/prisma-adapter`
- Stripe (server SDK `stripe`, browser `@stripe/stripe-js` + `@stripe/react-stripe-js`)
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- Resend
- Zod validation, React Hook Form

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in values. You will need:

- A Postgres database (`DATABASE_URL`).
- `AUTH_SECRET` (generate with `openssl rand -base64 32`).
- `CRON_SECRET` (generate with `openssl rand -hex 32`).

Everything else is optional for local dev — missing credentials downgrade the corresponding feature instead of crashing. See the "Optional integrations" section below.

### 3. Database

```bash
npx prisma migrate deploy   # or `npm run db:migrate` during schema dev
npm run db:seed
```

The seed creates a demo user — `demo@tripmate.app` / `Tripmate123!` (bcrypt hashed) — plus a confirmed Tokyo trip.

### 4. Run

```bash
npm run dev
```

Tripmate runs at http://localhost:3000.

## Optional integrations

### Google OAuth

1. Create an OAuth 2.0 Web Client at https://console.cloud.google.com/apis/credentials.
2. Authorized redirect URI: `${AUTH_URL}/api/auth/callback/google`.
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
4. The "Sign in with Google" button only renders in the UI when both values are set.

### Stripe

1. Create a Stripe account and grab test keys from https://dashboard.stripe.com/test/apikeys.
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Start the Stripe CLI locally and forward webhooks:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`.
4. In production, register the webhook endpoint `${AUTH_URL}/api/stripe/webhook` and listen for:
   - `payment_intent.succeeded`
   - `payment_intent.canceled`
   - `payment_intent.payment_failed`
   - `payment_intent.amount_capturable_updated`

Bookings use **manual capture**: the card is authorized when the user approves a quote, captured on real provider confirmation, and voided if the provider fails. Mock-provider bookings never capture.

### Amadeus

Register at https://developers.amadeus.com, then set `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, and `AMADEUS_HOSTNAME` (defaults to `test.api.amadeus.com`). When unset, Tripmate falls back to mock providers.

### AI

Set `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY`. Use `AI_PROVIDER=anthropic|openai` to force a provider when both keys are set. Without keys, the chat route replies with deterministic rule-based summaries.

### Resend

Set `RESEND_API_KEY` and `EMAIL_FROM`. Verify the sending domain at https://resend.com/domains. Without a key, the email provider logs payloads to stdout.

## Vercel deployment

1. Push the branch and import the repo into Vercel.
2. Set all variables from `.env.example` as Vercel Environment Variables (Production + Preview).
   - `AUTH_URL` and `NEXT_PUBLIC_APP_URL` should both be the canonical URL (e.g. `https://tripmate.example.com`).
   - `APP_URL` mirrors `NEXT_PUBLIC_APP_URL` (used in server-only contexts).
3. Commit `vercel.json` — it registers the hourly cron at `/api/cron/reminders`.
4. In the Stripe dashboard, register the production webhook endpoint and set `STRIPE_WEBHOOK_SECRET`.
5. Run `npx prisma migrate deploy` against the production DB (Vercel runs this automatically via the `postinstall` / `build` scripts when `DATABASE_URL` is set at build time; verify after your first deploy).

Cron calls `/api/cron/reminders` once an hour. Vercel signs the request with `Authorization: Bearer $CRON_SECRET`. Anything else is rejected.

## Repository layout

```text
tripmate/
  prisma/
    schema.prisma          — Users, Accounts, Trips, Bookings, Payments, Shares, Reminders
    migrations/
    seed.ts                — Demo user + Tokyo trip, bcrypt-hashed password
  src/
    auth.ts                — NextAuth v5 config (PrismaAdapter, JWT, Credentials + Google)
    auth.config.ts         — Edge-safe base config used by middleware
    middleware.ts          — Route-level auth
    app/
      api/auth/            — NextAuth route + signup
      api/stripe/          — setup-intent + webhook
      api/payment-methods/ — list + attach
      api/trips/[id]/chat/ — Streamed AI chat
      api/trips/[id]/shares/ — create / list / revoke share links
      api/cron/reminders/  — Vercel cron receiver
      share/[token]/       — Public itinerary page
      (app)/               — Authenticated app (trips, profile, booking flow)
    components/            — UI + forms, including AddPaymentMethodForm, ShareItineraryButton
    lib/
      auth/password.ts     — bcrypt + legacy scrypt verifier
      stripe.ts            — singleton getStripe()
      env.ts               — appUrl() helper
    server/
      services/            — auth, booking, ai, share, reminder, search, trip
      repositories/        — Prisma data access
      integrations/        — Stripe, Resend, Amadeus, Mock providers, email templates
  vercel.json              — Cron registration
  .env.example             — All environment variables
```

## Scripts

- `npm run dev` — Next dev server.
- `npm run build` — `prisma generate && next build`.
- `npm run lint` — Next.js ESLint.
- `npm run db:migrate` — Prisma migrate dev.
- `npm run db:migrate:deploy` — Apply migrations in CI/prod.
- `npm run db:seed` — Seed demo data.
- `npm run db:studio` — Prisma Studio.

## Booking state machine

```
PENDING_APPROVAL
    │   user approves quote
    ▼
PAYMENT_AUTHORIZED            — Stripe manual capture hold placed
    │   booking service called
    ▼
BOOKING_PENDING               — calling provider
    │
    ├── provider real + ok   → CONFIRMED (Stripe captured, confirmationNumber stored)
    ├── provider mock + ok   → PENDING_FULFILLMENT (no capture, no confirmation number)
    ├── provider fails       → FAILED (Stripe voided)
    └── user cancels         → CANCELLED (Stripe voided or refunded)
```

## Testing the payment flow

1. Sign up, create a trip, select a package, approve the booking.
2. Stripe creates a PaymentIntent with `capture_method: manual`; the card is authorized but not charged.
3. If the provider is real (`AMADEUS_*` set and a non-`mock-` reference comes back), Stripe captures and the booking is `CONFIRMED`.
4. If the provider fails, the PaymentIntent is canceled and the booking is `FAILED`.
5. If the provider is mock, the booking is `PENDING_FULFILLMENT` — the user sees an amber banner telling them fulfilment is manual.

## Known boundaries (deliberate)

- Email delivery in local dev is logged to stdout unless `RESEND_API_KEY` is set.
- Mock providers always produce `PENDING_FULFILLMENT` bookings — never fake confirmation numbers.
- Cron runs hourly on Vercel. Local dev does not run cron; trigger manually with:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
  ```
- Share links expire after 30 days by default and can be revoked from the API.

## License

MIT
