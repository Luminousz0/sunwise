import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSolarDay, DEFAULT_LAT, DEFAULT_LON } from '@/hooks/useSolarDay';
import { useHousehold, DEFAULT_APPLIANCES } from '@/hooks/useHousehold';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import EnergyClock from '@/features/clock/EnergyClock';
import AdvicePanel from '@/features/advice/AdvicePanel';
import SetupFlow from '@/features/setup/SetupFlow';

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function App() {
  const { household, setHousehold, reset } = useHousehold();
  const [setupOpen, setSetupOpen] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  const now = useLiveClock();
  const currentHour = now.getHours();
  const dateLabel = now.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const timeLabel = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  const lat = household?.address.lat ?? DEFAULT_LAT;
  const lon = household?.address.lon ?? DEFAULT_LON;
  const applianceIds = household?.applianceIds ?? DEFAULT_APPLIANCES;

  const { loading, error, solar, prices, carbon, bestWindows, advice } = useSolarDay(
    lat, lon, applianceIds,
  );

  const showInstall = canInstall && !installDismissed;

  return (
    <main className="min-h-full flex flex-col px-5 pt-safe">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div>
          <span className="text-sun font-semibold tracking-tight text-lg leading-none">Sunwise</span>
          <p className="text-[11px] text-stone-500 mt-0.5 capitalize">
            {dateLabel} · {timeLabel}
          </p>
        </div>
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

      {/* PWA install banner */}
      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-4 right-4 rounded-2xl border border-sun/30 bg-dusk/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 shadow-xl z-40"
          >
            <span className="text-sun text-xl leading-none">☀</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-200 leading-tight">Voeg toe aan beginscherm</p>
              <p className="text-xs text-stone-500 truncate">Check elke ochtend de beste uren</p>
            </div>
            <button
              type="button"
              onClick={install}
              className="shrink-0 rounded-lg bg-sun px-3 py-1.5 text-xs font-semibold text-night min-h-[36px]"
            >
              Toevoegen
            </button>
            <button
              type="button"
              onClick={() => setInstallDismissed(true)}
              className="shrink-0 text-stone-600 hover:text-stone-400 transition-colors text-xs min-h-[36px] px-1"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
    </main>
  );
}
