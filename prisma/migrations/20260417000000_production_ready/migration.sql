-- ─────────────────────────────────────────────────────────────────────────────
-- Production-ready upgrade
--   - Auth.js: Account + VerificationToken
--   - Booking state machine: PAYMENT_AUTHORIZED, PENDING_FULFILLMENT
--   - Stripe payment intent tracking on Booking
--   - BookingReminder for cancellation reminder cron
--   - ItineraryShare for shareable itineraries
--   - User.image / User.name / User.emailVerified for OAuth
-- ─────────────────────────────────────────────────────────────────────────────

-- AlterEnum: TripRequestStatus
ALTER TYPE "TripRequestStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_AUTHORIZED';
ALTER TYPE "TripRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_FULFILLMENT';

-- AlterEnum: BookingStatus
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_AUTHORIZED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PENDING_FULFILLMENT';

-- AlterEnum: BookingItemStatus
ALTER TYPE "BookingItemStatus" ADD VALUE IF NOT EXISTS 'PENDING_FULFILLMENT';

-- CreateEnum: ReminderKind
DO $$ BEGIN
  CREATE TYPE "ReminderKind" AS ENUM ('CANCELLATION_DEADLINE', 'TRIP_DEPARTURE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: ReminderStatus
DO $$ BEGIN
  CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- User columns required by Auth.js
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Account (Auth.js OAuth links)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key"
  ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- VerificationToken (Auth.js email verification, magic links)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key"
  ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key"
  ON "VerificationToken"("identifier", "token");

-- ─────────────────────────────────────────────────────────────────────────────
-- Booking: payment intent + fulfillment metadata + cancellation index
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentAuthorizedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentCapturedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "fulfillmentMode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_paymentIntentId_key" ON "Booking"("paymentIntentId");
CREATE INDEX IF NOT EXISTS "Booking_cancellationDeadline_idx" ON "Booking"("cancellationDeadline");

-- ─────────────────────────────────────────────────────────────────────────────
-- BookingReminder
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BookingReminder" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "kind" "ReminderKind" NOT NULL,
  "offsetHours" INTEGER NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BookingReminder_bookingId_kind_offsetHours_key"
  ON "BookingReminder"("bookingId", "kind", "offsetHours");
CREATE INDEX IF NOT EXISTS "BookingReminder_status_scheduledFor_idx"
  ON "BookingReminder"("status", "scheduledFor");

ALTER TABLE "BookingReminder" DROP CONSTRAINT IF EXISTS "BookingReminder_bookingId_fkey";
ALTER TABLE "BookingReminder" ADD CONSTRAINT "BookingReminder_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- ItineraryShare
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ItineraryShare" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "lastViewedAt" TIMESTAMP(3),
  CONSTRAINT "ItineraryShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ItineraryShare_token_key" ON "ItineraryShare"("token");
CREATE INDEX IF NOT EXISTS "ItineraryShare_tripId_idx" ON "ItineraryShare"("tripId");
CREATE INDEX IF NOT EXISTS "ItineraryShare_token_idx" ON "ItineraryShare"("token");

ALTER TABLE "ItineraryShare" DROP CONSTRAINT IF EXISTS "ItineraryShare_tripId_fkey";
ALTER TABLE "ItineraryShare" ADD CONSTRAINT "ItineraryShare_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
