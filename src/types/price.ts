export interface HourlyPrice {
  hour: number;        // 0–23 UTC+1
  eurPerMWh: number;   // day-ahead spot price
}

export interface PriceDay {
  date: string;        // YYYY-MM-DD
  market: string;      // e.g. "NL"
  hourly: HourlyPrice[];
}
