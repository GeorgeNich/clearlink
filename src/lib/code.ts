/** Room codes: 8 characters shown as XXXX-XXXX. No O, 0, I or 1. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode(): string {
  let raw = '';
  for (let i = 0; i < 8; i++) raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return formatCode(raw);
}

export function formatCode(raw: string): string {
  return raw.length > 4 ? raw.slice(0, 4) + '-' + raw.slice(4) : raw;
}

/** Uppercases, drops everything that isn't a letter or digit, and caps at 8 characters. */
export function cleanCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

/** Returns a plain-language problem with the code, or null when it looks right. */
export function codeProblem(input: string): string | null {
  const raw = cleanCode(input);
  if (raw.length !== 8) return 'Codes have 8 letters and numbers, like K7MP-R4WX.';
  if (/[O0I1]/.test(raw)) return 'Codes never use O, 0, I or 1. Check the letters again.';
  return null;
}
