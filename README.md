# Tripmate

Tripmate is a light-themed, trust-first AI travel planning starter built with Next.js App Router, TypeScript, Tailwind, Prisma, PostgreSQL, React Hook Form, and Zod.

It includes:
- signup and login with a simple session model
- traveler profile management
- trip request creation with validation
- mock flight and hotel providers
- deterministic recommendation scoring
- package selection and booking approval flow
- trip dashboard, detail pages, comparison, booking review, and success pages
- repository and service layers that keep domain logic out of page components

## Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS 3
- Prisma ORM
- PostgreSQL
- React Hook Form
- Zod

## Project structure

```text
tripmate-app/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (marketing)/
      (auth)/
      (app)/
      api/
    components/
      ui/
      common/
      forms/
      trip/
      booking/
      dashboard/
      layout/
    lib/
      auth/
      db/
      validations/
      scoring/
      formatters/
      utils/
    server/
      repositories/
      services/
      integrations/
      mappers/
      http/
    types/
```

## Environment variables

Copy the example file first:

```bash
cp .env.example .env
```

Then set at least:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripmate"
SESSION_COOKIE_NAME="tripmate_session"
SESSION_COOKIE_SECURE="false"
APP_URL="http://localhost:3000"
```

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Generate Prisma client and run the first migration.

```bash
npm run db:generate
npm run db:migrate -- --name init
```

3. Seed demo data.

```bash
npm run db:seed
```

4. Start the development server.

```bash
npm run dev
```

5. Open the app in your browser.

```text
http://localhost:3000
```

## Demo login

After seeding, you can sign in with:

- Email: `demo@tripmate.app`
- Password: `Tripmate123!`

## Page-by-page smoke test

Use this checklist after running the app.

### 1. Landing page
- Visit `/`
- Confirm the light theme, hero section, and CTA buttons render correctly

### 2. Login page
- Visit `/login`
- Sign in with the seeded demo account
- Confirm you land on `/trips`

### 3. Signup page
- Visit `/signup`
- Create a new test account
- Confirm you land on `/profile`

### 4. Traveler profile
- Save the profile form
- Confirm validation appears for missing or invalid fields
- Confirm success feedback appears after save

### 5. New trip page
- Visit `/trips/new`
- Submit a valid trip request
- Confirm redirect to `/trips/{id}/planning`

### 6. Planning page
- Confirm search starts automatically
- Confirm planning progress card updates
- Confirm “View recommendations” becomes available

### 7. Recommendations page
- Confirm 3 to 4 bundles appear
- Confirm pricing, hotel details, and explanation text are visible
- Select a package

### 8. Booking review page
- Confirm selected flight, hotel, refundability, and pricing are shown
- Click “Confirm and book”

### 9. Booking success page
- Confirm confirmation cards render
- Confirm navigation back to dashboard and trip details works

### 10. Trip detail page
- Confirm selected package and booking summary appear
- Confirm planning messages are visible

## GitHub upload steps

If you want to create a brand-new GitHub repository from this project:

1. Unzip or copy the project folder to your local machine.
2. Open a terminal in the project folder.
3. Run:

```bash
git init
git add .
git commit -m "Initial Tripmate app"
```

4. Create a new empty repository on GitHub.
5. Connect your local folder to GitHub:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tripmate-app.git
git push -u origin main
```

## Deploying

You can deploy this to any host that supports Next.js and PostgreSQL.

### Before deploying
- create a production PostgreSQL database
- set `DATABASE_URL`
- set `SESSION_COOKIE_SECURE=true`
- set `APP_URL` to the production URL
- run migrations against production

### Example production commands

```bash
npm install
npm run db:generate
npm run db:migrate:deploy
npm run build
```

Then run migrations in your deployment pipeline or release step.

## Notes about this starter

- Flight, hotel, booking, payment, and notification integrations are mocked intentionally.
- Real provider adapters have placeholder files ready for Amadeus, Duffel, Hotelbeds, Stripe, and SendGrid.
- Payment handling is intentionally token-placeholder based. Never store raw card numbers.
- Auth is intentionally lightweight. Harden it before a real launch.

## What remains before real production launch

- stronger auth and session hardening
- CSRF and rate limiting
- production-safe payment method capture via Stripe or equivalent
- real provider credentials and provider retry logic
- observability, monitoring, and alerting
- background jobs for long-running searches and booking retries
- end-to-end tests and CI checks
- email delivery and transactional notification templates
