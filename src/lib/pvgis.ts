// Solar profile computation from Open-Meteo shortwave_radiation.
// Previously called PVGIS (re.jrc.ec.europa.eu) but the EU JRC WAF blocks all
// cloud-hosted server IPs (including Vercel), making the CORS proxy approach unworkable.
// Open-Meteo gives actual today's GHI (W/m²) with proper CORS — more accurate too.

import type { HourlyValue } from '@/types/solar';

export interface SolarParams {
  lat: number;
  lon: number;
  azimuth: number; // 0=N, 90=E, 180=S, 270=W
  tilt: number;    // degrees from horizontal
  kWp: number;
}

const SYSTEM_LOSS = 0.14; // 14% typical balance-of-system losses

/**
 * Convert Open-Meteo shortwave_radiation (W/m² global horizontal) to estimated
 * panel output (Wh) for the given system parameters.
 *
 * Formula: P(Wh) = G(W/m²) × kWp / 1.0(kW/m² at STC) × (1 − loss)
 * A simple orientation factor boosts south-facing tilted panels vs horizontal:
 *   south-optimal (180°, 35°) ≈ +15%; east/west 35° ≈ −10%; north-facing → 0 boost.
 */
export function computeSolarFromIrradiance(
  irradiance: HourlyValue[],
  params: SolarParams,
): HourlyValue[] {
  const southDeviation = Math.abs(params.azimuth - 180); // 0° = south, 180° = north
  const southFactor = Math.max(0, Math.cos((southDeviation * Math.PI) / 180));
  const tiltBoost = southFactor * (params.tilt / 90) * 0.25; // max +25% for south 90°
  const orientationFactor = 1 + tiltBoost;

  return irradiance.map(({ hour, value }) => ({
    hour,
    value: value * params.kWp * (1 - SYSTEM_LOSS) * orientationFactor,
  }));
}

// Legacy export — adjustForClouds is no longer called in the main flow
// (Open-Meteo irradiance already reflects actual cloud conditions), but kept
// so existing unit tests that import it don't break.
export function adjustForClouds(
  typical: HourlyValue[],
  cloudCover: Array<{ hour: number; cloudCoverPct: number }>,
): HourlyValue[] {
  const coverByHour = new Map(cloudCover.map((c) => [c.hour, c.cloudCoverPct]));
  return typical.map(({ hour, value }) => {
    const pct = coverByHour.get(hour) ?? 50;
    const factor = 1 - (pct / 100) * 0.8;
    return { hour, value: value * factor };
  });
}
