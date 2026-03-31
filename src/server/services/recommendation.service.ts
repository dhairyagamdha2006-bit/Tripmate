import type { PackageLabel, Prisma, TripRequest, TripPreferenceSnapshot } from '@prisma/client';
import {
  buildPackageExplanation,
  choosePackageLabel,
  scorePackage,
  type PackageFlightCandidate,
  type PackageHotelCandidate
} from '@/lib/scoring/trip-packages';

type Combination = {
  flight: PackageFlightCandidate;
  hotel: PackageHotelCandidate;
  totalPriceCents: number;
  score: ReturnType<typeof scorePackage>;
};

type LabeledCombination = Combination & {
  label: PackageLabel;
  recommended: boolean;
};

export const recommendationService = {
  buildPackages(args: {
    request: TripRequest;
    snapshot?: TripPreferenceSnapshot | null;
    flights: PackageFlightCandidate[];
    hotels: PackageHotelCandidate[];
  }): Prisma.TripPackageUncheckedCreateInput[] {
    const { request, snapshot, flights, hotels } = args;

    const combinations: Combination[] = flights.flatMap((flight) =>
      hotels.map((hotel) => ({
        flight,
        hotel,
        totalPriceCents: flight.priceCents * request.travelerCount + hotel.totalPriceCents,
        score: scorePackage({ request, snapshot, flight, hotel })
      }))
    );

    combinations.sort((a, b) => b.score.overall - a.score.overall || a.totalPriceCents - b.totalPriceCents);

    const picks = new Map<string, LabeledCombination>();

    const addPick = (combination: Combination | undefined, label: PackageLabel, recommended = false) => {
      if (!combination) return;
      const key = `${combination.flight.id}:${combination.hotel.id}`;
      if (picks.has(key)) return;
      picks.set(key, { ...combination, label, recommended });
    };

    addPick(combinations[0], choosePackageLabel('best'), true);
    addPick([...combinations].sort((a, b) => a.totalPriceCents - b.totalPriceCents)[0], choosePackageLabel('cheapest'));
    addPick(
      [...combinations].sort((a, b) => a.flight.stops - b.flight.stops || a.flight.durationMinutes - b.flight.durationMinutes)[0],
      choosePackageLabel('convenient')
    );
    addPick(
      [...combinations].sort((a, b) => b.hotel.stars + (b.hotel.rating ?? 0) - (a.hotel.stars + (a.hotel.rating ?? 0)))[0],
      choosePackageLabel('premium')
    );
    addPick(
      [...combinations].sort((a, b) => Number(b.flight.refundable) + Number(b.hotel.refundable) - Number(a.flight.refundable) - Number(a.hotel.refundable))[0],
      choosePackageLabel('flexible')
    );

    for (const combination of combinations) {
      if (picks.size >= 4) break;
      addPick(combination, choosePackageLabel('best'), false);
    }

    return [...picks.values()].slice(0, 4).map((item) => {
      const narrative = buildPackageExplanation({
        label: item.label,
        score: item.score,
        request,
        flight: item.flight,
        hotel: item.hotel
      });

      return {
        tripRequestId: request.id,
        flightOptionCacheId: item.flight.id,
        hotelOptionCacheId: item.hotel.id,
        label: item.label,
        recommended: item.recommended,
        overallScore: item.score.overall,
        priceFitScore: item.score.priceFit,
        convenienceScore: item.score.convenience,
        travelDurationScore: item.score.travelDuration,
        hotelQualityScore: item.score.hotelQuality,
        refundFlexibilityScore: item.score.refundFlexibility,
        preferenceMatchScore: item.score.preferenceMatch,
        explanation: narrative.explanation,
        highlights: narrative.highlights,
        warnings: narrative.warnings,
        totalPriceCents: item.totalPriceCents,
        currency: request.currency
      };
    });
  }
};
