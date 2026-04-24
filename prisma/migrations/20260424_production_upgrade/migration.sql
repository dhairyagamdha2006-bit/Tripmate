-- Tripmate production upgrade baseline migration
-- Intended for a fresh PostgreSQL database or a reset development environment.
-- For an existing live database from the older demo build, back up first and test a staged migration.

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');
CREATE TYPE "SeatPreference" AS ENUM ('WINDOW', 'AISLE', 'MIDDLE', 'NO_PREFERENCE');
CREATE TYPE "SmokingPreference" AS ENUM ('NON_SMOKING', 'SMOKING', 'NO_PREFERENCE');
CREATE TYPE "BedType" AS ENUM ('KING', 'QUEEN', 'TWIN', 'DOUBLE', 'NO_PREFERENCE');
CREATE TYPE "TripRequestStatus" AS ENUM ('DRAFT', 'SEARCHING', 'RECOMMENDATIONS_READY', 'PACKAGE_SELECTED', 'PENDING_APPROVAL', 'BOOKING_PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "SearchSessionKind" AS ENUM ('FLIGHTS', 'HOTELS');
CREATE TYPE "SearchSessionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TYPE "PackageLabel" AS ENUM ('BEST_VALUE', 'CHEAPEST', 'MOST_CONVENIENT', 'PREMIUM', 'MOST_FLEXIBLE');
CREATE TYPE "BookingStatus" AS ENUM ('SELECTED', 'PAYMENT_PENDING', 'PAYMENT_REQUIRES_ACTION', 'PAYMENT_AUTHORIZED', 'BOOKING_REQUESTED', 'CONFIRMED', 'PENDING_MANUAL_FULFILLMENT', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_STARTED', 'REQUIRES_PAYMENT_METHOD', 'REQUIRES_ACTION', 'PROCESSING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELED');
CREATE TYPE "FulfillmentStatus" AS ENUM ('NOT_STARTED', 'REQUESTED', 'CONFIRMED', 'PENDING_MANUAL', 'FAILED', 'CANCELLED');
CREATE TYPE "BookingItemType" AS ENUM ('FLIGHT', 'HOTEL');
CREATE TYPE "BookingItemStatus" AS ENUM ('QUOTED', 'PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PENDING_MANUAL_FULFILLMENT');
CREATE TYPE "AgentMessageRole" AS ENUM ('ASSISTANT', 'USER', 'SYSTEM', 'TOOL');
CREATE TYPE "AgentMessageType" AS ENUM ('TEXT', 'QUESTION', 'STATUS', 'SUMMARY', 'TOOL_CALL', 'TOOL_RESULT', 'ERROR');
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'ASSISTANT', 'ADMIN', 'WEBHOOK', 'CRON');
CREATE TYPE "ReminderType" AS ENUM ('CANCELLATION_72H', 'CANCELLATION_24H');
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'SKIPPED', 'FAILED');
CREATE TYPE "ShareLinkStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "EmailKind" AS ENUM ('BOOKING_CONFIRMATION', 'ITINERARY_SHARE', 'CANCELLATION_REMINDER', 'WELCOME');
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "name" TEXT,
  "image" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "emailVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
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

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "TravelerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullLegalName" TEXT NOT NULL,
  "dateOfBirth" DATE NOT NULL,
  "nationality" TEXT NOT NULL,
  "passportNumber" TEXT NOT NULL,
  "passportExpiry" DATE NOT NULL,
  "passportIssuingCountry" TEXT,
  "phoneNumber" TEXT,
  "gender" TEXT,
  "homeAirportCode" CHAR(3) NOT NULL,
  "preferredCabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
  "seatPreference" "SeatPreference" NOT NULL DEFAULT 'NO_PREFERENCE',
  "preferDirectFlights" BOOLEAN NOT NULL DEFAULT false,
  "preferredHotelChains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "bedType" "BedType",
  "smokingPreference" "SmokingPreference" NOT NULL DEFAULT 'NON_SMOKING',
  "accessibilityNeeds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TravelerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyProgram" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "program" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentMethod" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerCustomerId" TEXT,
  "providerPaymentMethodId" TEXT,
  "brand" TEXT,
  "last4" TEXT,
  "expiryMonth" INTEGER,
  "expiryYear" INTEGER,
  "billingName" TEXT,
  "billingEmail" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trip" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "originLabel" TEXT NOT NULL,
  "destinationLabel" TEXT NOT NULL,
  "departureDate" DATE NOT NULL,
  "returnDate" DATE NOT NULL,
  "travelerCount" INTEGER NOT NULL DEFAULT 1,
  "status" "TripRequestStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripRequest" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "originCode" CHAR(3) NOT NULL,
  "originCity" TEXT NOT NULL,
  "destinationCode" CHAR(3) NOT NULL,
  "destinationCity" TEXT NOT NULL,
  "departureDate" DATE NOT NULL,
  "returnDate" DATE NOT NULL,
  "travelerCount" INTEGER NOT NULL DEFAULT 1,
  "budgetCents" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "cabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
  "preferDirectFlights" BOOLEAN NOT NULL DEFAULT false,
  "hotelStarLevel" INTEGER NOT NULL DEFAULT 3,
  "neighborhoodPreference" TEXT,
  "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "refundableOnly" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "selectedPackageId" TEXT,
  "status" "TripRequestStatus" NOT NULL DEFAULT 'DRAFT',
  "recommendationSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripPreferenceSnapshot" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "travelerProfileId" TEXT,
  "homeAirportCode" CHAR(3),
  "preferredCabinClass" "CabinClass",
  "preferDirectFlights" BOOLEAN,
  "seatPreference" "SeatPreference",
  "preferredHotelChains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "bedType" "BedType",
  "smokingPreference" "SmokingPreference",
  "accessibilityNeeds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripPreferenceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderSearchSession" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "kind" "SearchSessionKind" NOT NULL,
  "provider" TEXT NOT NULL,
  "status" "SearchSessionStatus" NOT NULL DEFAULT 'PENDING',
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderSearchSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FlightOptionCache" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "providerSearchSessionId" TEXT,
  "provider" TEXT NOT NULL,
  "providerOfferId" TEXT NOT NULL,
  "airline" TEXT NOT NULL,
  "airlineCode" CHAR(2) NOT NULL,
  "flightNumber" TEXT NOT NULL,
  "originCode" CHAR(3) NOT NULL,
  "destinationCode" CHAR(3) NOT NULL,
  "departureTime" TIMESTAMP(3) NOT NULL,
  "arrivalTime" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "stops" INTEGER NOT NULL DEFAULT 0,
  "stopDetails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cabinClass" "CabinClass" NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "refundable" BOOLEAN NOT NULL DEFAULT false,
  "changeable" BOOLEAN NOT NULL DEFAULT false,
  "baggageIncluded" BOOLEAN NOT NULL DEFAULT false,
  "seatsAvailable" INTEGER,
  "loyaltyProgram" TEXT,
  "returnFlightNumber" TEXT,
  "returnDepartureTime" TIMESTAMP(3),
  "returnArrivalTime" TIMESTAMP(3),
  "returnDurationMinutes" INTEGER,
  "returnStops" INTEGER,
  "offerJson" JSONB,
  "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "FlightOptionCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HotelOptionCache" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "providerSearchSessionId" TEXT,
  "provider" TEXT NOT NULL,
  "providerHotelId" TEXT NOT NULL,
  "providerOfferId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "chain" TEXT,
  "stars" INTEGER NOT NULL,
  "neighborhood" TEXT,
  "city" TEXT NOT NULL,
  "countryCode" CHAR(2) NOT NULL,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "pricePerNightCents" INTEGER NOT NULL,
  "totalPriceCents" INTEGER NOT NULL,
  "nights" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "rating" DOUBLE PRECISION,
  "reviewCount" INTEGER,
  "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "refundable" BOOLEAN NOT NULL DEFAULT false,
  "cancellationDeadline" TIMESTAMP(3),
  "roomType" TEXT,
  "bedType" "BedType",
  "distanceToCenterKm" DOUBLE PRECISION,
  "offerJson" JSONB,
  "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "HotelOptionCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripPackage" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "flightOptionCacheId" TEXT NOT NULL,
  "hotelOptionCacheId" TEXT NOT NULL,
  "label" "PackageLabel" NOT NULL,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "overallScore" INTEGER NOT NULL,
  "priceFitScore" INTEGER NOT NULL,
  "convenienceScore" INTEGER NOT NULL,
  "travelDurationScore" INTEGER NOT NULL,
  "hotelQualityScore" INTEGER NOT NULL,
  "refundFlexibilityScore" INTEGER NOT NULL,
  "preferenceMatchScore" INTEGER NOT NULL,
  "explanation" TEXT NOT NULL,
  "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "warnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "totalPriceCents" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "tripPackageId" TEXT NOT NULL,
  "paymentMethodId" TEXT,
  "status" "BookingStatus" NOT NULL DEFAULT 'SELECTED',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "confirmationNumber" TEXT,
  "totalPriceCents" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "cancellationDeadline" TIMESTAMP(3),
  "bookedAt" TIMESTAMP(3),
  "paymentIntentId" TEXT,
  "stripeCustomerId" TEXT,
  "providerBookingReference" TEXT,
  "providerBookingState" TEXT,
  "providerMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingItem" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "type" "BookingItemType" NOT NULL,
  "status" "BookingItemStatus" NOT NULL DEFAULT 'QUOTED',
  "provider" TEXT NOT NULL,
  "providerReference" TEXT,
  "displayName" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "details" JSONB,
  "cancellationDeadline" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentMessage" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "role" "AgentMessageRole" NOT NULL,
  "type" "AgentMessageType" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "tripId" TEXT,
  "bookingId" TEXT,
  "actorType" "AuditActorType" NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItineraryShare" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "status" "ShareLinkStatus" NOT NULL DEFAULT 'ACTIVE',
  "note" TEXT,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItineraryShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderJob" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "type" "ReminderType" NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "idempotencyKey" TEXT NOT NULL,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReminderJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT,
  "tripId" TEXT,
  "shareId" TEXT,
  "userId" TEXT,
  "kind" "EmailKind" NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'sendgrid',
  "providerMessageId" TEXT,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "toEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "payload" JSONB,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE UNIQUE INDEX "TravelerProfile_userId_key" ON "TravelerProfile"("userId");
