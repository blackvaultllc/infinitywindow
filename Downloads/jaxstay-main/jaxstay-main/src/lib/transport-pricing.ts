// Pure pricing logic for Pet Transportation. Used by both the client booking
// form (live estimate) and the server-side Stripe checkout (authoritative).
import type { DistanceTierKey, TripTypeKey } from "@/data/city-coords";

export const ROUND_TRIP_MULTIPLIER = 1.8;

export type TierPrices = Partial<Record<DistanceTierKey, number>>; // dollars

export type TransportQuoteInput = {
  tripType: TripTypeKey;
  tier: DistanceTierKey;
  prices: TierPrices;
  extraStops?: number;
  extraStopFeeCents?: number | null;
  waitingHours?: number;
  waitingFeePerHourCents?: number | null;
};

export type TransportQuote = {
  baseCents: number;
  addonsCents: number;
  totalCents: number;
  /** True when sitter has not set a fixed price for this tier (50+ usually). */
  quoteOnly: boolean;
};

export function computeTransportQuote(input: TransportQuoteInput): TransportQuote {
  const dollars = input.prices[input.tier];
  const tierCents = dollars != null ? Math.round(Number(dollars) * 100) : 0;
  const quoteOnly = !tierCents;

  let baseCents = 0;
  if (!quoteOnly) {
    if (input.tripType === "round_trip") baseCents = Math.round(tierCents * ROUND_TRIP_MULTIPLIER);
    else if (input.tripType === "scheduled_return") baseCents = tierCents * 2;
    else baseCents = tierCents;
  }

  const extraStopFee = Math.max(0, input.extraStops ?? 0) * Math.max(0, input.extraStopFeeCents ?? 0);
  const waitingFee = Math.max(0, input.waitingHours ?? 0) * Math.max(0, input.waitingFeePerHourCents ?? 0);
  const addonsCents = extraStopFee + waitingFee;

  return {
    baseCents,
    addonsCents,
    totalCents: baseCents + addonsCents,
    quoteOnly,
  };
}

export function formatUSD(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
