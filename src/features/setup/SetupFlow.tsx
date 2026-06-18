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

const DIRECTIONS = [
  { label: 'N', az: 0 }, { label: 'NO', az: 45 },
  { label: 'O', az: 90 }, { label: 'ZO', az: 135 },
  { label: 'Z', az: 180 }, { label: 'ZW', az: 225 },
  { label: 'W', az: 270 }, { label: 'NW', az: 315 },
];

function StepAddress({ value, onChange }: { value: Address | null; onChange: (a: Address) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-warm/50">
        We gebruiken je adres om je zonneprofiel op te halen.
      </p>
      <AddressInput value={value} onChange={onChange} />
      {value && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-go">
          <Check className="h-4 w-4" strokeWidth={2} /> {value.label}
        </p>
      )}
    </div>
  );
}

function StepRoof({ roof, onChange }: { roof: RoofConfig; onChange: (r: RoofConfig) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-xs font-medium text-warm/50">Dakrichting</label>
        <div className="grid grid-cols-4 gap-1.5">
          {DIRECTIONS.map(({ label, az }) => (
            <button
              key={az}
              type="button"
              onClick={() => onChange({ ...roof, azimuth: az })}
              className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                roof.azimuth === az
                  ? 'bg-gold text-stone-900'
                  : 'text-warm/50 hover:text-warm'
              }`}
              style={
                roof.azimuth !== az
                  ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs">
          <label className="font-medium text-warm/50">Dakhelling</label>
          <span className="font-semibold text-warm">{roof.tilt}°</span>
        </div>
        <input
          type="range"
          min={0} max={60} step={5}
          value={roof.tilt}
          onChange={(e) => onChange({ ...roof, tilt: Number(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="mt-1 flex justify-between text-[10px] text-warm/30">
          <span>0° (plat)</span><span>60° (steil)</span>
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs">
          <label className="font-medium text-warm/50">Piekvermogen (kWp)</label>
          <span className="font-semibold text-warm">{roof.kWp} kWp</span>
        </div>
        <input
          type="range"
          min={0.5} max={20} step={0.5}
          value={roof.kWp}
          onChange={(e) => onChange({ ...roof, kWp: Number(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="mt-1 flex justify-between text-[10px] text-warm/30">
          <span>0.5 kWp</span><span>20 kWp</span>
        </div>
      </div>
    </div>
  );
}

function StepAppliances({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-warm/50">
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
              className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-colors"
              style={
                on
                  ? { background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.30)' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }
              }
            >
              <span className={on ? 'text-gold' : 'text-warm/35'}>
                <ApplianceIcon id={a.id} className="h-5 w-5" />
              </span>
              <div>
                <p className={`text-xs font-medium leading-tight ${on ? 'text-warm' : 'text-warm/60'}`}>
                  {a.name}
                </p>
                <p className="text-[10px] text-warm/30">{a.kWh} kWh</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STEPS = ['Adres', 'Dak', 'Apparaten'];

export default function SetupFlow({ initial, onSave, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address | null>(initial?.address ?? null);
  const [roof, setRoof] = useState<RoofConfig>(initial?.roof ?? { ...PANEL_DEFAULTS });
  const [applianceIds, setApplianceIds] = useState<string[]>(
    initial?.applianceIds ?? ['washer', 'dishwasher', 'dryer'],
  );

  function handleSave() {
    if (!address) return;
    onSave({ address, roof, applianceIds });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end backdrop-blur-md"
      style={{ background: 'rgba(0,20,10,0.80)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl px-5 pt-4 pb-safe shadow-sheet"
        style={{
          background: '#042318',
          borderTop: '1px solid rgba(255,255,255,0.14)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          className="mx-auto mb-5 h-1 w-10 rounded-full"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        />

        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  i <= step ? 'bg-gold text-stone-900' : 'text-warm/30'
                }`}
                style={i > step ? { background: 'rgba(255,255,255,0.10)' } : undefined}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'font-semibold text-warm' : 'text-warm/30'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-warm/20" />
              )}
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
            onClick={step < 2 ? () => setStep(step + 1) : handleSave}
            disabled={step === 0 && !address}
          >
            {step < 2 ? 'Volgende' : 'Opslaan'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
