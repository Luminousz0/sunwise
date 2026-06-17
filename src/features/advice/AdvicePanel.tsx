import { motion } from 'framer-motion';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import type { Advice, ApplianceAdvice } from '@/lib/evaluate';
import { ApplianceIcon } from '@/components/icons';
import Card from '@/components/Card';

function fmt(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

// ── Top-hours card ────────────────────────────────────────────────────────────

function TopHoursCard({ topHours }: { topHours: number[] }) {
  return (
    <Card className="p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-ink-3">
        Beste uren vandaag
      </p>
      <div className="flex gap-3">
        {topHours.slice(0, 3).map((h, i) => (
          <div
            key={h}
            className={`flex-1 rounded-xl border py-4 text-center transition-colors ${
              i === 0
                ? 'border-sun/30 text-sun'
                : 'border-line-2 text-ink-1'
            }`}
            style={
              i === 0
                ? {
                    background: 'rgba(245,158,11,0.10)',
                    boxShadow: '0 0 20px rgba(245,158,11,0.15)',
                  }
                : { background: 'rgba(255,255,255,0.03)' }
            }
          >
            <p className={`text-xl font-bold ${i === 0 ? 'text-sun' : 'text-ink-1'}`}>{fmt(h)}</p>
            <p className="mt-1 text-[10px] text-ink-3">#{i + 1}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-2">
        Op deze uren is je zonne-opwek het hoogst. Plan grote apparaten hier in om zoveel
        mogelijk van je eigen stroom te gebruiken.
      </p>
    </Card>
  );
}

// ── Per-appliance card ────────────────────────────────────────────────────────

function ApplianceCard({ a }: { a: ApplianceAdvice }) {
  const pct = Math.round(a.selfConsumptionPct);
  const saving = a.savingEur.toFixed(2);
  const { startHour, endHour } = a.bestWindow;

  return (
    <Card className="p-4">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sun/12 text-sun"
            style={{ background: 'rgba(245,158,11,0.10)' }}>
            <ApplianceIcon id={a.applianceId} className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-ink-1">{a.name}</span>
        </div>
        <span className="text-xs font-medium text-sun">
          {fmt(startHour)}
          <span className="mx-1 text-ink-3">–</span>
          {fmt(endHour)}
        </span>
      </div>

      {/* Self-consumption bar */}
      <div className="mb-1 flex items-center justify-between text-[11px] text-ink-3">
        <span>Zonne-aandeel</span>
        <span className="font-semibold text-ink-2">{pct}%</span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-sun"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Saving */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-3">Geschatte besparing</span>
        <span className="text-base font-bold text-leaf">€ {saving}</span>
      </div>
    </Card>
  );
}

// ── Saldering banner ──────────────────────────────────────────────────────────

function SalderingBanner({ phase }: { phase: Advice['salderingPhase'] }) {
  const active = phase === 'active';
  const Icon = active ? CalendarClock : AlertTriangle;
  return (
    <Card
      className="p-4"
      style={
        !active
          ? { borderColor: 'rgba(245,158,11,0.20)', background: 'rgba(245,158,11,0.06)' }
          : undefined
      }
    >
      <div className="flex gap-3">
        <span className={`mt-0.5 shrink-0 ${active ? 'text-ink-3' : 'text-sun'}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="text-xs leading-relaxed text-ink-2">
          <p className="mb-1 font-semibold text-ink-1">
            {active ? 'Saldering loopt nog' : 'Saldering afgelopen'}
          </p>
          {active ? (
            <p>
              De salderingsregeling loopt t/m 31 december 2026. Daarna levert exporteren
              bijna niets op. Bouw nu al de gewoonte op om eigen stroom zelf te gebruiken.
            </p>
          ) : (
            <p>
              Exporteren levert nu slechts ~€ 0,04/kWh. Elke kWh die je zelf verbruikt
              bespaart ~€ 0,32. De energieklok laat precies zien wanneer.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  advice: Advice;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 260, damping: 24 },
  }),
};

export default function AdvicePanel({ advice }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
        <TopHoursCard topHours={advice.topHours} />
      </motion.div>

      {advice.appliances.map((a, i) => (
        <motion.div
          key={a.applianceId}
          custom={i + 1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <ApplianceCard a={a} />
        </motion.div>
      ))}

      <motion.div
        custom={advice.appliances.length + 1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <SalderingBanner phase={advice.salderingPhase} />
      </motion.div>
    </div>
  );
}
