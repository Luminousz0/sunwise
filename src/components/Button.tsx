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
    'border border-line-2 text-warm/60 font-medium hover:bg-surface-2 hover:text-warm active:bg-line',
  ghost: 'text-warm/60 font-medium hover:bg-surface-2 hover:text-warm active:bg-line',
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