CREATE INDEX "LoyaltyProgram_profileId_idx" ON "LoyaltyProgram"("profileId");

CREATE UNIQUE INDEX "PaymentMethod_providerPaymentMethodId_key" ON "PaymentMethod"("providerPaymentMethodId");
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

CREATE INDEX "Trip_userId_status_idx" ON "Trip"("userId", "status");
CREATE INDEX "Trip_departureDate_idx" ON "Trip"("departureDate");

CREATE INDEX "TripRequest_tripId_createdAt_idx" ON "TripRequest"("tripId", "createdAt");
CREATE INDEX "TripRequest_userId_status_idx" ON "TripRequest"("userId", "status");

CREATE UNIQUE INDEX "TripPreferenceSnapshot_tripRequestId_key" ON "TripPreferenceSnapshot"("tripRequestId");

CREATE INDEX "ProviderSearchSession_tripRequestId_kind_status_idx" ON "ProviderSearchSession"("tripRequestId", "kind", "status");
CREATE INDEX "ProviderSearchSession_provider_idx" ON "ProviderSearchSession"("provider");

CREATE INDEX "FlightOptionCache_tripRequestId_priceCents_idx" ON "FlightOptionCache"("tripRequestId", "priceCents");
CREATE INDEX "FlightOptionCache_provider_providerOfferId_idx" ON "FlightOptionCache"("provider", "providerOfferId");

