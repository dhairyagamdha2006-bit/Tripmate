import { PrismaClient, CabinClass, SeatPreference, SmokingPreference, BedType, TripRequestStatus, BookingStatus, BookingItemStatus, BookingItemType, PackageLabel, AgentMessageRole, AgentMessageType, AuditActorType } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const demoEmail = 'demo@tripmate.app';
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      passwordHash: hashPassword('Tripmate123!'),
      firstName: 'Alex',
      lastName: 'Morgan'
    }
  });

  const profile = await prisma.travelerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      fullLegalName: 'Alexandra Morgan',
      dateOfBirth: new Date('1990-03-22'),
      nationality: 'American',
      passportNumber: 'US123456789',
      passportExpiry: addDays(1200),
      homeAirportCode: 'SFO',
      preferredCabinClass: CabinClass.BUSINESS,
      seatPreference: SeatPreference.AISLE,
      preferDirectFlights: true,
      preferredHotelChains: ['Marriott', 'Hilton'],
      bedType: BedType.KING,
      smokingPreference: SmokingPreference.NON_SMOKING,
      accessibilityNeeds: []
    }
  });

  const existingLoyalty = await prisma.loyaltyProgram.findFirst({ where: { profileId: profile.id } });
  if (!existingLoyalty) {
    await prisma.loyaltyProgram.createMany({
      data: [
        { profileId: profile.id, program: 'United MileagePlus', memberId: 'UA9876543' },
        { profileId: profile.id, program: 'Marriott Bonvoy', memberId: 'MB112233' }
      ]
    });
  }

  const paymentMethod = await prisma.paymentMethod.upsert({
    where: { id: 'demo-payment-method' },
    update: {},
    create: {
      id: 'demo-payment-method',
      userId: user.id,
      provider: 'mock-stripe',
      providerPaymentMethodId: 'pm_mock_4242',
      brand: 'Visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2032,
      isDefault: true
    }
  });

  const departureDate = addDays(45);
  departureDate.setHours(0, 0, 0, 0);
  const returnDate = addDays(55);
  returnDate.setHours(0, 0, 0, 0);

  const existingTrip = await prisma.trip.findFirst({ where: { userId: user.id, title: 'Tokyo Summer Escape' } });
  if (!existingTrip) {
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        title: 'Tokyo Summer Escape',
        originLabel: 'San Francisco (SFO)',
        destinationLabel: 'Tokyo, Japan (NRT)',
        departureDate,
        returnDate,
        travelerCount: 2,
        status: TripRequestStatus.CONFIRMED
      }
    });

    const request = await prisma.tripRequest.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        originCode: 'SFO',
        originCity: 'San Francisco',
        destinationCode: 'NRT',
        destinationCity: 'Tokyo',
        departureDate,
        returnDate,
        travelerCount: 2,
        budgetCents: 800000,
        currency: 'USD',
        cabinClass: CabinClass.BUSINESS,
        preferDirectFlights: true,
        hotelStarLevel: 4,
        neighborhoodPreference: 'Shibuya or Shinjuku',
        amenities: ['WiFi', 'Breakfast', 'Gym'],
        refundableOnly: false,
        status: TripRequestStatus.CONFIRMED
      }
    });

    await prisma.tripPreferenceSnapshot.create({
      data: {
        tripRequestId: request.id,
        travelerProfileId: profile.id,
        homeAirportCode: 'SFO',
        preferredCabinClass: CabinClass.BUSINESS,
        preferDirectFlights: true,
        seatPreference: SeatPreference.AISLE,
        preferredHotelChains: ['Marriott', 'Hilton'],
        bedType: BedType.KING,
        smokingPreference: SmokingPreference.NON_SMOKING,
        accessibilityNeeds: []
      }
    });

    const flightSearchSession = await prisma.providerSearchSession.create({
      data: {
        tripRequestId: request.id,
        kind: 'FLIGHTS',
        provider: 'mock-flights',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date()
      }
    });

    const hotelSearchSession = await prisma.providerSearchSession.create({
      data: {
        tripRequestId: request.id,
        kind: 'HOTELS',
        provider: 'mock-hotels',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date()
      }
    });

    const flight = await prisma.flightOptionCache.create({
      data: {
        tripRequestId: request.id,
        providerSearchSessionId: flightSearchSession.id,
        provider: 'mock-flights',
        providerOfferId: 'flight_demo_1',
        airline: 'United Airlines',
        airlineCode: 'UA',
        flightNumber: 'UA837',
        originCode: 'SFO',
        destinationCode: 'NRT',
        departureTime: new Date(departureDate.getTime() + 11.5 * 60 * 60 * 1000),
        arrivalTime: new Date(departureDate.getTime() + 23.5 * 60 * 60 * 1000),
        durationMinutes: 690,
        stops: 0,
        stopDetails: [],
        cabinClass: CabinClass.BUSINESS,
        priceCents: 240000,
        currency: 'USD',
        refundable: true,
        changeable: true,
        baggageIncluded: true,
        seatsAvailable: 6,
        loyaltyProgram: 'United MileagePlus',
        returnFlightNumber: 'UA838',
        returnDepartureTime: new Date(returnDate.getTime() + 17 * 60 * 60 * 1000),
        returnArrivalTime: new Date(returnDate.getTime() + 27 * 60 * 60 * 1000),
        returnDurationMinutes: 630,
        returnStops: 0
      }
    });

    const hotel = await prisma.hotelOptionCache.create({
      data: {
        tripRequestId: request.id,
        providerSearchSessionId: hotelSearchSession.id,
        provider: 'mock-hotels',
        providerHotelId: 'hotel_demo_1',
        providerOfferId: 'hotel_offer_demo_1',
        name: 'Shibuya Excel Hotel Tokyu',
        chain: 'Tokyu',
        stars: 4,
        neighborhood: 'Shibuya',
        city: 'Tokyo',
        countryCode: 'JP',
        address: '1-12-2 Dogenzaka, Shibuya-ku, Tokyo',
        pricePerNightCents: 28000,
        totalPriceCents: 280000,
        nights: 10,
        currency: 'USD',
        rating: 8.6,
        reviewCount: 4120,
        amenities: ['WiFi', 'Breakfast', 'Gym'],
        refundable: true,
        cancellationDeadline: addDays(40),
        roomType: 'Superior King',
        bedType: BedType.KING,
        distanceToCenterKm: 1.2
      }
    });

    const tripPackage = await prisma.tripPackage.create({
      data: {
        tripRequestId: request.id,
        flightOptionCacheId: flight.id,
        hotelOptionCacheId: hotel.id,
        label: PackageLabel.BEST_VALUE,
        recommended: true,
        overallScore: 89,
        priceFitScore: 91,
        convenienceScore: 90,
        travelDurationScore: 92,
        hotelQualityScore: 82,
        refundFlexibilityScore: 95,
        preferenceMatchScore: 86,
        explanation: 'Best overall fit balancing price, convenience, and hotel quality. It stays within the stated budget and keeps the trip fully refundable.',
        highlights: ['Direct flights both ways', 'Fully refundable bundle', 'Shibuya location', 'Within your stated budget'],
        warnings: [],
        totalPriceCents: 760000,
        currency: 'USD'
      }
    });

    await prisma.tripRequest.update({
      where: { id: request.id },
      data: { selectedPackageId: tripPackage.id }
    });

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        tripId: trip.id,
        tripRequestId: request.id,
        tripPackageId: tripPackage.id,
        paymentMethodId: paymentMethod.id,
        status: BookingStatus.CONFIRMED,
        confirmationNumber: 'TM-DEMO-48291',
        totalPriceCents: 760000,
        currency: 'USD',
        cancellationDeadline: addDays(38),
        bookedAt: new Date()
      }
    });

    await prisma.bookingItem.createMany({
      data: [
        {
          bookingId: booking.id,
          type: BookingItemType.FLIGHT,
          status: BookingItemStatus.CONFIRMED,
          provider: 'mock-booking',
          providerReference: 'UA-KG8837',
          displayName: 'United Airlines · UA837 / UA838',
          amountCents: 480000,
          currency: 'USD',
          details: { originCode: 'SFO', destinationCode: 'NRT' }
        },
        {
          bookingId: booking.id,
          type: BookingItemType.HOTEL,
          status: BookingItemStatus.CONFIRMED,
          provider: 'mock-booking',
          providerReference: 'HTL-TYO-2841',
          displayName: 'Shibuya Excel Hotel Tokyu · 10 nights',
          amountCents: 280000,
          currency: 'USD',
          details: { neighborhood: 'Shibuya' }
        }
      ]
    });

    await prisma.agentMessage.createMany({
      data: [
        {
          tripRequestId: request.id,
          role: AgentMessageRole.ASSISTANT,
          type: AgentMessageType.TEXT,
          content: "I'm reviewing your Tokyo trip and checking the best Business class options for two travelers."
        },
        {
          tripRequestId: request.id,
          role: AgentMessageRole.ASSISTANT,
          type: AgentMessageType.STATUS,
          content: 'Flights and hotels were searched and scored using your profile preferences.'
        },
        {
          tripRequestId: request.id,
          role: AgentMessageRole.ASSISTANT,
          type: AgentMessageType.SUMMARY,
          content: 'The Best Value package was selected because it combined direct flights, a central Shibuya hotel, and full refundability within budget.'
        }
      ]
    });

    await prisma.auditLog.createMany({
      data: [
        {
          userId: user.id,
          tripId: trip.id,
          actorType: AuditActorType.SYSTEM,
          action: 'seed.trip_created',
          details: { tripTitle: 'Tokyo Summer Escape' }
        },
        {
          userId: user.id,
          tripId: trip.id,
          bookingId: booking.id,
          actorType: AuditActorType.SYSTEM,
          action: 'seed.booking_confirmed',
          details: { confirmationNumber: 'TM-DEMO-48291' }
        }
      ]
    });
  }

  console.log('Seed complete. Demo login: demo@tripmate.app / Tripmate123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
