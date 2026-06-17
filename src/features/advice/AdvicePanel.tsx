import { motion } from 'framer-motion';
import type { Advice, ApplianceAdvice } from '@/lib/evaluate';

const APPLIANCE_ICON: Record<string, string> = {
  washer: '🫧',
  dryer: '💨',
  dishwasher: '🍽️',
  ev: '⚡',
  heatpump: '🌡️',
  oven: '🔥',
};

function fmt(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

// ── Top-hours card ────────────────────────────────────────────────────────────

function TopHoursCard({ topHours }: { topHours: number[] }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-dusk p-4">
      <p className="text-[11px] uppercase tracking-widest text-stone-500 mb-2">
        Beste uren vandaag
      </p>
      <div className="flex gap-2">
        {topHours.map((h, i) => (
          <div
            key={h}
            className="flex-1 rounded-lg bg-sun/10 border border-sun/30 py-2 text-center"
          >
            <p className="text-sun font-semibold text-base">{fmt(h)}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">#{i + 1}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500 leading-relaxed">
        Op deze uren is je zonne-opwek het hoogst. Plan grote apparaten hier in om zoveel
        mogelijk van je eigen stroom te gebruiken.
      </p>
    </div>
  );
}

// ── Per-appliance card ────────────────────────────────────────────────────────

function ApplianceCard({ a }: { a: ApplianceAdvice }) {
  const icon = APPLIANCE_ICON[a.applianceId] ?? '🔌';
  const pct = Math.round(a.selfConsumptionPct);
  const saving = a.savingEur.toFixed(2);
  const { startHour, endHour } = a.bestWindow;

  return (
    <div className="rounded-xl border border-stone-800 bg-dusk p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-stone-200 text-sm">{a.name}</span>
        </div>
        <span className="text-xs text-stone-500">
          {fmt(startHour)}
          <span className="mx-1 text-stone-700">–</span>
          {fmt(endHour)}
        </span>
      </div>

      {/* Self-consumption bar */}
      <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
        <span>Zonne-aandeel</span>
        <span className="font-semibold text-stone-300">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-stone-800 overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full bg-sun"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Saving */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">Geschatte besparing</span>
        <span className="text-sm font-semibold text-leaf">€ {saving}</span>
      </div>
    </div>
  );
}

// ── Saldering banner ──────────────────────────────────────────────────────────

function SalderingBanner({ phase }: { phase: Advice['salderingPhase'] }) {
  const active = phase === 'active';
  return (
    <div
      className={`rounded-xl border p-4 text-xs leading-relaxed ${
        active
          ? 'border-stone-700 bg-stone-900 text-stone-400'
          : 'border-sun/30 bg-sun/5 text-stone-300'
      }`}
    >
      <p className="font-semibold mb-1 text-stone-300">
        {active ? '📅 Saldering loopt nog' : '⚠️ Saldering afgelopen'}
      </p>
      {active ? (
        <p>
          De salderingsregeling loopt t/m 31 december 2026. Daarna levert exporteren bijna
          niets op. Bouw nu al de gewoonte op om eigen stroom zelf te gebruiken.
        </p>
      ) : (
        <p>
          Exporteren levert nu slechts ~€ 0,04/kWh. Elke kWh die je zelf verbruikt
          bespaart ~€ 0,32. De klok op de kaart laat precies zien wanneer.
        </p>
      )}
    </div>
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
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
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
