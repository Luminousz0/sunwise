import type { HourlyValue } from '@/types/solar';

/**
 * Adapter contract for a market's day-ahead price and carbon data.
 * Adding a second market (DE, BE, …) = one new class implementing this interface.
 */
export interface MarketDataSource {
  readonly market: string;           // ISO 3166-1 alpha-2, e.g. "NL"
  fetchPrices(): Promise<HourlyValue[]>; // day-ahead spot price, normalized to €/MWh
  fetchCarbon(): Promise<HourlyValue[]>; // carbon intensity, gCO₂eq/kWh
}
