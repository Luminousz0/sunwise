import { motion } from 'framer-motion';
import type { HourlyValue } from '@/types/solar';
import type { BestWindow } from '@/lib/evaluate';

interface Props {
  solar: HourlyValue[];
  prices: HourlyValue[];
  carbon: HourlyValue[];
  bestWindows: BestWindow[];
  currentHour: number;
}

// Green (low/cheap/clean) → Red (high/expensive/dirty) — tuned for dark backgrounds
function heatColor(norm: number): string {
  const hue = Math.round(128 - norm * 128);
  const sat = 68;
  const lit = norm > 0.5 ? 50 : 56;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function toMaxNorm(arr: HourlyValue[]): number[] {
  const max = Math.max(...arr.map((h) => h.value), 1);
  return arr.map((h) => h.value / max);
}

function toMinMaxNorm(arr: HourlyValue[]): number[] {
  const vals = arr.map((h) => h.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return vals.map((v) => (v - min) / range);
}

const HOUR_LABELS = [0, 6, 12, 18, 23];

// Dark-theme bar colors
const BAR_OFF = '#18182a';
const BAR_PROD = '#d97706';  // amber-600 — production
const BAR_BEST = '#f59e0b';  // amber-400 — best window (brighter)

export default function EnergyClock({
  solar,
  prices,
  carbon,
  bestWindows,
  currentHour,
}: Props) {
  const solarNorm = toMaxNorm(solar);
  const priceNorm = toMinMaxNorm(prices);
  const carbonNorm = toMinMaxNorm(carbon);

  const bestSet = new Set(
    bestWindows.flatMap((w) =>
      Array.from({ length: w.endHour - w.startHour }, (_, i) => w.startHour + i),
    ),
  );

  return (
    <div className="w-full select-none">
      {/* Solar bar chart */}
      <div
        className="relative flex h-44 items-end gap-px overflow-hidden rounded-xl"
        style={{ background: '#0e0e1a' }}
      >
        {/* Warm radial glow at the solar peak */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 130% at 50% 100%, rgba(245,158,11,0.18) 0%, rgba(251,146,60,0.06) 40%, transparent 70%)',
          }}
        />

        {/* Best-window background column */}
        {bestWindows.slice(0, 1).map((w) => (
          <motion.div
            key={w.startHour}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-0 rounded-sm"
            style={{
              left: `${(w.startHour / 24) * 100}%`,
              width: `${((w.endHour - w.startHour) / 24) * 100}%`,
              height: '100%',
              background: 'rgba(245,158,11,0.07)',
              borderTop: '1px solid rgba(245,158,11,0.25)',
            }}
          />
        ))}

        {/* Current-hour glowing indicator */}
        <motion.div
          className="absolute bottom-0 z-10"
          style={{
            left: `${((currentHour + 0.5) / 24) * 100}%`,
            width: '2px',
            height: '100%',
            transform: 'translateX(-1px)',
            background: 'rgba(245,158,11,0.95)',
            boxShadow: '0 0 8px rgba(245,158,11,0.9), 0 0 20px rgba(245,158,11,0.4)',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />

        {/* Bars */}
        {solar.map((_, i) => {
          const h = solarNorm[i] ?? 0;
          const isBest = bestSet.has(i);
          return (
            <motion.div
              key={i}
              className="flex-1 origin-bottom rounded-t-sm"
              style={{
                backgroundColor: isBest ? BAR_BEST : h > 0.05 ? BAR_PROD : BAR_OFF,
                minHeight: 2,
                boxShadow: isBest
                  ? '0 0 10px rgba(245,158,11,0.7), 0 0 20px rgba(245,158,11,0.3)'
                  : h > 0.05 ? '0 0 4px rgba(217,119,6,0.25)' : 'none',
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(h, 0.02) }}
              transition={{ delay: i * 0.012, type: 'spring', stiffness: 280, damping: 24 }}
            />
          );
        })}
      </div>

      {/* Price strip */}
      <div className="mt-2 flex h-3 gap-px overflow-hidden rounded-sm">
        {prices.map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: heatColor(priceNorm[i] ?? 0) }}
            title={`${prices[i]?.value.toFixed(0)} €/MWh`}
          />
        ))}
      </div>

      {/* Carbon strip */}
      <div className="mt-1 flex h-3 gap-px overflow-hidden rounded-sm">
        {carbon.map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: heatColor(carbonNorm[i] ?? 0) }}
            title={`${carbon[i]?.value.toFixed(0)} gCO₂/kWh`}
          />
        ))}
      </div>

      {/* Strip labels */}
      <div className="mt-1 flex gap-px text-[10px] text-ink-3">
        <span className="flex-1">Prijs</span>
        <span className="flex-1 text-right">CO₂</span>
      </div>

      {/* Hour axis */}
      <div className="relative mt-2 h-4 text-[10px] text-ink-3">
        {HOUR_LABELS.map((h) => (
          <span
            key={h}
            className="absolute"
            style={{ left: `${(h / 24) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {String(h).padStart(2, '0')}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px] text-ink-2">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: BAR_BEST, boxShadow: '0 0 6px rgba(245,158,11,0.6)' }}
          />
          Beste uren
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_PROD }} />
          Productie
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-0.5"
            style={{ background: 'rgba(245,158,11,0.9)', boxShadow: '0 0 4px rgba(245,158,11,0.8)' }}
          />
          Nu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-gradient-to-r from-leaf to-pricey" />
          goedkoop → duur / schoon → vies
        </span>
      </div>
    </div>
  );
}
