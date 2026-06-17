import type { HourlyValue } from '@/types/solar';

/**
 * NL carbon intensity — static diurnal profile.
 *
 * Why static: every real-time source for NL requires a non-embeddable key.
 *   - NED.nl (api.ned.nl): per-user registration + private X-AUTH-TOKEN
 *   - Electricity Maps (api.electricitymap.org): paid/free tier token required
 *   - ENTSO-E (web-api.tp.entsoe.eu): free but email-approval token required
 *   - stofradar.nl proxy (aggregated ENTSO-E): ECONNREFUSED as of 2026-06-17
 *
 * Profile basis:
 *   NL 2025 annual average: ~388 gCO₂eq/kWh (Electricity Maps grid review 2025).
 *   Summer midday trough: ~92 g (solar peak, ~66% below winter).
 *   Night/early-morning peak: ~450–480 g (gas baseload, no solar).
 *   Shape follows the solar irradiance curve inverted: carbon drops as panels push
 *   clean generation onto the grid, rebounding after sunset.
 *
 * This profile is deliberately summer-weighted because Sunwise's primary use case
 * is solar self-consumption coaching, which is most active in summer months.
 * Surface this uncertainty in the UI — never claim real-time precision.
 */

// gCO₂eq/kWh for CET hours 0–23, summer NL typical day
const NL_CARBON_PROFILE: readonly number[] = [
  460, // 00
  465, // 01
  470, // 02
  468, // 03
  462, // 04
  445, // 05 — early sun, small wind ramp
  400, // 06
  340, // 07 — solar coming in
  270, // 08
  200, // 09
  150, // 10
  115, // 11
  95,  // 12 — solar peak
  92,  // 13 — solar peak (lowest)
  100, // 14
  130, // 15 — solar declining
  180, // 16
  250, // 17
  320, // 18 — post-sunset ramp
  370, // 19
  400, // 20
  420, // 21
  440, // 22
  455, // 23
];

export async function fetchTodayCarbon(): Promise<HourlyValue[]> {
  return NL_CARBON_PROFILE.map((value, hour) => ({ hour, value }));
}
