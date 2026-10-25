import type { SVGProps } from 'react';
export interface EmblemProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
export function Emblem({ size = 30, style, ...rest }: EmblemProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 30 20"
      fill="none"
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...rest}
    >
      <circle cx="10" cy="10" r="8.5" stroke="var(--cl-accent)" strokeWidth="2.5" />
      <circle cx="20" cy="10" r="8.5" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
