import { useEffect } from 'react';
import { Sparkles, TrendingUp, Trophy, X } from 'lucide-react';
import type { CompletionEvent } from '../../types';
import { cn } from '../../lib/utils';

interface CompletionToastProps {
  event: CompletionEvent | null;
  onDismiss: () => void;
  animationsEnabled: boolean;
}

const TYPE_LABEL: Record<CompletionEvent['type'], string> = {
  task_completed: 'Task completed',
  milestone_completed: 'Milestone reached',
  project_completed: 'Project completed',
};

export function CompletionToast({ event, onDismiss, animationsEnabled }: CompletionToastProps) {
  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(onDismiss, 4200);
    return () => clearTimeout(timer);
  }, [event, onDismiss]);

  if (!event) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-6">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'glow-accent pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-modal)]',
          animationsEnabled && 'animate-nx-toast-in'
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.15)] text-[var(--accent)]',
            animationsEnabled && 'animate-nx-pop'
          )}
        >
          {event.type === 'project_completed' ? <Trophy size={18} /> : <Sparkles size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-[var(--text)]">{TYPE_LABEL[event.type]}</p>
            <button
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="text-[var(--text-faint)] transition-colors hover:text-[var(--text)]"
            >
              <X size={15} />
            </button>
          </div>
          <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">{event.label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-mono font-semibold text-[var(--accent)]">+{event.xpAwarded} XP</span>
            {event.projectProgress && (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--text-muted)]">
                <TrendingUp size={12} />
                {event.projectProgress.projectName}: {event.projectProgress.before}% → {event.projectProgress.after}%
              </span>
            )}
          </div>
          {event.leveledUp && (
            <p className="mt-1 text-xs font-medium text-[var(--accent)]">
              Level up — you&rsquo;re now level {event.newLevel}.
            </p>
          )}
          {event.newlyUnlockedAchievements.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {event.newlyUnlockedAchievements.map((a) => (
                <p key={a.id} className="text-xs text-[var(--text-muted)]">
                  {a.icon} Achievement unlocked: <span className="text-[var(--text)]">{a.title}</span>
                </p>
              ))}
            </div>
          )}
          {event.message && <p className="mt-1.5 text-xs italic text-[var(--text-faint)]">{event.message}</p>}
        </div>
      </div>
    </div>
  );
}

