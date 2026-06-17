import { useState, useEffect } from 'react';
import { computeSolarFromIrradiance } from '@/lib/pvgis';
import { fetchTodayWeatherAndSolar } from '@/lib/openMeteo';
import { fetchTodayPrices } from '@/lib/prices';
import { fetchTodayCarbon } from '@/lib/carbon';
import { computeBestWindows, computeAdvice } from '@/lib/evaluate';
import { PANEL_DEFAULTS } from '@/data/panelDefaults';
import type { HourlyValue } from '@/types/solar';
import type { BestWindowsResult, Advice } from '@/lib/evaluate';

export const DEFAULT_LAT = 52.3676; // Amsterdam
export const DEFAULT_LON = 4.9041;
const DEFAULT_APPLIANCES = ['washer', 'dishwasher', 'dryer'];

export interface SolarDay {
  loading: boolean;
  error: string | null;
  solar: HourlyValue[];
  typicalSolar: HourlyValue[];
  prices: HourlyValue[];
  carbon: HourlyValue[];
  bestWindows: BestWindowsResult | null;
  advice: Advice | null;
}

export function useSolarDay(
  lat = DEFAULT_LAT,
  lon = DEFAULT_LON,
  applianceIds: string[] = DEFAULT_APPLIANCES,
): SolarDay {
  const [state, setState] = useState<SolarDay>({
    loading: true,
    error: null,
    solar: [],
    typicalSolar: [],
    prices: [],
    carbon: [],
    bestWindows: null,
    advice: null,
  });

  const idsKey = applianceIds.join(',');

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    async function load() {
      try {
        const [weatherAndSolar, prices, carbon] = await Promise.all([
          fetchTodayWeatherAndSolar(lat, lon),
          fetchTodayPrices(),
          fetchTodayCarbon(),
        ]);

        if (cancelled) return;

        // Compute panel output from actual today's irradiance (clouds already baked in).
        const solar = computeSolarFromIrradiance(weatherAndSolar.solarIrradiance, {
          lat,
          lon,
          ...PANEL_DEFAULTS,
        });

        const bestWindows = computeBestWindows(solar, prices, carbon, 1.5);
        const advice = computeAdvice(solar, prices, carbon, applianceIds);

        setState({
          loading: false,
          error: null,
          solar,
          typicalSolar: solar, // actual today's data; no separate "typical" concept
          prices,
          carbon,
          bestWindows,
          advice,
        });
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: String(err) }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, idsKey]);

  return state;
}
