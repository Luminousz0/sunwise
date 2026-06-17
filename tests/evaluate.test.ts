import { describe, it, expect } from 'vitest';
import { computeSolarCurve } from '../src/lib/evaluate';
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
