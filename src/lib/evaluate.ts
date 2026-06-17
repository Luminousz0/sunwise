import type { HourlyValue } from '@/types/solar';
import type { HourlyCloudCover } from '@/types/weather';
import { APPLIANCES } from '@/data/appliances';
import {
  isSalderingActive,
  GRID_RETAIL_EUR_PER_KWH,
  FEED_IN_EUR_PER_KWH,
} from '@/data/salderingConstants';

// ── Scoring weights ───────────────────────────────────────────────────────────
const SOLAR_WEIGHT = 0.5;  // solar availability drives self-consumption
const PRICE_WEIGHT = 0.3;  // high grid price = more savings from own power
const CARBON_WEIGHT = 0.2; // high grid carbon = cleaner to use solar

// Normalize an array to [0, 1]. All-zero → 0 (no signal). All-equal non-zero → 0.5.
function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => (max === 0 ? 0 : 0.5));
  return values.map((v) => (v - min) / range);
}

export interface HourScore {
  hour: number;
  score: number;         // 0–1 composite self-consumption score
  solarWh: number;       // solar production this hour (Wh)
  priceEurMWh: number;   // day-ahead spot price
  carbonGco2kWh: number; // grid carbon intensity
}

export interface BestWindow {
  startHour: number; // inclusive
  endHour: number;   // exclusive (endHour - startHour = window size)
  avgScore: number;  // 0–1
  totalSolarWh: number;
}

export interface BestWindowsResult {
  scores: HourScore[];
  windows: BestWindow[]; // up to 3 non-overlapping, sorted by score desc
}

/**
 * Score every hour of the day and return the best contiguous windows
 * for an appliance of the given duration.
 *
 * Inputs are raw HourlyValue[] from the data clients — no API calls here.
 * Duration is rounded to the nearest integer hour for the sliding window.
 */
export function computeBestWindows(
  solar: HourlyValue[],
  prices: HourlyValue[],
  carbon: HourlyValue[],
  durationHours: number,
): BestWindowsResult {
  const windowSize = Math.max(1, Math.round(durationHours));

  const byHour = (arr: HourlyValue[]) => new Map(arr.map((h) => [h.hour, h.value]));
  const solarMap = byHour(solar);
  const priceMap = byHour(prices);
  const carbonMap = byHour(carbon);

  const hours24 = Array.from({ length: 24 }, (_, h) => h);
  const solarVals = hours24.map((h) => solarMap.get(h) ?? 0);
  const priceVals = hours24.map((h) => priceMap.get(h) ?? 0);
  const carbonVals = hours24.map((h) => carbonMap.get(h) ?? 0);

  const solarNorm = normalize(solarVals);
  const priceNorm = normalize(priceVals);
  const carbonNorm = normalize(carbonVals);

  const scores: HourScore[] = hours24.map((hour, i) => ({
    hour,
    score: SOLAR_WEIGHT * solarNorm[i] + PRICE_WEIGHT * priceNorm[i] + CARBON_WEIGHT * carbonNorm[i],
    solarWh: solarVals[i],
    priceEurMWh: priceVals[i],
    carbonGco2kWh: carbonVals[i],
  }));

  if (windowSize > 24) return { scores, windows: [] };

  // Sliding window over all possible start hours
  const candidates = Array.from({ length: 25 - windowSize }, (_, start) => {
    const slice = scores.slice(start, start + windowSize);
    return {
      startHour: start,
      endHour: start + windowSize,
      avgScore: slice.reduce((s, h) => s + h.score, 0) / windowSize,
      totalSolarWh: slice.reduce((s, h) => s + h.solarWh, 0),
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  // Pick top 3 non-overlapping windows
  const windows: BestWindow[] = [];
  const used = new Set<number>();

  for (const c of candidates) {
    if (windows.length >= 3) break;
    const overlaps = Array.from({ length: windowSize }, (_, i) => c.startHour + i).some((h) =>
      used.has(h),
    );
    if (overlaps) continue;
    windows.push(c);
    for (let h = c.startHour; h < c.endHour; h++) used.add(h);
  }

  return { scores, windows };
}

// ── computeAdvice ─────────────────────────────────────────────────────────────

export interface ApplianceAdvice {
  applianceId: string;
  name: string;
  bestWindow: BestWindow;
  /** How much of the appliance's energy draw is covered by own solar (Wh) */
  solarCoverageWh: number;
  /** 0–100 */
  selfConsumptionPct: number;
  /** Estimated saving vs. importing all energy from the grid (€) */
  savingEur: number;
  salderingNote: string;
}

export interface Advice {
  salderingPhase: 'active' | 'ended';
  /** Top 3 individual hours by composite score — for clock highlights */
  topHours: number[];
  appliances: ApplianceAdvice[];
}

/**
 * Turn scored data into human-readable appliance advice with saldering framing.
 * Pure function — accepts a `referenceDate` so tests can control the date.
 */
export function computeAdvice(
  solar: HourlyValue[],
  prices: HourlyValue[],
  carbon: HourlyValue[],
  applianceIds: string[],
  referenceDate: Date = new Date(),
): Advice {
  const salderingActive = isSalderingActive(referenceDate);
  const salderingPhase: Advice['salderingPhase'] = salderingActive ? 'active' : 'ended';

  // Top 3 hours by score across all appliances (use a 1-hour window as the base)
  const { scores } = computeBestWindows(solar, prices, carbon, 1);
  const topHours = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.hour)
    .sort((a, b) => a - b);

  const appliances: ApplianceAdvice[] = applianceIds
    .map((id) => APPLIANCES[id])
    .filter(Boolean)
    .map((appliance) => {
      const { windows } = computeBestWindows(
        solar,
        prices,
        carbon,
        appliance.durationHours,
      );

      const bestWindow = windows[0];
      if (!bestWindow) return null;

      const applianceWh = appliance.kWh * 1000;
      const solarCoverageWh = Math.min(bestWindow.totalSolarWh, applianceWh);
      const selfConsumptionPct = (solarCoverageWh / applianceWh) * 100;

      // Saving = energy covered by own solar × what you'd otherwise pay to import.
      // Post-saldering we also add the opportunity cost of exporting at the low
      // feed-in tariff instead of self-consuming.
      const savingEur = salderingActive
        ? (solarCoverageWh / 1000) * GRID_RETAIL_EUR_PER_KWH
        : (solarCoverageWh / 1000) * (GRID_RETAIL_EUR_PER_KWH - FEED_IN_EUR_PER_KWH);

      const salderingNote = salderingActive
        ? `Saldering geldt nog t/m 31-12-2026 — exporteren telt nog mee. Zelf gebruiken is zekerheid.`
        : `Saldering afgelopen — exporteren levert slechts €${FEED_IN_EUR_PER_KWH.toFixed(2)}/kWh. Zelf gebruiken bespaart €${GRID_RETAIL_EUR_PER_KWH.toFixed(2)}/kWh.`;

      return {
        applianceId: appliance.id,
        name: appliance.name,
        bestWindow,
        solarCoverageWh,
        selfConsumptionPct,
        savingEur,
        salderingNote,
      } satisfies ApplianceAdvice;
    })
    .filter((a): a is ApplianceAdvice => a !== null);

  return { salderingPhase, topHours, appliances };
}

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
