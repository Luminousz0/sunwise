import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gold text-stone-900 font-semibold hover:bg-gold-soft active:scale-95 disabled:opacity-40',
  secondary:
    'border border-white/20 text-white/60 font-medium hover:bg-white/10 hover:text-white active:bg-white/15',
  ghost: 'text-white/60 font-medium hover:bg-white/10 hover:text-white active:bg-white/15',
};

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
