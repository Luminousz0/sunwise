import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
}

export default function IconButton({
  children,
  label,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-warm/35 transition-colors hover:bg-surface-2 hover:text-warm/70 active:bg-line ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
