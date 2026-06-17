import { useMemo } from 'react';
import { motion } from 'framer-motion';
import SunCalc from 'suncalc';

interface Props {
  lat: number;
  lon: number;
  now: Date;
}

const W = 300;
const H = 96;
const cx = W / 2;
const cy = H - 6;       // horizon y
const rx = cx - 10;     // half-width of arc
const ry = H - 24;      // arc height

function ellipsePoint(t: number) {
  const angle = Math.PI * (1 - t);
  return {
    x: cx + rx * Math.cos(angle),
    y: cy - ry * Math.sin(angle),
  };
}

// 50-segment polyline approximating the ellipse arc
const ALL_POINTS = Array.from({ length: 51 }, (_, i) => ellipsePoint(i / 50));
const FULL_D =
  'M ' + ALL_POINTS.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ');

export default function SunArc({ lat, lon, now }: Props) {
  const { sunrise, sunset } = useMemo(() => {
    const times = SunCalc.getTimes(now, lat, lon);
    return { sunrise: times.sunrise, sunset: times.sunset };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, now.toDateString()]);

  const t = useMemo(() => {
    const total = sunset.getTime() - sunrise.getTime();
    const elapsed = now.getTime() - sunrise.getTime();
    return elapsed / total; // <0 before sunrise, >1 after sunset
  }, [now, sunrise, sunset]);

  const tClamped = Math.max(0, Math.min(1, t));
  const isAboveHorizon = t > 0 && t < 1;
  const dot = ellipsePoint(tClamped);

  // Traveled arc: subset of ALL_POINTS up to current position
  const travelIdx = Math.round(tClamped * 50);
  const traveledD =
    travelIdx > 0
      ? 'M ' +
        ALL_POINTS.slice(0, travelIdx + 1)
          .map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(' L ')
      : null;

  const sunPos = SunCalc.getPosition(now, lat, lon);
  const altDeg = Math.round((sunPos.altitude * 180) / Math.PI);

  const fmt = (d: Date) =>
    d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${W} ${H + 14}`}
        className="w-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd86b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d6a24a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Horizon line */}
        <line
          x1={10} y1={cy} x2={W - 10} y2={cy}
          stroke="rgba(242,234,216,0.10)"
          strokeWidth={1}
        />

        {/* Full arc (dashed) */}
        <path
          d={FULL_D}
          fill="none"
          stroke="rgba(214,162,74,0.20)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />

        {/* Traveled arc (solid gold) */}
        {traveledD && (
          <path
            d={traveledD}
            fill="none"
            stroke="#d6a24a"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}

        {/* Glow halo */}
        {isAboveHorizon && (
          <ellipse cx={dot.x} cy={dot.y} rx={28} ry={28} fill="url(#sunGlow)" />
        )}

        {/* Sun dot — pulses gently */}
        {isAboveHorizon && (
          <motion.circle
            cx={dot.x}
            cy={dot.y}
            r={6.5}
            fill="#d6a24a"
            animate={{ r: [6.5, 8.5, 6.5] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          />
        )}

        {/* Sunrise / sunset time labels */}
        <text
          x={10} y={cy + 13}
          textAnchor="start"
          fontSize={8}
          fill="rgba(242,234,216,0.28)"
        >
          {fmt(sunrise)}
        </text>
        <text
          x={W - 10} y={cy + 13}
          textAnchor="end"
          fontSize={8}
          fill="rgba(242,234,216,0.28)"
        >
          {fmt(sunset)}
        </text>
      </svg>

      {/* Sun altitude badge — only when above horizon */}
      {isAboveHorizon && (
        <div className="absolute right-1 top-0 text-right leading-none">
          <p className="text-[9px] text-warm/28">zonhoogte</p>
          <p className="text-xs font-semibold text-gold">{altDeg}°</p>
        </div>
      )}
    </div>
  );
}
