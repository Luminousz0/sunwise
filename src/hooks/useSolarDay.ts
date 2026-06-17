import { useState, useEffect } from 'react';
import { fetchSolarProfile } from '@/lib/pvgis';
import { fetchTodayCloudCover } from '@/lib/openMeteo';
import { fetchTodayPrices } from '@/lib/prices';
import { fetchTodayCarbon } from '@/lib/carbon';
import { computeSolarCurve, computeBestWindows, computeAdvice } from '@/lib/evaluate';
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
        const [typicalProfile, cloudForecast, prices, carbon] = await Promise.all([
          fetchSolarProfile({ lat, lon, ...PANEL_DEFAULTS }),
          fetchTodayCloudCover(lat, lon),
          fetchTodayPrices(),
          fetchTodayCarbon(),
        ]);

        if (cancelled) return;

        const { typical, today } = computeSolarCurve(typicalProfile, cloudForecast.hourly);
        const bestWindows = computeBestWindows(today, prices, carbon, 1.5);
        const advice = computeAdvice(today, prices, carbon, applianceIds);

        setState({
          loading: false,
          error: null,
          solar: today,
          typicalSolar: typical,
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
