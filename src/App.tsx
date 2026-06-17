import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Settings, X, MapPin, ArrowRight } from 'lucide-react';
import { useSolarDay, DEFAULT_LAT, DEFAULT_LON } from '@/hooks/useSolarDay';
import { useHousehold, DEFAULT_APPLIANCES } from '@/hooks/useHousehold';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import EnergyClock from '@/features/clock/EnergyClock';
import { computeNowStatus, range, type NowTone } from '@/features/clock/nowStatus';
import AdvicePanel from '@/features/advice/AdvicePanel';
import SetupFlow from '@/features/setup/SetupFlow';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Radial glow color that bleeds through the hero glass card
const TONE_GLOW: Record<NowTone, string> = {
  active: 'rgba(106,168,79,0.14)',
  upcoming: 'rgba(226,144,43,0.16)',
  past: 'transparent',
};

// Status badge — natural condition colors
const TONE_PILL: Record<NowTone, string> = {
  active: 'text-go border-go/30',
  upcoming: 'text-caution border-caution/30',
  past: 'text-warm/35 border-warm/10',
};

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

  const windows = bestWindows?.windows ?? [];
  const status = computeNowStatus(windows, currentHour);
  const showInstall = canInstall && !installDismissed;
  const placeName = household?.address.label.split(',')[0];

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col px-5 pt-safe">

      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/15">
            <Sun className="h-4.5 w-4.5 text-gold" strokeWidth={2} style={{ width: 18, height: 18 }} />
          </span>
          <div className="leading-none">
            <span className="font-display text-lg font-semibold text-warm">Sunwise</span>
            <p className="mt-0.5 text-[11px] capitalize text-warm/35">
              {dateLabel} · {timeLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="inline-flex min-h-[36px] max-w-[9rem] items-center gap-1.5 rounded-full px-3 text-xs font-medium text-warm/60 transition-colors hover:text-warm"
            style={{ background: 'rgba(242,234,216,0.06)', border: '1px solid rgba(242,234,216,0.10)' }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={2} />
            <span className="truncate">{placeName ?? 'Stel woning in'}</span>
          </button>
          {household && (
            <IconButton label="Reset naar standaard" onClick={() => reset()}>
              <X className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          <IconButton label="Instellingen" onClick={() => setSetupOpen(true)}>
            <Settings className="h-5 w-5" strokeWidth={2} />
          </IconButton>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 pb-4">

        {/* First-time CTA */}
        {!household && !loading && !error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{
                background: 'rgba(214,162,74,0.08)',
                border: '1px solid rgba(214,162,74,0.18)',
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-warm">Stel je woning in</p>
                <p className="mt-0.5 text-xs text-warm/55">
                  Nu: Amsterdam, zuid 4 kWp. Gebruik je eigen dak voor exacte uren.
                </p>
              </div>
              <Button onClick={() => setSetupOpen(true)} className="shrink-0 px-3 text-xs">
                Instellen
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
            <div className="h-32 w-full animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-56 w-full animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-28 w-full animate-pulse rounded-2xl bg-surface-2" />
          </motion.div>
        )}

        {error && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(207,90,62,0.10)', border: '1px solid rgba(207,90,62,0.20)' }}
          >
            <p className="text-sm font-semibold text-stop">Kon gegevens niet laden</p>
            <p className="mt-1 text-xs text-warm/55">Probeer het later opnieuw. {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* "Now" hero — warm glass card with Fraunces time display */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <div
                className="relative overflow-hidden rounded-3xl p-6"
                style={{
                  background: `radial-gradient(ellipse 120% 80% at 50% 140%, ${TONE_GLOW[status.tone]} 0%, transparent 60%), rgba(242,234,216,0.045)`,
                  border: '1px solid rgba(242,234,216,0.09)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide ${TONE_PILL[status.tone]}`}
                  style={{ background: 'rgba(242,234,216,0.06)' }}
                >
                  {status.tone === 'active' && (
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-current"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    />
                  )}
                  {status.label}
                </span>

                {/* Fraunces time range — the centrepiece */}
                {status.window ? (
                  <p
                    className="mt-4 font-display font-semibold text-warm"
                    style={{ fontSize: '3.25rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}
                  >
                    {range(status.window)}
                  </p>
                ) : (
                  <p
                    className="mt-4 font-display font-semibold text-warm/55"
                    style={{ fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}
                  >
                    {status.detail}
                  </p>
                )}

                {status.window && (
                  <p className="mt-2.5 text-sm leading-relaxed text-warm/55">{status.detail}</p>
                )}
              </div>
            </motion.div>

            {/* Energy clock */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.07 }}
              className="glass p-5"
            >
              <EnergyClock
                solar={solar}
                prices={prices}
                carbon={carbon}
                bestWindows={windows}
                currentHour={currentHour}
              />
            </motion.div>

            {/* Advice */}
            {advice && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>
                <AdvicePanel advice={advice} />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-warm/30 font-sans">
        {household
          ? `${household.roof.kWp} kWp · ${placeName} · Open-Meteo · EnergyZero`
          : 'Open-Meteo · EnergyZero · standaard: Amsterdam'}
      </footer>

      {/* PWA install banner */}
      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-4 right-4 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl px-4 py-3 shadow-sheet backdrop-blur-glass"
            style={{ background: 'rgba(35,29,20,0.92)', border: '1px solid rgba(242,234,216,0.10)' }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15">
              <Sun className="h-5 w-5 text-gold" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-warm">Voeg toe aan beginscherm</p>
              <p className="truncate text-xs text-warm/50">Check elke ochtend de beste uren</p>
            </div>
            <Button onClick={install} className="shrink-0 px-3 text-xs">
              Toevoegen
            </Button>
            <IconButton label="Sluiten" onClick={() => setInstallDismissed(true)} className="h-9 w-9 shrink-0">
              <X className="h-4 w-4" strokeWidth={2} />
            </IconButton>
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
