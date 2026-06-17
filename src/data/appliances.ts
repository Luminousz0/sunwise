export interface Appliance {
  id: string;
  name: string;          // Dutch display name
  durationHours: number; // typical run time (hours)
  kWh: number;           // typical energy consumption per cycle
  flexible: boolean;     // can it be scheduled freely?
}

export const APPLIANCES: Record<string, Appliance> = {
  washer: {
    id: 'washer',
    name: 'Wasmachine',
    durationHours: 1.5,
    kWh: 0.9,
    flexible: true,
  },
  dryer: {
    id: 'dryer',
    name: 'Droger',
    durationHours: 1.0,
    kWh: 2.5,
    flexible: true,
  },
  dishwasher: {
    id: 'dishwasher',
    name: 'Vaatwasser',
    durationHours: 1.5,
    kWh: 1.0,
    flexible: true,
  },
  ev: {
    id: 'ev',
    name: 'Elektrische auto',
    durationHours: 4.0,
    kWh: 15.0,
    flexible: true,
  },
  heatpump: {
    id: 'heatpump',
    name: 'Warmtepomp',
    durationHours: 3.0,
    kWh: 6.0,
    flexible: true,
  },
  oven: {
    id: 'oven',
    name: 'Oven',
    durationHours: 1.0,
    kWh: 1.5,
    flexible: true,
  },
};
