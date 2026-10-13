import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { Priority, ProjectStatus } from '../../types';
import { cn } from '../../lib/utils';
import { useApp } from '../../store/AppContext';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-[#05070d] hover:brightness-110 active:brightness-95 font-medium',
  secondary:
    'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]',
  danger:
    'bg-transparent text-[var(--danger)] border border-[rgba(var(--danger-rgb),0.4)] hover:bg-[rgba(var(--danger-rgb),0.1)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] transition-colors duration-150 whitespace-nowrap',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/** Icon-only square button (e.g. toolbar actions). */
export function IconButton({
  className,
  size = 'md',
  'aria-label': ariaLabel,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize; 'aria-label': string }) {
  const dims = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-11 w-11' }[size];
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)]',
        'hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        dims,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ interactive, padding = 'md', className, children, onClick, ...rest }: CardProps) {
  const { state } = useApp();
  const paddingMap = state.settings.compactLayout
    ? { none: '', sm: 'p-2', md: 'p-3', lg: 'p-4' }
    : { none: '', sm: 'p-3', md: 'p-4 sm:p-5', lg: 'p-6' };
  const paddingClass = paddingMap[padding];
  const clickable = Boolean(interactive && onClick);

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]',
        interactive &&
          'transition-colors duration-150 hover:border-[var(--border-strong)] cursor-pointer text-left',
        paddingClass,
        className
      )}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type BadgeTone = 'default' | 'accent' | 'danger' | 'warning' | 'success' | 'muted';

const TONE_CLASSES: Record<BadgeTone, string> = {
  default: 'bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border)]',
  accent: 'bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.3)]',
  danger: 'bg-[rgba(var(--danger-rgb),0.12)] text-[var(--danger)] border-[rgba(var(--danger-rgb),0.3)]',
  warning: 'bg-[rgba(251,191,36,0.12)] text-[var(--warning)] border-[rgba(251,191,36,0.3)]',
  success: 'bg-[rgba(52,211,153,0.12)] text-[var(--success)] border-[rgba(52,211,153,0.3)]',
  muted: 'bg-transparent text-[var(--text-faint)] border-[var(--border)]',
};

export function Badge({
  tone = 'default',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-none',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'accent',
  LOW: 'muted',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} className={className}>
      {titleCase(priority)}
    </Badge>
  );
}

const STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  PLANNING: 'muted',
  ACTIVE: 'accent',
  PAUSED: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'muted',
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status]} className={className}>
      {titleCase(status)}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  percent: number;
  className?: string;
  height?: number;
  colorClassName?: string;
  /** Raw CSS color (e.g. a project's own color) — takes precedence over colorClassName. */
  color?: string;
}

export function ProgressBar({ percent, className, height = 6, colorClassName, color }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-[var(--surface-raised)]', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          !color && (colorClassName ?? 'bg-[var(--accent)]')
        )}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-12 text-center',
        className
      )}
    >
      {icon && <div className="text-3xl opacity-70">{icon}</div>}
      <div className="space-y-1">
        <p className="font-display text-base font-medium text-[var(--text)]">{title}</p>
        {description && <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

