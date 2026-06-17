import { describe, it, expect } from 'vitest';
import { computeSolarCurve, computeBestWindows } from '../src/lib/evaluate';
import type { HourlyValue } from '../src/types/solar';
import type { HourlyCloudCover } from '../src/types/weather';

const typical: HourlyValue[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  value: hour >= 6 && hour <= 20 ? 100 : 0, // simple daytime profile
}));

describe('computeSolarCurve', () => {
  it('passes typical through unchanged', () => {
    const cover: HourlyCloudCover[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cloudCoverPct: 0,
    }));
    const { typical: out } = computeSolarCurve(typical, cover);
    expect(out).toEqual(typical);
  });

  it('returns 24 values for today', () => {
    const cover: HourlyCloudCover[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cloudCoverPct: 50,
    }));
    const { today } = computeSolarCurve(typical, cover);
    expect(today).toHaveLength(24);
  });

  it('0% cloud cover leaves output unchanged', () => {
    const cover: HourlyCloudCover[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cloudCoverPct: 0,
    }));
    const { today } = computeSolarCurve(typical, cover);
    today.forEach(({ hour, value }) => {
      expect(value).toBeCloseTo(typical[hour].value, 5);
    });
  });

  it('100% cloud cover reduces to 20% of typical', () => {
    const cover: HourlyCloudCover[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cloudCoverPct: 100,
    }));
    const { today } = computeSolarCurve(typical, cover);
    today.forEach(({ hour, value }) => {
      expect(value).toBeCloseTo(typical[hour].value * 0.2, 5);
    });
  });

  it('missing cloud data defaults to 50% (NL average)', () => {
    // Only provide cover for hour 12; rest default to 50%
    const cover: HourlyCloudCover[] = [{ hour: 12, cloudCoverPct: 0 }];
    const { today } = computeSolarCurve(typical, cover);
    // hour 12 → 0% cloud → factor 1.0 → value 100
    expect(today[12].value).toBeCloseTo(100, 5);
    // hour 10 → missing → defaults 50% → factor 0.6 → value 60
    expect(today[10].value).toBeCloseTo(60, 5);
  });

  it('night hours (value 0) stay 0 regardless of cloud cover', () => {
    const cover: HourlyCloudCover[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cloudCoverPct: 100,
    }));
    const { today } = computeSolarCurve(typical, cover);
    expect(today[0].value).toBe(0);
    expect(today[3].value).toBe(0);
    expect(today[23].value).toBe(0);
  });

  it('preserves hour order', () => {
    const cover: HourlyCloudCover[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cloudCoverPct: 30,
    }));
    const { today } = computeSolarCurve(typical, cover);
    today.forEach(({ hour }, i) => expect(hour).toBe(i));
  });
});

// ── helpers for computeBestWindows tests ─────────────────────────────────────

const flatPrices: HourlyValue[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  value: 100, // flat price — no price signal
}));

const flatCarbon: HourlyValue[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  value: 300, // flat carbon — no carbon signal
}));

// Solar peaks sharply at hours 11–13
const peakSolar: HourlyValue[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  value: hour >= 11 && hour <= 13 ? 400 : 0,
}));

describe('computeBestWindows', () => {
  it('returns 24 scores', () => {
    const { scores } = computeBestWindows(typical, flatPrices, flatCarbon, 1);
    expect(scores).toHaveLength(24);
  });

  it('scores are between 0 and 1', () => {
    const { scores } = computeBestWindows(typical, flatPrices, flatCarbon, 1);
    scores.forEach(({ score }) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  it('returns up to 3 windows', () => {
    const { windows } = computeBestWindows(typical, flatPrices, flatCarbon, 2);
    expect(windows.length).toBeLessThanOrEqual(3);
    expect(windows.length).toBeGreaterThan(0);
  });

  it('windows do not overlap', () => {
    const { windows } = computeBestWindows(typical, flatPrices, flatCarbon, 2);
    const usedHours = new Set<number>();
    for (const w of windows) {
      for (let h = w.startHour; h < w.endHour; h++) {
        expect(usedHours.has(h)).toBe(false);
        usedHours.add(h);
      }
    }
  });

  it('windows are sorted best-first', () => {
    const { windows } = computeBestWindows(typical, flatPrices, flatCarbon, 2);
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].avgScore).toBeLessThanOrEqual(windows[i - 1].avgScore);
    }
  });

  it('best window covers the solar peak when solar dominates', () => {
    // peakSolar is only nonzero at hours 11-13; flat price/carbon → solar wins
    const { windows } = computeBestWindows(peakSolar, flatPrices, flatCarbon, 1);
    const bestStart = windows[0].startHour;
    expect(bestStart).toBeGreaterThanOrEqual(11);
    expect(bestStart).toBeLessThanOrEqual(13);
  });

  it('all-zero solar still returns valid scores', () => {
    const noSolar: HourlyValue[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      value: 0,
    }));
    const { scores, windows } = computeBestWindows(noSolar, flatPrices, flatCarbon, 1);
    expect(scores).toHaveLength(24);
    expect(windows.length).toBeGreaterThan(0);
  });

  it('duration > 24 returns empty windows', () => {
    const { windows } = computeBestWindows(typical, flatPrices, flatCarbon, 25);
    expect(windows).toHaveLength(0);
  });

  it('window boundaries stay within 0–23', () => {
    const { windows } = computeBestWindows(typical, flatPrices, flatCarbon, 4);
    windows.forEach(({ startHour, endHour }) => {
      expect(startHour).toBeGreaterThanOrEqual(0);
      expect(endHour).toBeLessThanOrEqual(24);
    });
  });
});
