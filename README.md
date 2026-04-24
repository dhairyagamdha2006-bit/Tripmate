# Tripmate

Tripmate is a Vercel-first travel planning and checkout app built with Next.js App Router, TypeScript, Prisma, PostgreSQL, Auth.js, Stripe, Amadeus, SendGrid, and the Vercel AI SDK.

This codebase upgrades the original demo into a production-oriented deployment target with:

- Auth.js database sessions, credentials auth, bcrypt password hashing, and Google OAuth
- Real Amadeus-backed flight search and Amadeus-backed hotel offer search
- Stripe setup intents, saved payment methods, payment intents, and webhooks
- AI recommendation summaries and trip chat backed by OpenAI or Anthropic through the Vercel AI SDK
- SendGrid-powered transactional email delivery with delivery tracking
- Vercel Cron cancellation reminders with idempotent reminder jobs
- Public share links for itineraries with revocation and scoped data exposure
- Honest booking state transitions that separate quote selection, payment, and provider fulfillment

## Product truthfulness

Tripmate intentionally separates:

- provider-backed search results
- package selection
- payment collection
- booking request / fulfillment state

That matters because provider capabilities differ by account tier and workflow. This app never fabricates provider confirmation numbers or pretends ticketing happened when it did not.

## Architecture

- `auth.ts`: Auth.js v5-style setup
- `src/app/api`: Route handlers for auth, trips, chat, checkout, sharing, Stripe webhooks, and cron
- `src/server/integrations`: Provider integrations for Amadeus, Stripe, and SendGrid
- `src/server/services`: Domain services for trips, search, booking, profile, sharing, reminders, email, and AI
- `src/server/repositories`: Prisma-facing persistence layer
- `src/components`: UI for auth, trip planning, checkout, sharing, and profile/payment management
- `prisma/schema.prisma`: Full data model including Auth.js models, reminder jobs, share links, and email deliveries

## Requirements

- Node.js 20+
- PostgreSQL 14+
- A Stripe account
- An Amadeus Self-Service account
- A SendGrid account for transactional email
- Either an OpenAI or Anthropic API key

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Minimum variables for the core app:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

## Local development

Install dependencies:

```bash
npm install
```

Create and migrate the database:

```bash
npm run db:migrate
```

Generate Prisma client if needed:

```bash
npm run db:generate
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Stripe webhook testing

Use Stripe CLI locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed webhook secret into `STRIPE_WEBHOOK_SECRET`.

## Optional local seed data

The seed script is opt-in and does not create mock search results. It can create a sample login if you enable it:

```bash
SEED_SAMPLE_DATA=true npm run db:seed
```

Defaults:

- email: `demo@tripmate.local`
- password: `Tripmate123!`

Override with:

```bash
SEED_SAMPLE_EMAIL=you@example.com SEED_SAMPLE_PASSWORD='StrongPassword123!' npm run db:seed
```

## Vercel deployment

1. Create a PostgreSQL database.
2. Add every variable from `.env.example` to Vercel.
3. Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to your production URL.
4. Deploy the project.
5. Run Prisma migrations against the production database.

Local CLI deploy:

```bash
vercel
vercel env pull .env.local
npm run db:migrate:deploy
vercel --prod
```

The project includes `vercel.json` with an hourly cron hitting `/api/cron/reminders`.

## Database migration strategy

### Fresh database

Recommended for the cleanest deployment:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run build
```

### Existing database from the older demo

The old demo schema used different booking enums and the pre-Auth.js session system. This codebase preserves legacy password compatibility in application code, but the schema evolution is large enough that you should:

1. back up the database
2. test the migration against a staging copy first
3. prefer a new database for production if the old environment has little or no critical user data

If you must migrate an existing database in place:

```bash
# after backing up your DB
npm install
npm run db:generate
npx prisma migrate deploy
```

If Prisma reports drift from the old schema, use a staged migration or move to a new database and re-import only users/trips you need.

## Manual test checklist

### Auth

- Create an account with email and password
- Sign in with credentials
- Sign in with Google
- Confirm old scrypt-hashed passwords can still log in and get rehashed to bcrypt

### Profile and payments

- Save a traveler profile
- Add a Stripe card through the setup intent flow
- Remove a saved card

### Search and itinerary planning

- Create a new trip
- Run live search
- Verify flight/hotel offers are provider-backed
- Select a package
- Verify recommendation summary appears
- Ask itinerary questions in Tripmate AI

### Checkout and webhooks

- Pay with a saved card
- Confirm `payment_intent.succeeded` reaches `/api/stripe/webhook`
- Confirm booking state becomes `PENDING_MANUAL_FULFILLMENT` or another truthful state based on the webhook result

### Sharing and email

- Create a share link
- Open `/share/{token}` in an incognito browser
- Confirm private account and payment details are not exposed
- Revoke a share link
- Email a share link
- Confirm booking confirmation and reminder emails create `EmailDelivery` records

### Reminders

- Set a booking cancellation deadline in the future
- Confirm reminder jobs are created
- Trigger the cron route manually with the cron bearer token
- Confirm each reminder sends once and does not duplicate

## Commands

```bash
npm install
npm run db:migrate
npm run db:generate
npm run dev
npm run build
npm run lint
npm run db:migrate:deploy
```

## Notes on provider behavior

- The app uses real Amadeus search APIs for flights and hotel offers.
- Payment is real Stripe payment collection.
- Final travel fulfillment is kept honest. Payment success does not automatically claim that a provider issued tickets or hotel reservations unless your provider-side workflow truly confirms that.
- Share links intentionally expose itinerary essentials only.

