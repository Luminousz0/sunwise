import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolarDay, DEFAULT_LAT, DEFAULT_LON } from '@/hooks/useSolarDay';
import { useHousehold, DEFAULT_APPLIANCES } from '@/hooks/useHousehold';
import EnergyClock from '@/features/clock/EnergyClock';
import AdvicePanel from '@/features/advice/AdvicePanel';
import SetupFlow from '@/features/setup/SetupFlow';

const today = new Date();
const dateLabel = today.toLocaleDateString('nl-NL', {
  weekday: 'long', day: 'numeric', month: 'long',
});
const currentHour = today.getHours();

export default function App() {
  const { household, setHousehold, reset } = useHousehold();
  const [setupOpen, setSetupOpen] = useState(false);

  const lat = household?.address.lat ?? DEFAULT_LAT;
  const lon = household?.address.lon ?? DEFAULT_LON;
  const applianceIds = household?.applianceIds ?? DEFAULT_APPLIANCES;

  const { loading, error, solar, prices, carbon, bestWindows, advice } = useSolarDay(
    lat, lon, applianceIds,
  );

  return (
    <main className="min-h-full flex flex-col px-5 pt-safe pb-safe">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <span className="text-sun font-semibold tracking-tight text-lg">Sunwise</span>
        <div className="flex items-center gap-3">
          {household && (
            <button
              type="button"
              onClick={() => reset()}
              className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors"
              title="Reset naar standaard"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1"
          >
            <span>⚙</span>
            <span>{household ? household.address.label.split(',')[0] : 'Instellen'}</span>
          </button>
        </div>
      </header>

      {/* No-household prompt */}
      {!household && !loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 rounded-xl border border-sun/20 bg-sun/5 px-4 py-3"
        >
          <p className="text-xs text-stone-400">
            Standaard: Amsterdam, zuidgericht 4 kWp dak.{' '}
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="text-sun underline underline-offset-2"
            >
              Stel jouw woning in →
            </button>
          </p>
        </motion.div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col gap-6 py-2">
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
            <div className="h-4 w-48 rounded bg-stone-800 animate-pulse" />
            <div className="h-36 w-full rounded bg-stone-800 animate-pulse" />
            <div className="h-3 w-full rounded bg-stone-800 animate-pulse" />
            <div className="h-3 w-full rounded bg-stone-800 animate-pulse" />
          </motion.div>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400">
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

        {!loading && !error && advice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <AdvicePanel advice={advice} />
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-[10px] text-stone-700">
        {household
          ? `${household.roof.kWp} kWp · ${household.address.label.split(',')[0]} · PVGIS`
          : 'Zonneprofiel via PVGIS · Prijzen via EnergyZero · Standaard: Amsterdam'}
      </footer>

      {/* Setup modal */}
      <AnimatePresence>
        {setupOpen && (
          <SetupFlow
            initial={household}
            onSave={setHousehold}
            onClose={() => setSetupOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Date display — hidden but used for screen readers */}
      <span className="sr-only">{dateLabel}</span>
    </main>
  );
}
