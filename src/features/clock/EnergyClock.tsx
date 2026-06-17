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

// 0 → green hsl(120), 1 → red hsl(0)
function heatColor(norm: number, lightness = 38): string {
  return `hsl(${Math.round(120 - norm * 120)}, 65%, ${lightness}%)`;
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

export default function EnergyClock({
  solar,
  prices,
  carbon,
  bestWindows,
  currentHour,
}: Props) {
  const solarNorm = toMaxNorm(solar);
  // high price = bad (red) when solar is low; invert so cheap=green
  const priceNorm = toMinMaxNorm(prices);
  const carbonNorm = toMinMaxNorm(carbon);

  const bestSet = new Set(
    bestWindows.flatMap((w) =>
      Array.from({ length: w.endHour - w.startHour }, (_, i) => w.startHour + i),
    ),
  );
  const topWindow = bestWindows[0];

  // Context sentence: what's happening right now relative to best window
  let contextLine: string | null = null;
  if (topWindow) {
    if (currentHour >= topWindow.startHour && currentHour < topWindow.endHour) {
      contextLine = 'Je zit nu in de beste uren — zet grote apparaten aan.';
    } else if (currentHour < topWindow.startHour) {
      const hoursUntil = topWindow.startHour - currentHour;
      contextLine = `Beste uren beginnen over ${hoursUntil} uur (${String(topWindow.startHour).padStart(2, '0')}:00–${String(topWindow.endHour).padStart(2, '0')}:00).`;
    } else {
      const next = bestWindows.find((w) => w.startHour > currentHour);
      if (next) {
        contextLine = `Volgende raam: ${String(next.startHour).padStart(2, '0')}:00–${String(next.endHour).padStart(2, '0')}:00.`;
      } else {
        contextLine = 'Zonnepiek voorbij voor vandaag.';
      }
    }
  }

  return (
    <div className="w-full select-none">
      {/* Headline */}
      {topWindow && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-1 text-sm text-stone-400"
        >
          Beste uren vandaag:{' '}
          <span className="font-semibold text-sun">
            {String(topWindow.startHour).padStart(2, '0')}:00
            {' – '}
            {String(topWindow.endHour).padStart(2, '0')}:00
          </span>
        </motion.p>
      )}

      {/* Context sentence */}
      {contextLine && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-3 text-xs text-stone-500 leading-relaxed"
        >
          {contextLine}
        </motion.p>
      )}

      {/* Solar bar chart */}
      <div className="relative flex items-end h-36 gap-px rounded-sm overflow-hidden">
        {/* Subtle dawn/dusk gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Best-window glow overlay */}
        {bestWindows.slice(0, 1).map((w) => (
          <motion.div
            key={w.startHour}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-0 rounded-sm border-t-2 border-sun/60 bg-sun/10"
            style={{
              left: `${(w.startHour / 24) * 100}%`,
              width: `${((w.endHour - w.startHour) / 24) * 100}%`,
              height: '100%',
            }}
          />
        ))}

        {/* Current-hour pulsing indicator */}
        <motion.div
          className="absolute bottom-0 w-px bg-white/70 z-10"
          style={{ left: `${((currentHour + 0.5) / 24) * 100}%`, height: '100%' }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />

        {/* Bars */}
        {solar.map((_, i) => {
          const h = solarNorm[i] ?? 0;
          const isBest = bestSet.has(i);
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm origin-bottom"
              style={{
                backgroundColor: isBest ? '#f59e0b' : h > 0.05 ? '#78450a' : '#1c1917',
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
      <div className="flex h-3 gap-px mt-1">
        {prices.map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ backgroundColor: heatColor(priceNorm[i] ?? 0) }}
            title={`${prices[i]?.value.toFixed(0)} €/MWh`}
          />
        ))}
      </div>

      {/* Carbon strip */}
      <div className="flex h-3 gap-px mt-0.5">
        {carbon.map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ backgroundColor: heatColor(carbonNorm[i] ?? 0, 30) }}
            title={`${carbon[i]?.value.toFixed(0)} gCO₂/kWh`}
          />
        ))}
      </div>

      {/* Strip labels */}
      <div className="flex mt-1 text-[10px] text-stone-600 gap-px">
        <span className="flex-1">Prijs</span>
        <span className="flex-1 text-right">CO₂</span>
      </div>

      {/* Hour axis */}
      <div className="relative mt-2 h-4 text-[10px] text-stone-500">
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
    </div>
  );
}
