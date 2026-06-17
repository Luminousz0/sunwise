export interface HourlyValue {
  hour: number; // 0–23 UTC+1
  value: number;
}

export interface SolarProfile {
  lat: number;
  lon: number;
  azimuth: number;   // degrees: 0=N, 90=E, 180=S, 270=W
  tilt: number;      // degrees from horizontal
  kWp: number;       // installed peak power
  typical: HourlyValue[];   // PVGIS typical year, hourly Wh
  today: HourlyValue[];     // typical adjusted by today's cloud cover
}
