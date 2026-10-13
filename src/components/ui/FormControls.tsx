import { useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 flex items-center gap-1 font-medium text-[var(--text)]">
        {label}
        {required && <span className="text-[var(--danger)]">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-normal text-[var(--danger)]">{error}</span>}
    </label>
  );
}

const controlBase =
  'w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-colors focus:border-[var(--accent)]';

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(controlBase, className)} />;
}

export function Textarea({
  className,
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} rows={rows} className={cn(controlBase, 'resize-y', className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...rest} className={cn(controlBase, 'appearance-none pr-8', className)}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]', className)}>
      <input type="checkbox" className="h-4 w-4 rounded accent-[var(--accent)]" {...rest} />
      {label}
    </label>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div
      className={cn(
        controlBase,
        'flex flex-wrap items-center gap-1.5 py-1.5 focus-within:border-[var(--accent)]'
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-[rgba(var(--accent-rgb),0.12)] px-2 py-0.5 text-xs text-[var(--accent)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove tag ${tag}`}
            className="hover:opacity-70"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[100px] flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
      />
    </div>
  );
}

