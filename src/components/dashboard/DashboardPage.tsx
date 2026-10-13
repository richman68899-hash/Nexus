import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import type { Task } from '../../types';
import { useApp } from '../../store/AppContext';
import { getCurrentStreak, getDailyActivityMap, getNextUpTask, getTodayStats } from '../../lib/selectors';
import { formatDateTimeLabel, formatFullDate, todayKey } from '../../lib/dateUtils';
import { cn } from '../../lib/utils';
import { Button, Card, EmptyState } from '../ui/Primitives';
import { TaskItem } from '../tasks/TaskItem';
import { ProjectCard } from '../projects/ProjectCard';
import { ProjectDetailModal } from '../projects/ProjectDetailModal';
import { ProjectFormModal } from '../projects/ProjectFormModal';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <Card padding="sm" className="flex flex-col gap-1">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span
        className={cn('font-mono text-lg font-semibold', tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]')}
      >
        {value}
      </span>
    </Card>
  );
}

export function DashboardPage({ onStartFocus }: { onStartFocus: (task: Task) => void }) {
  const { state } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  const today = todayKey();
  const todayStats = getTodayStats(state, today);
  const nextTask = getNextUpTask(state.tasks, today);
  const streak = getCurrentStreak(getDailyActivityMap(state));

  const activeProjects = state.projects.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNING');
  const upcomingReminders = [...state.reminders]
    .filter((r) => r.date >= today)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
    .slice(0, 5);

  const selectedProject = selectedProjectId
    ? (state.projects.find((p) => p.id === selectedProjectId) ?? null)
    : null;

  const hasAnything = state.projects.length > 0 || state.tasks.length > 0;

  if (!hasAnything) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon="🛰️"
          title="Welcome to Nexus"
          description="Create your first project to start building your command center."
          action={
            <Button onClick={() => setProjectFormOpen(true)} icon={<Plus size={15} />}>
              Create project
            </Button>
          }
        />
        <ProjectFormModal open={projectFormOpen} onClose={() => setProjectFormOpen(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--text)]">{greeting()}</h1>
        <p className="text-sm text-[var(--text-muted)]">{formatFullDate(today)}</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Today</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Due today" value={String(todayStats.dueToday.length)} />
          <Stat
            label="Overdue"
            value={String(todayStats.overdue.length)}
            tone={todayStats.overdue.length > 0 ? 'danger' : undefined}
          />
          <Stat label="Completed today" value={String(todayStats.completedToday.length)} />
          <Stat
            label="Today's progress"
            value={todayStats.progressPercent === null ? '—' : `${todayStats.progressPercent}%`}
          />
          <Stat label="Streak" value={`${streak}d`} />
          <Stat label="XP today" value={`+${todayStats.xpEarnedToday}`} />
        </div>
      </section>

      {nextTask && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[var(--text)]">Next up</h2>
            <button
              onClick={() => onStartFocus(nextTask)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:opacity-80"
            >
              <Zap size={13} /> Focus
            </button>
          </div>
          <div className="glow-accent-sm rounded-[var(--radius-lg)]">
            <TaskItem task={nextTask} />
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-[var(--text)]">Projects</h2>
          <Button size="sm" variant="secondary" onClick={() => setProjectFormOpen(true)} icon={<Plus size={14} />}>
            New project
          </Button>
        </div>
        {activeProjects.length === 0 ? (
          <EmptyState
            icon="🛰️"
            title="No active projects"
            description="Create a project, or reactivate one from the Projects page."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={state.tasks}
                onClick={() => setSelectedProjectId(project.id)}
              />
            ))}
          </div>
        )}
      </section>

      {upcomingReminders.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Upcoming reminders</h2>
          <div className="space-y-1.5">
            {upcomingReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--text)]">{r.title}</span>
                <span className="text-xs text-[var(--text-muted)]">{formatDateTimeLabel(r.date, r.time)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProjectFormModal
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSaved={(p) => setSelectedProjectId(p.id)}
      />
      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProjectId(null)} />
    </div>
  );
}

