import type { HTMLAttributes } from "react";
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
  label?: string;
}
export function Spinner({
  size = 40,
  label = "Loading",
  style,
  ...rest
}: SpinnerProps) {
  return (
    <span role="status" {...rest} style={{ display: "inline-flex", ...style }}>
      <span
        aria-hidden="true"
        className="cl-spinner"
        style={{ width: size, height: size }}
      />
      <span className="cl-sr-only">{label}</span>
    </span>
  );
}
