import type { HourlyValue } from '@/types/solar';
import type { HourlyCloudCover } from '@/types/weather';

export interface SolarCurve {
  typical: HourlyValue[];
  today: HourlyValue[];
}

/**
 * Build both solar curves from a PVGIS typical profile and today's cloud cover.
 * Pure function — no API calls, no side effects.
 *
 * Cloud model: 100% cover → 20% of typical (diffuse radiation floor).
 * Missing cloud data for an hour defaults to 50% (NL average).
 */
export function computeSolarCurve(
  typical: HourlyValue[],
  cloudCover: HourlyCloudCover[],
): SolarCurve {
  const coverByHour = new Map(cloudCover.map((c) => [c.hour, c.cloudCoverPct]));

  const today = typical.map(({ hour, value }) => {
    const pct = coverByHour.get(hour) ?? 50;
    const factor = 1 - (pct / 100) * 0.8; // 0%→1.0, 100%→0.2
    return { hour, value: value * factor };
  });

  return { typical, today };
}
