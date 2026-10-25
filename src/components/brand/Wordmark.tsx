import type { HTMLAttributes } from "react";
import { Emblem } from "./Emblem";
export interface WordmarkProps extends HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  size?: "md" | "lg";
}
export function Wordmark({
  compact = false,
  size = "md",
  style,
  ...rest
}: WordmarkProps) {
  return (
    <div
      {...rest}
      style={{ display: "flex", alignItems: "center", gap: 10, ...style }}
    >
      <Emblem size={size === "lg" ? 42 : 30} />
      <span
        style={{
          fontFamily: "var(--cl-font-sans)",
          fontWeight: 600,
          fontSize: compact ? 19 : size === "lg" ? 26 : 19,
          letterSpacing: "-.01em",
        }}
      >
        clearlink
      </span>
    </div>
  );
}
