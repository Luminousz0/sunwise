import { useState } from 'react';
import type { Household } from '@/types/household';
import { PANEL_DEFAULTS } from '@/data/panelDefaults';

const STORAGE_KEY = 'sunwise:household';
export const DEFAULT_APPLIANCES = ['washer', 'dishwasher', 'dryer'];

function readStorage(): Household | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Household) : null;
  } catch {
    return null;
  }
}

function readDeeplink(): Household | null {
  const p = new URLSearchParams(window.location.search);
  const lat = parseFloat(p.get('lat') ?? '');
  const lon = parseFloat(p.get('lon') ?? '');
  if (isNaN(lat) || isNaN(lon)) return null;
  return {
    address: { label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon },
    roof: { ...PANEL_DEFAULTS },
    applianceIds: DEFAULT_APPLIANCES,
  };
}

function writeDeeplink(h: Household) {
  const url = new URL(window.location.href);
  url.searchParams.set('lat', h.address.lat.toFixed(4));
  url.searchParams.set('lon', h.address.lon.toFixed(4));
  window.history.replaceState({}, '', url.toString());
}

export function useHousehold() {
  const [household, setHouseholdState] = useState<Household | null>(
    () => readStorage() ?? readDeeplink(),
  );

  function setHousehold(h: Household) {
    setHouseholdState(h);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    } catch { /* storage full — silently ignore */ }
    writeDeeplink(h);
  }

  function reset() {
    setHouseholdState(null);
    localStorage.removeItem(STORAGE_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete('lat');
    url.searchParams.delete('lon');
    window.history.replaceState({}, '', url.toString());
  }

  return { household, setHousehold, reset };
}
