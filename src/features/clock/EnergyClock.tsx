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

// Natural green → terracotta heatmap (matches warm palette, visible on dark bg)
function heatColor(norm: number): string {
  // go (#6aa84f) at 0 → stop (#cf5a3e) at 1, via warm ochre midpoint
  const h = Math.round(110 - norm * 70); // 110 (yellow-green) → 40 (orange)
  const s = 52;
  const l = 48 + (1 - norm) * 8; // slightly brighter when cheap/clean
  return `hsl(${h}, ${s}%, ${l}%)`;
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

// Emerald-palette bar colors
const BAR_OFF = 'rgba(255,255,255,0.07)';  // subtle white — inactive hours
const BAR_PROD = '#059669';                // emerald-600 — production
const BAR_BEST = '#10B981';               // emerald-500 — best window

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
        style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '0.75rem' }}
      >
        {/* Warm radial glow at the peak — like sun warmth behind the bars */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 120% at 50% 100%, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0.05) 50%, transparent 70%)',
          }}
        />

        {/* Best-window highlight column */}
        {bestWindows.slice(0, 1).map((w) => (
          <motion.div
            key={w.startHour}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-0"
            style={{
              left: `${(w.startHour / 24) * 100}%`,
              width: `${((w.endHour - w.startHour) / 24) * 100}%`,
              height: '100%',
              background: 'rgba(16,185,129,0.08)',
              borderTop: '1px solid rgba(16,185,129,0.28)',
            }}
          />
        ))}

        {/* Current-hour indicator — warm gold, no aggressive glow */}
        <motion.div
          className="absolute bottom-0 z-10"
          style={{
            left: `${((currentHour + 0.5) / 24) * 100}%`,
            width: '1.5px',
            height: '100%',
            transform: 'translateX(-0.75px)',
            background: 'rgba(16,185,129,0.90)',
            boxShadow: '0 0 6px rgba(16,185,129,0.55)',
          }}
          animate={{ opacity: [0.45, 0.9, 0.45] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
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
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(h, 0.02) }}
              transition={{ delay: i * 0.012, type: 'spring', stiffness: 280, damping: 24 }}
            />
          );
        })}
      </div>

      {/* Price strip */}
      <div className="mt-2 flex h-2.5 gap-px overflow-hidden rounded-sm">
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
      <div className="mt-1 flex h-2.5 gap-px overflow-hidden rounded-sm">
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
      <div className="mt-1 flex gap-px text-[10px] text-warm/30">
        <span className="flex-1">Prijs</span>
        <span className="flex-1 text-right">CO₂</span>
      </div>

      {/* Hour axis */}
      <div className="relative mt-2 h-4 text-[10px] text-warm/30">
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
      <div
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 pt-3 text-[11px] text-warm/45"
        style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_BEST }} />
          Beste uren
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_PROD }} />
          Productie
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-px" style={{ background: 'rgba(16,185,129,0.90)' }} />
          Nu
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-4 rounded-sm"
            style={{ background: 'linear-gradient(to right, #6aa84f, #cf5a3e)' }}
          />
          goedkoop → duur
        </span>
      </div>
    </div>
  );
}
