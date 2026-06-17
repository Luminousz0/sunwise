import type { HourlyValue } from '@/types/solar';
import type { HourlyCloudCover } from '@/types/weather';

const BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc';

// Our convention: 0=N, 90=E, 180=S, 270=W
// PVGIS convention: 0=S, -90=E, 90=W
function toAspect(azimuth: number): number {
  const a = azimuth - 180;
  return a < -180 ? a + 360 : a;
}

interface PvgisRecord {
  time: string; // "YYYYMMDD:HHMM" UTC
  P: number;    // W instantaneous — equals Wh for a 1-hour interval
}

// Returns CET local hour (UTC+1); good enough for a typical profile (ignores DST)
function parseTime(time: string): { month: number; hour: number } {
  const month = parseInt(time.slice(4, 6), 10);
  const hourUtc = parseInt(time.slice(9, 11), 10);
  return { month, hour: (hourUtc + 1) % 24 };
}

export interface SolarParams {
  lat: number;
  lon: number;
  azimuth: number; // 0=N, 90=E, 180=S, 270=W
  tilt: number;    // degrees from horizontal
  kWp: number;
}

/**
 * Fetch a typical daily solar profile for the current calendar month.
 * Returns HourlyValue[24] — average Wh at each CET hour across the month.
 * PVGIS 2023 data; Workbox caches it for 30 days (see vite.config.ts).
 */
export async function fetchSolarProfile(params: SolarParams): Promise<HourlyValue[]> {
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const url = new URL(BASE);
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lon));
  url.searchParams.set('startyear', '2023');
  url.searchParams.set('endyear', '2023');
  url.searchParams.set('pvcalculation', '1');
  url.searchParams.set('peakpower', String(params.kWp));
  url.searchParams.set('pvtechchoice', 'crystSi');
  url.searchParams.set('mountingplace', 'building');
  url.searchParams.set('angle', String(params.tilt));
  url.searchParams.set('aspect', String(toAspect(params.azimuth)));
  url.searchParams.set('loss', '14'); // typical system losses %
  url.searchParams.set('outputformat', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`PVGIS ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { outputs: { hourly: PvgisRecord[] } };

  const sums = new Array<number>(24).fill(0);
  const counts = new Array<number>(24).fill(0);

  for (const r of json.outputs.hourly) {
    const { month, hour } = parseTime(r.time);
    if (month === currentMonth) {
      sums[hour] += r.P;
      counts[hour]++;
    }
  }

  return sums.map((sum, hour) => ({
    hour,
    value: counts[hour] > 0 ? sum / counts[hour] : 0,
  }));
}

/**
 * Adjust a typical solar curve for today's measured cloud cover.
 * At 100% cloud cover ~20% of irradiance still reaches the panels (diffuse).
 * At 0% clouds the typical output is unchanged (PVGIS typical already reflects
 * average NL cloudiness — this only scales relative to that baseline).
 */
export function adjustForClouds(
  typical: HourlyValue[],
  cloudCover: HourlyCloudCover[],
): HourlyValue[] {
  const coverByHour = new Map(cloudCover.map((c) => [c.hour, c.cloudCoverPct]));
  return typical.map(({ hour, value }) => {
    const pct = coverByHour.get(hour) ?? 50; // default to average if missing
    const factor = 1 - (pct / 100) * 0.8;    // 0% clouds→1.0, 100%→0.2
    return { hour, value: value * factor };
  });
}
