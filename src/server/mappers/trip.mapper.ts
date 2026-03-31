import type {
  AgentMessageRole,
  AgentMessageType,
  Booking,
  BookingItem,
  FlightOptionCache,
  HotelOptionCache,
  Trip,
  TripPackage,
  TripRequest,
  TripRequestStatus
} from '@prisma/client';
import type { AgentMessageView, BookingSummaryView, PackageScore, PackageView, TripCardView, TripDetailView } from '@/types/travel';

export function mapTripCard(trip: Trip & { bookings: Booking[] }): TripCardView {
  const latestBooking = trip.bookings[0] ?? null;
  return {
    id: trip.id,
    title: trip.title,
    originLabel: trip.originLabel,
    destinationLabel: trip.destinationLabel,
    departureDate: trip.departureDate.toISOString(),
    returnDate: trip.returnDate.toISOString(),
    travelerCount: trip.travelerCount,
    status: trip.status,
    bookingStatus: latestBooking?.status ?? null,
    totalPriceCents: latestBooking?.totalPriceCents ?? null
  };
}

export function mapPackage(pkg: TripPackage & { flightOption: FlightOptionCache; hotelOption: HotelOptionCache }): PackageView {
  const score: PackageScore = {
    overall: pkg.overallScore,
    priceFit: pkg.priceFitScore,
    convenience: pkg.convenienceScore,
    travelDuration: pkg.travelDurationScore,
    hotelQuality: pkg.hotelQualityScore,
    refundFlexibility: pkg.refundFlexibilityScore,
    preferenceMatch: pkg.preferenceMatchScore
  };

  return {
    id: pkg.id,
    label: pkg.label,
    recommended: pkg.recommended,
    explanation: pkg.explanation,
    highlights: pkg.highlights,
    warnings: pkg.warnings,
    totalPriceCents: pkg.totalPriceCents,
    currency: pkg.currency,
    score,
    flight: {
      airline: pkg.flightOption.airline,
      airlineCode: pkg.flightOption.airlineCode,
      flightNumber: pkg.flightOption.flightNumber,
      originCode: pkg.flightOption.originCode,
      destinationCode: pkg.flightOption.destinationCode,
      departureTime: pkg.flightOption.departureTime.toISOString(),
      arrivalTime: pkg.flightOption.arrivalTime.toISOString(),
      durationMinutes: pkg.flightOption.durationMinutes,
      stops: pkg.flightOption.stops,
      stopDetails: pkg.flightOption.stopDetails,
      refundable: pkg.flightOption.refundable,
      cabinClass: pkg.flightOption.cabinClass,
      loyaltyProgram: pkg.flightOption.loyaltyProgram,
      returnFlightNumber: pkg.flightOption.returnFlightNumber,
      returnDepartureTime: pkg.flightOption.returnDepartureTime?.toISOString() ?? null,
      returnArrivalTime: pkg.flightOption.returnArrivalTime?.toISOString() ?? null,
      returnDurationMinutes: pkg.flightOption.returnDurationMinutes,
      returnStops: pkg.flightOption.returnStops
    },
    hotel: {
      name: pkg.hotelOption.name,
      stars: pkg.hotelOption.stars,
      neighborhood: pkg.hotelOption.neighborhood,
      city: pkg.hotelOption.city,
      address: pkg.hotelOption.address,
      nights: pkg.hotelOption.nights,
      rating: pkg.hotelOption.rating,
      reviewCount: pkg.hotelOption.reviewCount,
      amenities: pkg.hotelOption.amenities,
      refundable: pkg.hotelOption.refundable,
      cancellationDeadline: pkg.hotelOption.cancellationDeadline?.toISOString() ?? null,
      roomType: pkg.hotelOption.roomType,
      bedType: pkg.hotelOption.bedType,
      distanceToCenterKm: pkg.hotelOption.distanceToCenterKm,
      totalPriceCents: pkg.hotelOption.totalPriceCents,
      pricePerNightCents: pkg.hotelOption.pricePerNightCents
    }
  };
}

export function mapBookingSummary(booking: Booking & { items: BookingItem[] }): BookingSummaryView {
  return {
    id: booking.id,
    confirmationNumber: booking.confirmationNumber,
    status: booking.status,
    totalPriceCents: booking.totalPriceCents,
    currency: booking.currency,
    bookedAt: booking.bookedAt?.toISOString() ?? null,
    cancellationDeadline: booking.cancellationDeadline?.toISOString() ?? null,
    items: booking.items.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      displayName: item.displayName,
      amountCents: item.amountCents,
      providerReference: item.providerReference
    }))
  };
}

export function mapTripDetail(input: {
  trip: Trip;
  request: TripRequest & {
    flightOptions: FlightOptionCache[];
    hotelOptions: HotelOptionCache[];
    packages: (TripPackage & { flightOption: FlightOptionCache; hotelOption: HotelOptionCache; booking?: Booking | null })[];
    agentMessages: { id: string; role: AgentMessageRole; type: AgentMessageType; content: string; createdAt: Date }[];
  };
  booking?: (Booking & { items: BookingItem[] }) | null;
}): TripDetailView {
  return {
    id: input.trip.id,
    title: input.trip.title,
    originLabel: input.trip.originLabel,
    destinationLabel: input.trip.destinationLabel,
    departureDate: input.trip.departureDate.toISOString(),
    returnDate: input.trip.returnDate.toISOString(),
    travelerCount: input.trip.travelerCount,
    status: input.trip.status as TripRequestStatus,
    selectedPackageId: input.request.selectedPackageId,
    requestId: input.request.id,
    budgetCents: input.request.budgetCents,
    currency: input.request.currency,
    flightOptionsCount: input.request.flightOptions.length,
    hotelOptionsCount: input.request.hotelOptions.length,
    packages: input.request.packages.map(mapPackage),
    agentMessages: input.request.agentMessages.map((message): AgentMessageView => ({
      id: message.id,
      role: message.role,
      type: message.type,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    })),
    booking: input.booking ? mapBookingSummary(input.booking) : null
  };
}
