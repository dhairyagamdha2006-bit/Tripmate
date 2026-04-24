import type { BookingSummaryView, PackageView, TripCardView } from '@/types/travel';

export function mapTripCard(trip: any): TripCardView {
  return {
    id: trip.id,
    title: trip.title,
    originLabel: trip.originLabel,
    destinationLabel: trip.destinationLabel,
    departureDate: trip.departureDate.toISOString(),
    returnDate: trip.returnDate.toISOString(),
    travelerCount: trip.travelerCount,
    status: trip.status,
    bookingStatus: trip.bookings?.[0]?.status ?? null,
    totalPriceCents: trip.bookings?.[0]?.totalPriceCents ?? null
  };
}

export function mapPackage(pkg: any): PackageView {
  return {
    id: pkg.id,
    label: pkg.label,
    recommended: pkg.recommended,
    explanation: pkg.explanation,
    highlights: pkg.highlights,
    warnings: pkg.warnings,
    totalPriceCents: pkg.totalPriceCents,
    currency: pkg.currency,
    score: {
      overall: pkg.overallScore,
      priceFit: pkg.priceFitScore,
      convenience: pkg.convenienceScore,
      travelDuration: pkg.travelDurationScore,
      hotelQuality: pkg.hotelQualityScore,
      refundFlexibility: pkg.refundFlexibilityScore,
      preferenceMatch: pkg.preferenceMatchScore
    },
    flight: {
      airline: pkg.flightOption.airline,
      flightNumber: pkg.flightOption.flightNumber,
      airlineCode: pkg.flightOption.airlineCode,
      departureTime: pkg.flightOption.departureTime.toISOString(),
      arrivalTime: pkg.flightOption.arrivalTime.toISOString(),
      durationMinutes: pkg.flightOption.durationMinutes,
      stops: pkg.flightOption.stops,
      refundable: pkg.flightOption.refundable,
      originCode: pkg.flightOption.originCode,
      destinationCode: pkg.flightOption.destinationCode,
      returnFlightNumber: pkg.flightOption.returnFlightNumber,
      returnDepartureTime: pkg.flightOption.returnDepartureTime?.toISOString() ?? null,
      returnArrivalTime: pkg.flightOption.returnArrivalTime?.toISOString() ?? null,
      returnDurationMinutes: pkg.flightOption.returnDurationMinutes ?? null,
      returnStops: pkg.flightOption.returnStops ?? null
    },
    hotel: {
      name: pkg.hotelOption.name,
      stars: pkg.hotelOption.stars,
      address: pkg.hotelOption.address,
      city: pkg.hotelOption.city,
      refundable: pkg.hotelOption.refundable,
      nights: pkg.hotelOption.nights,
      totalPriceCents: pkg.hotelOption.totalPriceCents,
      rating: pkg.hotelOption.rating,
      reviewCount: pkg.hotelOption.reviewCount,
      cancellationDeadline: pkg.hotelOption.cancellationDeadline?.toISOString() ?? null,
      distanceToCenterKm: pkg.hotelOption.distanceToCenterKm ?? null,
      roomType: pkg.hotelOption.roomType ?? null
    }
  };
}

export function mapBooking(booking: any): BookingSummaryView {
  return {
    id: booking.id,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    fulfillmentStatus: booking.fulfillmentStatus,
    totalPriceCents: booking.totalPriceCents,
    currency: booking.currency,
    confirmationNumber: booking.confirmationNumber,
    cancellationDeadline: booking.cancellationDeadline?.toISOString() ?? null,
    paymentIntentId: booking.paymentIntentId,
    providerBookingState: booking.providerBookingState,
    items: (booking.items ?? []).map((item: any) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      displayName: item.displayName,
      amountCents: item.amountCents,
      providerReference: item.providerReference
    }))
  };
}
