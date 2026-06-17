// The salderingsregeling (net-metering) ends 1 January 2027.
// After that date, exported solar earns only the feed-in tariff (~€0.04/kWh)
// instead of netting against retail (~€0.32/kWh). Self-consumption becomes
// far more valuable overnight.

export const SALDERING_END = new Date('2027-01-01T00:00:00');

// Indicative NL consumer prices (ex-BTW, 2025 estimate)
export const GRID_RETAIL_EUR_PER_KWH = 0.32;
export const FEED_IN_EUR_PER_KWH = 0.04; // post-saldering feed-in tariff

export function isSalderingActive(date: Date = new Date()): boolean {
  return date < SALDERING_END;
}
