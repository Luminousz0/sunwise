export interface Address {
  label: string;   // human-readable display string from PDOK
  lat: number;
  lon: number;
}

export interface RoofConfig {
  azimuth: number;  // degrees: 0=N, 90=E, 180=S, 270=W
  tilt: number;     // degrees from horizontal
  kWp: number;      // installed peak power
}

export interface Household {
  address: Address;
  roof: RoofConfig;
  applianceIds: string[];  // keys from src/data/appliances.ts
}
