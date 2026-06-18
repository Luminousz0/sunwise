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
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white/75 active:bg-white/15 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
