import { PackageLabel } from '@prisma/client';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreCombination(input: {
  budgetCents: number;
  preferDirectFlights: boolean;
  refundableOnly: boolean;
  hotelStarLevel: number;
  flight: any;
  hotel: any;
}) {
  const totalPrice = input.flight.priceCents + input.hotel.totalPriceCents;
  const budgetDelta = Math.abs(totalPrice - input.budgetCents);
  const priceFit = clamp(100 - (budgetDelta / Math.max(input.budgetCents, 1)) * 100);
  const convenience = clamp(100 - input.flight.stops * 18 - Math.max(0, (input.flight.durationMinutes - 360) / 6) - Math.max(0, (input.hotel.distanceToCenterKm ?? 0) * 5));
  const travelDuration = clamp(100 - Math.max(0, input.flight.durationMinutes - 300) / 4);
  const hotelQuality = clamp(input.hotel.stars * 16 + (input.hotel.rating ?? 0) * 8 + Math.min(10, (input.hotel.reviewCount ?? 0) / 40));
  const refundFlexibility = clamp((input.flight.refundable ? 40 : 0) + (input.hotel.refundable ? 60 : 10));
  const preferenceMatch = clamp(
    (input.preferDirectFlights ? (input.flight.stops === 0 ? 45 : 10) : 25) +
      (input.refundableOnly ? (input.hotel.refundable && input.flight.refundable ? 35 : 10) : 20) +
      Math.max(0, 30 - Math.abs(input.hotel.stars - input.hotelStarLevel) * 10)
  );

  const overall = clamp(
    priceFit * 0.25 +
      convenience * 0.2 +
      travelDuration * 0.15 +
      hotelQuality * 0.15 +
      refundFlexibility * 0.1 +
      preferenceMatch * 0.15
  );

  const highlights = [
    totalPrice <= input.budgetCents ? 'Stays within your stated budget.' : 'Over budget, but potentially stronger on comfort or convenience.',
    input.flight.stops === 0 ? 'Nonstop outbound flight.' : `${input.flight.stops} stop${input.flight.stops === 1 ? '' : 's'} on the outbound itinerary.`,
    input.hotel.refundable ? 'Hotel rate includes cancellation flexibility.' : 'Hotel rate is less flexible on cancellation.'
  ];

  const warnings = [
    totalPrice > input.budgetCents ? 'This package exceeds the original budget target.' : null,
    !input.flight.refundable ? 'Flight fare is not explicitly refundable.' : null,
    (input.hotel.distanceToCenterKm ?? 0) > 5 ? 'Hotel is farther from the city center.' : null
  ].filter(Boolean) as string[];

  const explanation = [
    `This option scores ${overall}/100 overall.`,
    `Price fit is ${priceFit}/100 and convenience is ${convenience}/100.`,
    `Hotel quality contributes ${hotelQuality}/100 with refund flexibility at ${refundFlexibility}/100.`
  ].join(' ');

  return {
    totalPrice,
    priceFit,
    convenience,
    travelDuration,
    hotelQuality,
    refundFlexibility,
    preferenceMatch,
    overall,
    explanation,
    highlights,
    warnings
  };
}

export const recommendationService = {
  buildPackages(input: {
    request: any;
    flights: any[];
    hotels: any[];
  }) {
    const flights = [...input.flights].sort((a, b) => a.priceCents - b.priceCents).slice(0, 6);
    const hotels = [...input.hotels].sort((a, b) => a.totalPriceCents - b.totalPriceCents).slice(0, 6);

    const combinations = flights.flatMap((flight) =>
      hotels.map((hotel) => {
        const scores = scoreCombination({
          budgetCents: input.request.budgetCents,
          preferDirectFlights: input.request.preferDirectFlights,
          refundableOnly: input.request.refundableOnly,
          hotelStarLevel: input.request.hotelStarLevel,
          flight,
          hotel
        });

        return {
          flight,
          hotel,
          ...scores
        };
      })
    );

    combinations.sort((a, b) => b.overall - a.overall || a.totalPrice - b.totalPrice);

    const labels = [
      {
        label: PackageLabel.BEST_VALUE,
        pick: (items: typeof combinations) => items[0]
      },
      {
        label: PackageLabel.CHEAPEST,
        pick: (items: typeof combinations) => [...items].sort((a, b) => a.totalPrice - b.totalPrice)[0]
      },
      {
        label: PackageLabel.MOST_CONVENIENT,
        pick: (items: typeof combinations) => [...items].sort((a, b) => a.flight.stops - b.flight.stops || a.flight.durationMinutes - b.flight.durationMinutes)[0]
      },
      {
        label: PackageLabel.PREMIUM,
        pick: (items: typeof combinations) => [...items].sort((a, b) => b.hotelQuality - a.hotelQuality || b.hotel.stars - a.hotel.stars)[0]
      },
      {
        label: PackageLabel.MOST_FLEXIBLE,
        pick: (items: typeof combinations) => [...items].sort((a, b) => b.refundFlexibility - a.refundFlexibility)[0]
      }
    ];

    const selected = [] as Array<any>;
    const seen = new Set<string>();

    for (const item of labels) {
      const candidate = item.pick(combinations);
      if (!candidate) continue;
      const key = `${candidate.flight.id}:${candidate.hotel.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push({ ...candidate, label: item.label, recommended: item.label === PackageLabel.BEST_VALUE });
    }

    for (const combo of combinations) {
      if (selected.length >= 5) break;
      const key = `${combo.flight.id}:${combo.hotel.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push({ ...combo, label: PackageLabel.BEST_VALUE, recommended: false });
    }

    return selected.map((combo, index) => ({
      label: combo.label,
      recommended: combo.recommended || index === 0,
      overallScore: combo.overall,
      priceFitScore: combo.priceFit,
      convenienceScore: combo.convenience,
      travelDurationScore: combo.travelDuration,
      hotelQualityScore: combo.hotelQuality,
      refundFlexibilityScore: combo.refundFlexibility,
      preferenceMatchScore: combo.preferenceMatch,
      explanation: combo.explanation,
      highlights: combo.highlights,
      warnings: combo.warnings,
      totalPriceCents: combo.totalPrice,
      currency: combo.flight.currency,
      flightOptionCacheId: combo.flight.id,
      hotelOptionCacheId: combo.hotel.id
    }));
  }
};
