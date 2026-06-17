export interface HourlyCarbon {
  hour: number;             // 0–23 UTC+1
  gCO2PerKWh: number;       // grid carbon intensity
}

export interface CarbonDay {
  date: string;             // YYYY-MM-DD
  market: string;           // e.g. "NL"
  hourly: HourlyCarbon[];
}
