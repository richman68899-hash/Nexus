import { useState } from 'react';
import type { AccentPreset } from '../../lib/constants';
import { ICON_PRESETS } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [custom, setCustom] = useState('');

  return (
    <div>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
        {ICON_PRESETS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            aria-label={`Choose icon ${icon}`}
            aria-pressed={value === icon}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-lg transition-colors',
              value === icon
                ? 'bg-[rgba(var(--accent-rgb),0.18)] ring-1 ring-[var(--accent)]'
                : 'bg-[var(--surface-raised)] hover:bg-[var(--border)]'
            )}
          >
            {icon}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Or paste any emoji"
          maxLength={4}
          className="w-40 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          disabled={!custom.trim()}
          onClick={() => {
            onChange(custom.trim());
            setCustom('');
          }}
          className="text-xs font-medium text-[var(--accent)] disabled:opacity-40"
        >
          Use
        </button>
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
}

export function ColorPicker({ value, onChange, presets }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          aria-label={`Choose color ${hex}`}
          aria-pressed={value.toLowerCase() === hex.toLowerCase()}
          className={cn(
            'h-8 w-8 rounded-full transition-transform hover:scale-105',
            value.toLowerCase() === hex.toLowerCase() &&
              'ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]'
          )}
          style={{ backgroundColor: hex }}
        />
      ))}
      <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--border-strong)] text-xs text-[var(--text-muted)]">
        +
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Choose a custom color"
        />
      </label>
    </div>
  );
}

interface AccentPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets: AccentPreset[];
}

export function AccentPicker({ value, onChange, presets }: AccentPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const active = value.toLowerCase() === preset.hex.toLowerCase();
        return (
          <button
            key={preset.hex}
            type="button"
            onClick={() => onChange(preset.hex)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors',
              active
                ? 'border-[var(--text)] bg-[var(--surface-raised)] text-[var(--text)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
            )}
          >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.hex }} />
            {preset.name}
          </button>
        );
      })}
      <label className="relative flex items-center gap-2 overflow-hidden rounded-full border border-dashed border-[var(--border-strong)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
        <span
          className="h-3 w-3 rounded-full border border-[var(--border-strong)]"
          style={{ backgroundColor: value }}
        />
        Custom
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Choose a custom accent color"
        />
      </label>
    </div>
  );
}

