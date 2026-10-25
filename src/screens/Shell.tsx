import type { CSSProperties, ReactNode } from 'react';
export function HallShell({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-bg px-5 py-8">
      {children}
    </div>
  );
}
export function Card({
  children,
  width = 460,
  style,
}: {
  children: ReactNode;
  width?: number;
  ornate?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className="relative flex w-full animate-rise-in flex-col gap-5 rounded-xl border border-line bg-panel p-6"
      style={{ maxWidth: width, ...style }}
    >
      {children}
    </div>
  );
}
export const cardTitle = 'm-0 font-display text-2xl font-semibold text-fg';
export const cardBody = 'm-0 text-base text-fg-2 [text-wrap:pretty]';
