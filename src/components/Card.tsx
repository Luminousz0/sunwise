import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export default function Card({ className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}
      {...rest}
    />
  );
}
