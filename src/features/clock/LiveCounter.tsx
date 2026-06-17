import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import type { HourlyValue } from '@/types/solar';
import { GRID_RETAIL_EUR_PER_KWH } from '@/data/salderingConstants';

interface Props {
  solar: HourlyValue[];
  currentHour: number;
  currentMinute: number;
}

function Ticker({ value, decimals }: { value: number; decimals: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => v.toFixed(decimals));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.4, ease: 'easeOut' });
    return c.stop;
  }, [mv, value]);
  return <motion.span className="tabular-nums">{display}</motion.span>;
}

function Stat({
  label,
  value,
  color = 'text-warm',
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-warm/32">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold leading-none ${color}`}>{value}</p>
    </div>
  );
}

export default function LiveCounter({ solar, currentHour, currentMinute }: Props) {
  // solar values are in Wh; /1000 → kWh. For hourly data kWh = kW for that hour.
  const pastKWh =
    solar.slice(0, currentHour).reduce((s, h) => s + h.value, 0) / 1000;
  const currentKW = (solar[currentHour]?.value ?? 0) / 1000;
  const todayKWh = pastKWh + currentKW * (currentMinute / 60);
  const euroSaved = todayKWh * GRID_RETAIL_EUR_PER_KWH;

  return (
    <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid rgba(242,234,216,0.08)' }}>
      <Stat
        label="Nu"
        value={
          <>
            <Ticker value={currentKW} decimals={2} /> kW
          </>
        }
      />
      <div className="h-6 w-px bg-warm/10" />
      <Stat
        label="Vandaag"
        value={
          <>
            <Ticker value={todayKWh} decimals={1} /> kWh
          </>
        }
      />
      <div className="h-6 w-px bg-warm/10" />
      <Stat
        label="Bespaard"
        color="text-go"
        value={
          <>
            €&thinsp;
            <Ticker value={euroSaved} decimals={2} />
          </>
        }
      />
    </div>
  );
}