CREATE INDEX "HotelOptionCache_tripRequestId_totalPriceCents_idx" ON "HotelOptionCache"("tripRequestId", "totalPriceCents");
CREATE INDEX "HotelOptionCache_provider_providerHotelId_idx" ON "HotelOptionCache"("provider", "providerHotelId");

CREATE INDEX "TripPackage_tripRequestId_overallScore_idx" ON "TripPackage"("tripRequestId", "overallScore");

CREATE UNIQUE INDEX "Booking_tripRequestId_key" ON "Booking"("tripRequestId");
CREATE UNIQUE INDEX "Booking_tripPackageId_key" ON "Booking"("tripPackageId");
CREATE UNIQUE INDEX "Booking_confirmationNumber_key" ON "Booking"("confirmationNumber");
CREATE UNIQUE INDEX "Booking_paymentIntentId_key" ON "Booking"("paymentIntentId");
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");

CREATE INDEX "BookingItem_bookingId_type_idx" ON "BookingItem"("bookingId", "type");
CREATE INDEX "AgentMessage_tripRequestId_createdAt_idx" ON "AgentMessage"("tripRequestId", "createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_tripId_idx" ON "AuditLog"("tripId");
CREATE INDEX "AuditLog_bookingId_idx" ON "AuditLog"("bookingId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

CREATE UNIQUE INDEX "ItineraryShare_token_key" ON "ItineraryShare"("token");
CREATE INDEX "ItineraryShare_tripId_status_idx" ON "ItineraryShare"("tripId", "status");

CREATE UNIQUE INDEX "ReminderJob_idempotencyKey_key" ON "ReminderJob"("idempotencyKey");
CREATE UNIQUE INDEX "ReminderJob_bookingId_type_key" ON "ReminderJob"("bookingId", "type");
CREATE INDEX "ReminderJob_status_scheduledFor_idx" ON "ReminderJob"("status", "scheduledFor");

CREATE INDEX "EmailDelivery_status_kind_idx" ON "EmailDelivery"("status", "kind");

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelerProfile"
  ADD CONSTRAINT "TravelerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoyaltyProgram"
  ADD CONSTRAINT "LoyaltyProgram_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "TravelerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentMethod"
  ADD CONSTRAINT "PaymentMethod_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripRequest"
  ADD CONSTRAINT "TripRequest_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripRequest"
  ADD CONSTRAINT "TripRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPreferenceSnapshot"
  ADD CONSTRAINT "TripPreferenceSnapshot_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPreferenceSnapshot"
  ADD CONSTRAINT "TripPreferenceSnapshot_travelerProfileId_fkey"
  FOREIGN KEY ("travelerProfileId") REFERENCES "TravelerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProviderSearchSession"
  ADD CONSTRAINT "ProviderSearchSession_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FlightOptionCache"
  ADD CONSTRAINT "FlightOptionCache_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FlightOptionCache"
  ADD CONSTRAINT "FlightOptionCache_providerSearchSessionId_fkey"
  FOREIGN KEY ("providerSearchSessionId") REFERENCES "ProviderSearchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HotelOptionCache"
  ADD CONSTRAINT "HotelOptionCache_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HotelOptionCache"
  ADD CONSTRAINT "HotelOptionCache_providerSearchSessionId_fkey"
  FOREIGN KEY ("providerSearchSessionId") REFERENCES "ProviderSearchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripPackage"
  ADD CONSTRAINT "TripPackage_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPackage"
  ADD CONSTRAINT "TripPackage_flightOptionCacheId_fkey"
  FOREIGN KEY ("flightOptionCacheId") REFERENCES "FlightOptionCache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPackage"
  ADD CONSTRAINT "TripPackage_hotelOptionCacheId_fkey"
  FOREIGN KEY ("hotelOptionCacheId") REFERENCES "HotelOptionCache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_tripPackageId_fkey"
  FOREIGN KEY ("tripPackageId") REFERENCES "TripPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BookingItem"
  ADD CONSTRAINT "BookingItem_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentMessage"
  ADD CONSTRAINT "AgentMessage_tripRequestId_fkey"
  FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ItineraryShare"
  ADD CONSTRAINT "ItineraryShare_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ItineraryShare"
  ADD CONSTRAINT "ItineraryShare_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderJob"
  ADD CONSTRAINT "ReminderJob_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_shareId_fkey"
  FOREIGN KEY ("shareId") REFERENCES "ItineraryShare"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
