import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { AddressInput } from './AddressInput';
import { APPLIANCES } from '@/data/appliances';
import { PANEL_DEFAULTS } from '@/data/panelDefaults';
import { ApplianceIcon } from '@/components/icons';
import Button from '@/components/Button';
import type { Household, Address, RoofConfig } from '@/types/household';

interface Props {
  initial: Household | null;
  onSave: (h: Household) => void;
  onClose: () => void;
}

// ── Direction picker ──────────────────────────────────────────────────────────

const DIRECTIONS = [
  { label: 'N', az: 0 }, { label: 'NO', az: 45 },
  { label: 'O', az: 90 }, { label: 'ZO', az: 135 },
  { label: 'Z', az: 180 }, { label: 'ZW', az: 225 },
  { label: 'W', az: 270 }, { label: 'NW', az: 315 },
];

// ── Step 1: Address ───────────────────────────────────────────────────────────

function StepAddress({
  value,
  onChange,
}: {
  value: Address | null;
  onChange: (a: Address) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs text-ink-2">
          We gebruiken je adres om je zonneprofiel op te halen.
        </p>
        <AddressInput value={value} onChange={onChange} />
      </div>
      {value && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-leaf">
          <Check className="h-4 w-4" strokeWidth={2} /> {value.label}
        </p>
      )}
    </div>
  );
}

// ── Step 2: Roof ──────────────────────────────────────────────────────────────

function StepRoof({
  roof,
  onChange,
}: {
  roof: RoofConfig;
  onChange: (r: RoofConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Orientation */}
      <div>
        <label className="mb-2 block text-xs font-medium text-ink-2">Dakrichting</label>
        <div className="grid grid-cols-4 gap-1.5">
          {DIRECTIONS.map(({ label, az }) => (
            <button
              key={az}
              type="button"
              onClick={() => onChange({ ...roof, azimuth: az })}
              className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                roof.azimuth === az
                  ? 'bg-sun text-stone-900'
                  : 'bg-surface-2 text-ink-2 hover:bg-line hover:text-ink-1'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tilt */}
      <div>
        <div className="mb-2 flex justify-between text-xs">
          <label className="font-medium text-ink-2">Dakhelling</label>
          <span className="font-semibold text-ink-1">{roof.tilt}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={roof.tilt}
          onChange={(e) => onChange({ ...roof, tilt: Number(e.target.value) })}
          className="w-full accent-sun"
        />
        <div className="mt-1 flex justify-between text-[10px] text-ink-3">
          <span>0° (plat)</span>
          <span>60° (steil)</span>
        </div>
      </div>

      {/* kWp */}
      <div>
        <div className="mb-2 flex justify-between text-xs">
          <label className="font-medium text-ink-2">Piekvermogen (kWp)</label>
          <span className="font-semibold text-ink-1">{roof.kWp} kWp</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.5}
          value={roof.kWp}
          onChange={(e) => onChange({ ...roof, kWp: Number(e.target.value) })}
          className="w-full accent-sun"
        />
        <div className="mt-1 flex justify-between text-[10px] text-ink-3">
          <span>0.5 kWp</span>
          <span>20 kWp</span>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Appliances ────────────────────────────────────────────────────────

function StepAppliances({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-2">
        Selecteer de apparaten die je wilt plannen op zonne-energie.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(APPLIANCES).map((a) => {
          const on = selected.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors ${
                on
                  ? 'border-sun/30 text-ink-1'
                  : 'border-line text-ink-2 hover:border-line-2 hover:text-ink-1'
              }`}
              style={on ? { background: 'rgba(245,158,11,0.10)' } : { background: 'rgba(255,255,255,0.03)' }}
            >
              <span className={on ? 'text-sun' : 'text-ink-3'}>
                <ApplianceIcon id={a.id} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium leading-tight">{a.name}</p>
                <p className="text-[10px] text-ink-3">{a.kWh} kWh</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main flow ─────────────────────────────────────────────────────────────────

const STEPS = ['Adres', 'Dak', 'Apparaten'];

export default function SetupFlow({ initial, onSave, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address | null>(initial?.address ?? null);
  const [roof, setRoof] = useState<RoofConfig>(initial?.roof ?? { ...PANEL_DEFAULTS });
  const [applianceIds, setApplianceIds] = useState<string[]>(
    initial?.applianceIds ?? ['washer', 'dishwasher', 'dryer'],
  );

  function handleNext() {
    if (step < 2) setStep(step + 1);
  }

  function handleSave() {
    if (!address) return;
    onSave({ address, roof, applianceIds });
    onClose();
  }

  const canNext = step === 0 ? !!address : true;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-line bg-canvas px-5 pt-4 pb-safe shadow-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line-2" />

        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  i <= step ? 'bg-sun text-stone-900' : 'bg-surface-2 text-ink-3'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'font-semibold text-ink-1' : 'text-ink-3'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-ink-3" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="mb-6"
          >
            {step === 0 && <StepAddress value={address} onChange={setAddress} />}
            {step === 1 && <StepRoof roof={roof} onChange={setRoof} />}
            {step === 2 && <StepAppliances selected={applianceIds} onChange={setApplianceIds} />}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 pb-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
          >
            {step === 0 ? 'Annuleren' : 'Terug'}
          </Button>
          <Button
            className="flex-1"
            onClick={step < 2 ? handleNext : handleSave}
            disabled={!canNext}
          >
            {step < 2 ? 'Volgende' : 'Opslaan'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
