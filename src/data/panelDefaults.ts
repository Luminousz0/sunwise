// Typical NL residential solar installation used when a household has not yet
// configured their own roof. South-facing 35° pitch, 4 kWp system.
export const PANEL_DEFAULTS = {
  azimuth: 180, // South-facing (0=N, 90=E, 180=S, 270=W)
  tilt: 35,     // degrees from horizontal — common NL roof pitch
  kWp: 4.0,     // average NL residential installation (CBS 2024)
} as const;
