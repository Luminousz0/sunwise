import type { BestWindow } from '@/lib/evaluate';

export type NowTone = 'active' | 'upcoming' | 'past';

export interface NowStatus {
  tone: NowTone;
  /** Short status label, e.g. "Nu in de beste uren". */
  label: string;
  /** One-line guidance under the label. */
  detail: string;
  /** The window the headline refers to (for the big time range). null at night / no data. */
  window: BestWindow | null;
}

function fmt(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function range(w: BestWindow): string {
  return `${fmt(w.startHour)} – ${fmt(w.endHour)}`;
}

/**
 * Derives the "what do I do right now" headline from the best windows.
 * Previously lived inline in EnergyClock; lifted out so the App hero owns it.
 */
export function computeNowStatus(
  bestWindows: BestWindow[],
  currentHour: number,
): NowStatus {
  const top = bestWindows[0];
  if (!top) {
    return {
      tone: 'past',
      label: 'Geen zonneraam vandaag',
      detail: 'Te weinig opwek om grote apparaten op zon te plannen.',
      window: null,
    };
  }

  if (currentHour >= top.startHour && currentHour < top.endHour) {
    return {
      tone: 'active',
      label: 'Nu in de beste uren',
      detail: 'Zet grote apparaten nu aan — je draait op je eigen zon.',
      window: top,
    };
  }

  if (currentHour < top.startHour) {
    const hoursUntil = top.startHour - currentHour;
    return {
      tone: 'upcoming',
      label: `Beste uren over ${hoursUntil} uur`,
      detail: 'Plan je wasmachine, vaatwasser of laden hier.',
      window: top,
    };
  }

  const next = bestWindows.find((w) => w.startHour > currentHour);
  if (next) {
    return {
      tone: 'upcoming',
      label: 'Volgend zonneraam',
      detail: 'De zonnepiek is voorbij, maar dit raam is nog gunstig.',
      window: next,
    };
  }

  return {
    tone: 'past',
    label: 'Zonnepiek voorbij',
    detail: 'Voor vandaag klaar — morgen weer de beste uren checken.',
    window: top,
  };
}
