import type { WeatherForecast, HourlyCloudCover } from '@/types/weather';
import type { HourlyValue } from '@/types/solar';

const BASE = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    cloud_cover: number[];
    shortwave_radiation: number[]; // global horizontal irradiance, W/m²
  };
}

export interface WeatherAndSolar {
  cloudCover: WeatherForecast;
  solarIrradiance: HourlyValue[]; // W/m², hour 0–23 Amsterdam time
}

/**
 * Fetch today's hourly cloud cover AND solar irradiance for a location.
 * timezone=Europe/Amsterdam keeps hours aligned with local time.
 */
export async function fetchTodayWeatherAndSolar(
  lat: number,
  lon: number,
): Promise<WeatherAndSolar> {
  const today = new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: 'cloud_cover,shortwave_radiation',
    timezone: 'Europe/Amsterdam',
    start_date: today,
    end_date: today,
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as OpenMeteoResponse;

  const hourly: HourlyCloudCover[] = json.hourly.time.map((t, i) => ({
    hour: parseInt(t.slice(11, 13), 10),
    cloudCoverPct: json.hourly.cloud_cover[i] ?? 0,
  }));

  const solarIrradiance: HourlyValue[] = json.hourly.time.map((t, i) => ({
    hour: parseInt(t.slice(11, 13), 10),
    value: json.hourly.shortwave_radiation[i] ?? 0,
  }));

  return {
    cloudCover: { date: today, lat, lon, hourly },
    solarIrradiance,
  };
}

// Keep old export name for any existing callers.
export async function fetchTodayCloudCover(lat: number, lon: number): Promise<WeatherForecast> {
  return (await fetchTodayWeatherAndSolar(lat, lon)).cloudCover;
}
