import type { PricingSettings, RiderTier } from "@goshats/types";

export interface FareBreakdown {
  fareAmountKobo: number;
  bookingFeeKobo: number;
  totalAmountKobo: number;
}

export function calculateFare(
  settings: PricingSettings,
  distanceMeters: number,
  tier: RiderTier,
  extraStops: number = 0,
): FareBreakdown {
  const km = distanceMeters / 1000;
  const tierMultiplier = settings.tierMultipliers[tier] ?? 1.0;
  const surgeMultiplier = settings.surgeMultiplier ?? 1.0;

  // Base fare + distance rate + extra stop fees
  let fare =
    settings.baseFareKobo +
    Math.ceil(km) * settings.perKmRateKobo +
    extraStops * settings.perStopFeeKobo;

  // Apply tier & surge multipliers
  fare = Math.round(fare * tierMultiplier * surgeMultiplier);

  // Enforce minimum
  fare = Math.max(fare, settings.minimumFareKobo);

  // Booking fee (percentage of fare)
  const bookingFeeKobo = Math.round(fare * (settings.bookingFeePercent / 100));

  return {
    fareAmountKobo: fare,
    bookingFeeKobo,
    totalAmountKobo: fare + bookingFeeKobo,
  };
}
