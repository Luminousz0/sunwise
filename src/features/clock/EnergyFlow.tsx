import { useId } from 'react';

interface Props {
  /** Current solar production in kW */
  currentKW: number;
}

// Use sanitized ID to avoid SVG href issues with React's useId colons
function sanitize(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, '');
}

// SVG path data for the two flow segments
const P1 = 'M 77 40 C 100 40 124 40 148 40'; // solar → home
const P2 = 'M 192 40 C 216 40 240 40 263 40'; // home → grid

interface NodeProps {
  cx: number;
  cy: number;
  lit?: boolean;
  children: React.ReactNode;
}

function Node({ cx, cy, lit, children }: NodeProps) {
  const bg = lit ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.06)';
  const stroke = lit ? 'rgba(16,185,129,0.50)' : 'rgba(255,255,255,0.14)';
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={22} fill={bg} stroke={stroke} strokeWidth={1.5} />
      {children}
    </g>
  );
}

export default function EnergyFlow({ currentKW }: Props) {
  const rawId = useId();
  const uid = sanitize(rawId);

  const intensity = Math.max(0, Math.min(1, currentKW / 5));
  const producing = intensity > 0.02;
  const exporting = intensity > 0.4;

  // Particle animation speed: faster when producing more
  const dur1 = producing ? (2.5 - intensity * 1.4).toFixed(1) : '999';
  const dur2 = exporting ? (3.2 - intensity * 1.2).toFixed(1) : '999';

  return (
    <div className="w-full select-none">
      <svg viewBox="0 0 340 78" className="w-full" style={{ overflow: 'visible' }}>
        <defs>
          <path id={`${uid}a`} d={P1} />
          <path id={`${uid}b`} d={P2} />
        </defs>

        {/* Connector lines */}
        <path
          d={P1}
          stroke={producing ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.08)'}
          strokeWidth={2}
          fill="none"
        />
        <path
          d={P2}
          stroke={exporting ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.06)'}
          strokeWidth={2}
          fill="none"
        />

        {/* Particles: solar → home */}
        {producing &&
          ([0, -0.33, -0.66] as const).map((off, i) => (
            <circle key={i} r={3.5} fill="#10B981">
              <animateMotion
                dur={`${dur1}s`}
                repeatCount="indefinite"
                begin={`${off * parseFloat(dur1)}s`}
              >
                <mpath {...{ href: `#${uid}a` }} />
              </animateMotion>
            </circle>
          ))}

        {/* Particles: home → grid (export / excess) */}
        {exporting &&
          ([0, -0.5] as const).map((off, i) => (
            <circle key={i} r={2.5} fill="#059669" opacity={0.7}>
              <animateMotion
                dur={`${dur2}s`}
                repeatCount="indefinite"
                begin={`${off * parseFloat(dur2)}s`}
              >
                <mpath {...{ href: `#${uid}b` }} />
              </animateMotion>
            </circle>
          ))}

        {/* Solar node */}
        <Node cx={55} cy={40} lit={producing}>
          {/* Sun rays */}
          {([0, 45, 90, 135, 180, 225, 270, 315] as const).map((deg) => (
            <line
              key={deg}
              x1={0} y1={11.5} x2={0} y2={15}
              stroke={producing ? '#10B981' : 'rgba(255,255,255,0.25)'}
              strokeWidth={1.5}
              strokeLinecap="round"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle r={8} fill={producing ? '#10B981' : 'rgba(255,255,255,0.20)'} />
        </Node>

        {/* Home node */}
        <Node cx={170} cy={40} lit={producing}>
          {/* Roof */}
          <polygon
            points="-9,-7 0,-15 9,-7"
            fill="none"
            stroke="rgba(255,255,255,0.70)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {/* Walls */}
          <rect
            x={-8} y={-7} width={16} height={12} rx={1}
            fill="none"
            stroke="rgba(255,255,255,0.70)"
            strokeWidth={1.5}
          />
          {/* Door */}
          <rect x={-3} y={0} width={6} height={5} rx={0.5} fill="rgba(255,255,255,0.22)" />
        </Node>

        {/* Grid node */}
        <Node cx={285} cy={40} lit={exporting}>
          {/* Zap icon */}
          <polygon
            points="3,-11 -3,1 3,1 -3,11 4,-1 -2,-1"
            fill={exporting ? '#10B981' : 'rgba(255,255,255,0.22)'}
          />
        </Node>

        {/* Node labels */}
        <text x={55} y={70} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.45)">
          Panelen
        </text>
        <text x={170} y={70} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.45)">
          Woning
        </text>
        <text x={285} y={70} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.45)">
          Net
        </text>

        {/* Live kW badge above solar node */}
        {producing && (
          <text
            x={55} y={12}
            textAnchor="middle"
            fontSize={10}
            fontWeight="600"
            fill="#10B981"
          >
            {currentKW.toFixed(2)} kW
          </text>
        )}
      </svg>
    </div>
  );
}
