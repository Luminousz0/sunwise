export interface HourlyCloudCover {
  hour: number; // 0–23 UTC+1
  cloudCoverPct: number; // 0–100
}

export interface WeatherForecast {
  date: string; // YYYY-MM-DD
  lat: number;
  lon: number;
  hourly: HourlyCloudCover[];
}
