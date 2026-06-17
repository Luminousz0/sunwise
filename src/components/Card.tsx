import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

/** Frosted glass surface — warm dark theme. */
export default function Card({ className = '', ...rest }: Props) {
  return <div className={`glass ${className}`} {...rest} />;
}
