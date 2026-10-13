/** Generate a unique id. Uses crypto.randomUUID when available, with a fallback. */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Convert a '#rrggbb' or '#rgb' hex color to an "r, g, b" string for use in rgba(var(--x), a). */
export function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r}, ${g}, ${b}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Clamp a percentage-like number into a whole 0-100 range. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(clamp(value, 0, 100));
}

