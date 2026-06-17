import type { HourlyValue } from '@/types/solar';

const BASE = 'https://api.energyzero.nl/v1/energyprices';

interface EzPrice {
  readingDate: string; // ISO 8601 UTC, e.g. "2026-06-17T00:00:00Z"
  price: number;       // €/kWh, ex-VAT wholesale
}

interface EzResponse {
  Prices: EzPrice[];
  intervalType: number;
  fromDate: string;
  tillDate: string;
  average: number;
}

export async function fetchTodayPrices(): Promise<HourlyValue[]> {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const url = new URL(BASE);
  url.searchParams.set('fromDate', `${ymd}T00:00:00.000Z`);
  url.searchParams.set('tillDate', `${ymd}T23:59:59.000Z`);
  url.searchParams.set('interval', '4');    // hourly
  url.searchParams.set('usageType', '1');   // electricity
  url.searchParams.set('inclBtw', 'false'); // ex-VAT wholesale

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EnergyZero prices ${res.status}`);

  const json: EzResponse = await res.json();

  return json.Prices.map((p) => {
    const utcHour = new Date(p.readingDate).getUTCHours();
    const cetHour = (utcHour + 1) % 24; // UTC → CET (UTC+1), no DST adjustment needed for display
    return {
      hour: cetHour,
      value: p.price * 1000, // €/kWh → €/MWh
    };
  }).sort((a, b) => a.hour - b.hour);
}
