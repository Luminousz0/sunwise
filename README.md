# Sunwise

**Solar self-consumption coach for Dutch households.**

The Netherlands ends net-metering (*salderingsregeling*) on January 1, 2027. After that date, exporting solar to the grid pays ~€ 0.04/kWh while importing costs ~€ 0.32/kWh — an 8× gap. Sunwise tells you **which hours today to run your washing machine, dishwasher, EV charger, or dryer** so you use your own panels' power instead of the grid's.

**Live:** https://sunwise-kappa.vercel.app

---

## What it does

1. **Energy clock** — a 24-hour timeline showing today's solar production, grid price, and carbon intensity side-by-side.
2. **Best windows** — highlights the top hours where solar is high, prices are low, and carbon is clean.
3. **Appliance advice** — per-appliance cards with the best run window, solar coverage %, and estimated savings in €.
4. **Saldering framing** — the UI explains what the 2027 deadline means for your specific situation.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Build | Vite 5 + TypeScript (strict) |
| UI | React 18 + Tailwind CSS 3 + Framer Motion 11 |
| Solar + weather | [Open-Meteo](https://open-meteo.com/) (hourly solar irradiance + cloud cover, free, no key) |
| Prices | [EnergyZero](https://api.energyzero.nl) (NL day-ahead, free, no key) |
| Carbon | Static NL diurnal profile (all real-time sources require keys) |
| Address | [PDOK Locatieserver](https://api.pdok.nl) (NL geocoding, free, no key) |
| PWA | vite-plugin-pwa + Workbox (offline-capable, installable) |
| Deploy | Vercel free tier |

**$0 operating cost.** Every data source is free and keyless.

---

## How the engine works

All scoring logic lives in [`src/lib/evaluate.ts`](src/lib/evaluate.ts) as pure functions — no API calls, no React, fully unit-tested.

1. `computeSolarFromIrradiance` — converts Open-Meteo's hourly GHI (W/m²) to estimated panel output (Wh) for the configured system (kWp, tilt, azimuth, losses).
2. `computeBestWindows` — normalizes solar, price, and carbon per hour; scores each with weights (solar 50%, price 30%, carbon 20%); finds top-3 non-overlapping windows via sliding window.
3. `computeAdvice` — for each selected appliance, finds its best contiguous run window, computes solar coverage (Wh overlap with solar curve), saving in € vs grid, and a saldering-aware note.

---

## Running locally

```bash
npm install
npm run dev       # dev server
npm run build     # type-check + production build
npm run test      # 25 unit tests (Vitest)
```

---

## Extending to a second market

All external market data is behind a `MarketDataSource` interface ([`src/lib/market.ts`](src/lib/market.ts)):

```ts
interface MarketDataSource {
  readonly market: string;
  fetchPrices(): Promise<HourlyValue[]>;   // hourly €/MWh
  fetchCarbon(): Promise<HourlyValue[]>;   // hourly gCO₂/kWh
}
```

Adding Germany (ENTSO-E) or Belgium is one new adapter file + one line change in `useSolarDay.ts`. Open-Meteo is pan-European.

---

## Roadmap (not built in v1)

- **v1.x** — dynamic-tariff households (Tibber, Eneco); battery dispatch scheduling.
- **v2** — ENTSO-E adapter → all EU markets via `MarketDataSource`.
- **v3** — B2B carbon-aware scheduling for businesses with solar assets.
