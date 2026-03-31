-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateEnum
CREATE TYPE "SeatPreference" AS ENUM ('WINDOW', 'AISLE', 'MIDDLE', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "SmokingPreference" AS ENUM ('NON_SMOKING', 'SMOKING', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('KING', 'QUEEN', 'TWIN', 'DOUBLE', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "TripRequestStatus" AS ENUM ('DRAFT', 'SEARCHING', 'RECOMMENDATIONS_READY', 'PACKAGE_SELECTED', 'PENDING_APPROVAL', 'BOOKING_PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SearchSessionKind" AS ENUM ('FLIGHTS', 'HOTELS');

-- CreateEnum
CREATE TYPE "SearchSessionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PackageLabel" AS ENUM ('BEST_VALUE', 'CHEAPEST', 'MOST_CONVENIENT', 'PREMIUM', 'MOST_FLEXIBLE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_APPROVAL', 'PENDING_PROVIDER_CONFIRMATION', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BookingItemType" AS ENUM ('FLIGHT', 'HOTEL');

-- CreateEnum
CREATE TYPE "BookingItemStatus" AS ENUM ('PENDING', 'HELD', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AgentMessageRole" AS ENUM ('ASSISTANT', 'USER', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "AgentMessageType" AS ENUM ('TEXT', 'QUESTION', 'STATUS', 'SUMMARY', 'TOOL_CALL', 'TOOL_RESULT', 'ERROR');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'ASSISTANT', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullLegalName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "nationality" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "passportExpiry" DATE NOT NULL,
    "homeAirportCode" CHAR(3) NOT NULL,
    "preferredCabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "seatPreference" "SeatPreference" NOT NULL DEFAULT 'NO_PREFERENCE',
    "preferDirectFlights" BOOLEAN NOT NULL DEFAULT false,
    "preferredHotelChains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bedType" "BedType",
    "smokingPreference" "SmokingPreference" NOT NULL DEFAULT 'NON_SMOKING',
    "accessibilityNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerCustomerId" TEXT,
    "providerPaymentMethodId" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "refundableOnly" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "selectedPackageId" TEXT,
    "status" "TripRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPreferenceSnapshot" (
    "id" TEXT NOT NULL,
    "tripRequestId" TEXT NOT NULL,
    "travelerProfileId" TEXT,
    "homeAirportCode" CHAR(3),
    "preferredCabinClass" "CabinClass",
    "preferDirectFlights" BOOLEAN,
    "seatPreference" "SeatPreference",
    "preferredHotelChains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bedType" "BedType",
    "smokingPreference" "SmokingPreference",
    "accessibilityNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripPreferenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSearchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "stopDetails" TEXT[] DEFAULT ARRAY[]::TEXT[],
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
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FlightOptionCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "refundable" BOOLEAN NOT NULL DEFAULT false,
    "cancellationDeadline" TIMESTAMP(3),
    "roomType" TEXT,
    "bedType" "BedType",
    "distanceToCenterKm" DOUBLE PRECISION,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "HotelOptionCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalPriceCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripRequestId" TEXT NOT NULL,
    "tripPackageId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "confirmationNumber" TEXT,
    "totalPriceCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "cancellationDeadline" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "BookingItemType" NOT NULL,
    "status" "BookingItemStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "displayName" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TravelerProfile_userId_key" ON "TravelerProfile"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_profileId_idx" ON "LoyaltyProgram"("profileId");

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "Trip_userId_status_idx" ON "Trip"("userId", "status");

-- CreateIndex
CREATE INDEX "Trip_departureDate_idx" ON "Trip"("departureDate");

-- CreateIndex
CREATE INDEX "TripRequest_tripId_createdAt_idx" ON "TripRequest"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "TripRequest_userId_status_idx" ON "TripRequest"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TripPreferenceSnapshot_tripRequestId_key" ON "TripPreferenceSnapshot"("tripRequestId");

-- CreateIndex
CREATE INDEX "ProviderSearchSession_tripRequestId_kind_status_idx" ON "ProviderSearchSession"("tripRequestId", "kind", "status");

-- CreateIndex
CREATE INDEX "ProviderSearchSession_provider_idx" ON "ProviderSearchSession"("provider");

-- CreateIndex
CREATE INDEX "FlightOptionCache_tripRequestId_priceCents_idx" ON "FlightOptionCache"("tripRequestId", "priceCents");

-- CreateIndex
CREATE INDEX "FlightOptionCache_provider_providerOfferId_idx" ON "FlightOptionCache"("provider", "providerOfferId");

-- CreateIndex
CREATE INDEX "HotelOptionCache_tripRequestId_totalPriceCents_idx" ON "HotelOptionCache"("tripRequestId", "totalPriceCents");

-- CreateIndex
CREATE INDEX "HotelOptionCache_provider_providerHotelId_idx" ON "HotelOptionCache"("provider", "providerHotelId");

-- CreateIndex
CREATE INDEX "TripPackage_tripRequestId_overallScore_idx" ON "TripPackage"("tripRequestId", "overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_tripRequestId_key" ON "Booking"("tripRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_tripPackageId_key" ON "Booking"("tripPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmationNumber_key" ON "Booking"("confirmationNumber");

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_type_idx" ON "BookingItem"("bookingId", "type");

-- CreateIndex
CREATE INDEX "AgentMessage_tripRequestId_createdAt_idx" ON "AgentMessage"("tripRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_tripId_idx" ON "AuditLog"("tripId");

-- CreateIndex
CREATE INDEX "AuditLog_bookingId_idx" ON "AuditLog"("bookingId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelerProfile" ADD CONSTRAINT "TravelerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "TravelerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPreferenceSnapshot" ADD CONSTRAINT "TripPreferenceSnapshot_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPreferenceSnapshot" ADD CONSTRAINT "TripPreferenceSnapshot_travelerProfileId_fkey" FOREIGN KEY ("travelerProfileId") REFERENCES "TravelerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSearchSession" ADD CONSTRAINT "ProviderSearchSession_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightOptionCache" ADD CONSTRAINT "FlightOptionCache_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightOptionCache" ADD CONSTRAINT "FlightOptionCache_providerSearchSessionId_fkey" FOREIGN KEY ("providerSearchSessionId") REFERENCES "ProviderSearchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelOptionCache" ADD CONSTRAINT "HotelOptionCache_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelOptionCache" ADD CONSTRAINT "HotelOptionCache_providerSearchSessionId_fkey" FOREIGN KEY ("providerSearchSessionId") REFERENCES "ProviderSearchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPackage" ADD CONSTRAINT "TripPackage_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPackage" ADD CONSTRAINT "TripPackage_flightOptionCacheId_fkey" FOREIGN KEY ("flightOptionCacheId") REFERENCES "FlightOptionCache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPackage" ADD CONSTRAINT "TripPackage_hotelOptionCacheId_fkey" FOREIGN KEY ("hotelOptionCacheId") REFERENCES "HotelOptionCache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripPackageId_fkey" FOREIGN KEY ("tripPackageId") REFERENCES "TripPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
