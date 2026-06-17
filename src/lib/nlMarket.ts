import type { MarketDataSource } from '@/lib/market';
import { fetchTodayPrices } from '@/lib/prices';
import { fetchTodayCarbon } from '@/lib/carbon';

/**
 * NL market adapter — plugs into MarketDataSource.
 * Prices: EnergyZero public API (keyless, day-ahead wholesale €/MWh).
 * Carbon: static summer diurnal profile (see carbon.ts for rationale).
 * A second market = one new class implementing MarketDataSource.
 */
export const nlMarket: MarketDataSource = {
  market: 'NL',
  fetchPrices: fetchTodayPrices,
  fetchCarbon: fetchTodayCarbon,
};
