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

// Adaptive glow color behind the hero based on solar status
const TONE_GLOW: Record<NowTone, string> = {
  active: 'rgba(52,211,153,0.16)',
  upcoming: 'rgba(245,158,11,0.20)',
  past: 'rgba(30,30,60,0.0)',
};

const TONE_PILL: Record<NowTone, string> = {
  active: 'bg-leaf/15 text-leaf border border-leaf/25',
  upcoming: 'bg-sun/15 text-sun border border-sun/25',
  past: 'bg-surface-2 text-ink-3 border border-line',
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
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun/15 shadow-glow-sm">
            <Sun className="h-5 w-5 text-sun" strokeWidth={2} />
          </span>
          <div className="leading-none">
            <span className="text-base font-bold tracking-tight text-ink-1">Sunwise</span>
            <p className="mt-0.5 text-[11px] capitalize text-ink-3">
              {dateLabel} · {timeLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="inline-flex min-h-[36px] max-w-[9rem] items-center gap-1.5 rounded-full border border-line-2 bg-surface-2 px-3 text-xs font-medium text-ink-2 transition-colors hover:border-line hover:text-ink-1"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-sun" strokeWidth={2} />
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
      <div className="flex flex-1 flex-col gap-4 py-1">

        {/* First-time CTA */}
        {!household && !loading && !error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 rounded-2xl border border-sun/20 bg-sun/8 p-4"
              style={{ background: 'rgba(245,158,11,0.07)' }}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-1">Stel je woning in</p>
                <p className="mt-0.5 text-xs text-ink-2">
                  Nu: Amsterdam, zuid 4 kWp. Gebruik je eigen dak voor exacte uren.
                </p>
              </div>
              <Button onClick={() => setSetupOpen(true)} className="shrink-0 px-3">
                Instellen
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
            <div className="h-28 w-full animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-52 w-full animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-28 w-full animate-pulse rounded-2xl bg-surface-2" />
          </motion.div>
        )}

        {error && (
          <div className="rounded-2xl border border-pricey/20 bg-pricey/10 p-4">
            <p className="text-sm font-semibold text-pricey">Kon gegevens niet laden</p>
            <p className="mt-1 text-xs text-ink-2">Probeer het later opnieuw. {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* "Now" hero — the star of the screen */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <div
                className="relative overflow-hidden rounded-3xl border border-line p-6 shadow-card"
                style={{
                  background: `radial-gradient(ellipse 110% 90% at 50% 150%, ${TONE_GLOW[status.tone]} 0%, transparent 65%), #12121e`,
                }}
              >
                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${TONE_PILL[status.tone]}`}
                >
                  {status.tone === 'active' && (
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-current"
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    />
                  )}
                  {status.label}
                </span>

                {/* Big time range */}
                {status.window ? (
                  <p
                    className="mt-4 font-extrabold text-ink-1"
                    style={{ fontSize: '3rem', lineHeight: 1.05, letterSpacing: '-0.04em' }}
                  >
                    {range(status.window)}
                  </p>
                ) : (
                  <p className="mt-4 text-2xl font-bold text-ink-2" style={{ letterSpacing: '-0.02em' }}>
                    {status.detail}
                  </p>
                )}

                {/* Detail line — only show when we have a window */}
                {status.window && (
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{status.detail}</p>
                )}
              </div>
            </motion.div>

            {/* Energy clock */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.06 }}
            >
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <EnergyClock
                  solar={solar}
                  prices={prices}
                  carbon={carbon}
                  bestWindows={windows}
                  currentHour={currentHour}
                />
              </div>
            </motion.div>

            {/* Advice */}
            {advice && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <AdvicePanel advice={advice} />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-ink-3">
        {household
          ? `${household.roof.kWp} kWp · ${placeName} · zon via Open-Meteo · prijzen via EnergyZero`
          : 'Zon via Open-Meteo · prijzen via EnergyZero · standaard: Amsterdam'}
      </footer>

      {/* PWA install banner */}
      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-4 right-4 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-line-2 bg-surface/95 px-4 py-3 shadow-sheet backdrop-blur-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sun/15">
              <Sun className="h-5 w-5 text-sun" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-ink-1">Voeg toe aan beginscherm</p>
              <p className="truncate text-xs text-ink-2">Check elke ochtend de beste uren</p>
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
