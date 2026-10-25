import { useId } from 'react';
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label above the field. Always provide one. */
  label?: string;
  /** Helper line under the field (14px, tertiary). */
  hint?: ReactNode;
  /** Error line — replaces hint, turns border red, announced via role=alert. */
  error?: ReactNode;
  /** Room-code entry: monospace, tracked, uppercase, no autocomplete. */
  code?: boolean;
  inputStyle?: CSSProperties;
}

/** Labelled text field. `code` variant formats room codes. */
export function TextInput({ label, hint, error, code = false, id, className = '', style, inputStyle, ...rest }: TextInputProps) {
  const auto = useId();
  const fid = id || 'cl-in-' + auto.replace(/:/g, '');
  const msg = error || hint;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cl-space-2)', ...style }}>
      {label && <label htmlFor={fid} style={{ font: 'var(--cl-weight-semibold) var(--cl-size-sm)/var(--cl-leading-sm) var(--cl-font-sans)', color: 'var(--cl-text)' }}>{label}</label>}
      <input id={fid} aria-invalid={error ? 'true' : undefined} aria-describedby={msg ? fid + '-msg' : undefined}
        autoComplete={code ? 'off' : rest.autoComplete} spellCheck={code ? false : rest.spellCheck}
        className={['cl-input', code && 'cl-input--code', error && 'cl-input--invalid', className].filter(Boolean).join(' ')}
        style={inputStyle} {...rest} />
      {msg && <span id={fid + '-msg'} role={error ? 'alert' : undefined}
        style={{ display: 'flex', gap: 6, alignItems: 'flex-start', font: 'var(--cl-weight-regular) var(--cl-size-xs)/var(--cl-leading-xs) var(--cl-font-sans)', color: error ? 'var(--cl-danger-text)' : 'var(--cl-text-3)' }}>{msg}</span>}
    </div>
  );
}
