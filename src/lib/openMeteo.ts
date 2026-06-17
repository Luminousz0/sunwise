import type { WeatherForecast, HourlyCloudCover } from '@/types/weather';

const BASE = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
  hourly: {
    time: string[];        // "2026-06-17T00:00" local Amsterdam time
    cloud_cover: number[]; // 0–100 %
  };
}

/**
 * Fetch today's hourly cloud cover for a location.
 * Uses timezone=Europe/Amsterdam so times align with the CET hours
 * returned by the PVGIS client.
 */
export async function fetchTodayCloudCover(
  lat: number,
  lon: number,
): Promise<WeatherForecast> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: 'cloud_cover',
    timezone: 'Europe/Amsterdam',
    start_date: today,
    end_date: today,
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as OpenMeteoResponse;

  const hourly: HourlyCloudCover[] = json.hourly.time.map((t, i) => ({
    // Parse hour from "2026-06-17T14:00" — avoids JS Date tz pitfalls
    hour: parseInt(t.slice(11, 13), 10),
    cloudCoverPct: json.hourly.cloud_cover[i] ?? 0,
  }));

  return { date: today, lat, lon, hourly };
}
