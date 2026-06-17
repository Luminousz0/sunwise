import {
  WashingMachine,
  Wind,
  UtensilsCrossed,
  Car,
  Thermometer,
  Flame,
  Plug,
  type LucideIcon,
} from 'lucide-react';

/**
 * Single source of truth mapping an appliance id → its lucide icon.
 * Reused by both the advice cards and the setup sheet (replaces the two
 * duplicated emoji maps that used to live in those files).
 */
const APPLIANCE_ICONS: Record<string, LucideIcon> = {
  washer: WashingMachine,
  dryer: Wind,
  dishwasher: UtensilsCrossed,
  ev: Car,
  heatpump: Thermometer,
  oven: Flame,
};

export function ApplianceIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = APPLIANCE_ICONS[id] ?? Plug;
  return <Icon className={className} strokeWidth={1.75} />;
}
