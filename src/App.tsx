import { motion } from 'framer-motion';
import { useSolarDay } from '@/hooks/useSolarDay';
import EnergyClock from '@/features/clock/EnergyClock';
import AdvicePanel from '@/features/advice/AdvicePanel';

const today = new Date();
const dateLabel = today.toLocaleDateString('nl-NL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const currentHour = today.getHours();

export default function App() {
  const { loading, error, solar, prices, carbon, bestWindows, advice } = useSolarDay();

  return (
    <main className="min-h-full flex flex-col px-5 pt-safe pb-safe">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <span className="text-sun font-semibold tracking-tight text-lg">Sunwise</span>
        <span className="text-xs text-stone-500 capitalize">{dateLabel}</span>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-6 py-4">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            <div className="h-4 w-48 rounded bg-stone-800 animate-pulse" />
            <div className="h-36 w-full rounded bg-stone-800 animate-pulse" />
            <div className="h-3 w-full rounded bg-stone-800 animate-pulse" />
            <div className="h-3 w-full rounded bg-stone-800 animate-pulse" />
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-400"
          >
            Kon gegevens niet laden — probeer het opnieuw.
            <br />
            <span className="text-stone-600 text-xs">{error}</span>
          </motion.p>
        )}

        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          >
            <EnergyClock
              solar={solar}
              prices={prices}
              carbon={carbon}
              bestWindows={bestWindows?.windows ?? []}
              currentHour={currentHour}
            />
          </motion.div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 text-[11px] text-stone-500"
          >
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-sun" />
              Zonnepiek
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#3b1f02]" />
              Productie
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-px h-3 bg-white/40" />
              Nu
            </span>
          </motion.div>
        )}

        {/* Advice cards */}
        {!loading && !error && advice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <AdvicePanel advice={advice} />
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-[10px] text-stone-700">
        Zonneprofiel via PVGIS · Prijzen via EnergyZero · Standaard locatie: Amsterdam
      </footer>
    </main>
  );
}
