import { useMemo, useState } from 'react';
import { useApp } from '../../store/AppContext';
import {
  getCurrentStreak,
  getDailyActivityMap,
  getLongestStreak,
  getMilestoneProgress,
  getOverdueTasks,
  getProjectProgress,
} from '../../lib/selectors';
import { getLevelProgress, getTotalXp, getXpBalance } from '../../lib/xpEngine';
import { addDays, daysBetween, formatShortDate, fromDateKey, todayKey } from '../../lib/dateUtils';
import { cn } from '../../lib/utils';
import { BarChart } from '../ui/Charts';
import { Card, EmptyState, ProgressBar } from '../ui/Primitives';

type RangeOption = 7 | 30 | 90 | 'all';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm" className="flex flex-col gap-1">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="font-mono text-lg font-semibold text-[var(--text)]">{value}</span>
    </Card>
  );
}

export function ProgressPage() {
  const { state } = useApp();
  const [range, setRange] = useState<RangeOption>(30);

  const dailyMap = useMemo(() => getDailyActivityMap(state), [state.tasks, state.projects]);
  const today = todayKey();

  if (state.tasks.length === 0 && state.projects.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon="📈"
          title="Nothing to show yet"
          description="Complete a few tasks and your progress will show up here."
        />
      </div>
    );
  }

  const totalTasksCompleted = state.tasks.filter((t) => t.completed).length;
  const totalTasksCreated = state.tasks.length;
  const completionRate = totalTasksCreated === 0 ? 0 : Math.round((totalTasksCompleted / totalTasksCreated) * 100);
  const totalXp = getTotalXp(state);
  const xpBalance = getXpBalance(state);
  const xpRedeemed = state.rewardTransactions.reduce((sum, t) => sum + t.cost, 0);
  const levelProgress = getLevelProgress(totalXp, state.settings.levelThresholds);
  const currentStreak = getCurrentStreak(dailyMap);
  const longestStreak = getLongestStreak(dailyMap);
  const overdueCount = getOverdueTasks(state.tasks, today).length;
  const projectsCompleted = state.projects.filter((p) => p.status === 'COMPLETED').length;

  const activeDates = [...dailyMap.keys()].sort();
  const earliestDate = activeDates[0] ?? today;
  const allTimeSpan = Math.max(daysBetween(earliestDate, today) + 1, 1);
  const rangeDays = range === 'all' ? allTimeSpan : range;

  const chartData = Array.from({ length: rangeDays }, (_, i) => {
    const idx = rangeDays - 1 - i;
    const date = addDays(today, -idx);
    return { label: formatShortDate(date), value: dailyMap.get(date)?.tasksCompleted ?? 0 };
  });

  const totalInRange = chartData.reduce((sum, p) => sum + p.value, 0);
  const dailyAverage = rangeDays > 0 ? totalInRange / rangeDays : 0;
  const highestDay = chartData.reduce((max, p) => Math.max(max, p.value), 0);
  const weeklyAverage = dailyAverage * 7;

  const last7 = chartData.slice(-7).reduce((sum, p) => sum + p.value, 0);
  const last30Data = Array.from({ length: 30 }, (_, i) => dailyMap.get(addDays(today, -(29 - i)))?.tasksCompleted ?? 0);
  const last30 = last30Data.reduce((a, b) => a + b, 0);

  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const [dateKey, stats] of dailyMap.entries()) {
    weekdayTotals[fromDateKey(dateKey).getDay()] += stats.tasksCompleted;
  }
  const bestWeekdayIndex = weekdayTotals.some((v) => v > 0)
    ? weekdayTotals.indexOf(Math.max(...weekdayTotals))
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Overview</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Tasks completed" value={String(totalTasksCompleted)} />
          <Stat label="Completion rate" value={`${completionRate}%`} />
          <Stat label="Total XP" value={String(totalXp)} />
          <Stat label="Level" value={String(levelProgress.level)} />
          <Stat label="Current streak" value={`${currentStreak}d`} />
          <Stat label="Longest streak" value={`${longestStreak}d`} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-[var(--text)]">Tasks completed per day</h2>
          <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-0.5">
            {([7, 30, 90, 'all'] as RangeOption[]).map((opt) => (
              <button
                key={String(opt)}
                onClick={() => setRange(opt)}
                className={cn(
                  'rounded-[calc(var(--radius-md)-2px)] px-2.5 py-1 text-xs font-medium transition-colors',
                  range === opt ? 'bg-[var(--surface-raised)] text-[var(--text)]' : 'text-[var(--text-muted)]'
                )}
              >
                {opt === 'all' ? 'All' : `${opt}d`}
              </button>
            ))}
          </div>
        </div>
        <Card padding="md">
          <BarChart data={chartData} formatValue={(v) => `${v} task${v === 1 ? '' : 's'}`} title="Tasks completed per day" />
        </Card>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Daily average" value={dailyAverage.toFixed(1)} />
          <Stat label="Weekly average" value={weeklyAverage.toFixed(1)} />
          <Stat label="Highest day" value={String(highestDay)} />
          <Stat label="Longest streak" value={`${longestStreak}d`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Project progress</h2>
        {state.projects.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No projects yet.</p>
        ) : (
          <div className="space-y-2.5">
            {state.projects.map((project) => {
              const progress = getProjectProgress(project.id, state.tasks);
              const milestones = getMilestoneProgress(project);
              return (
                <Card key={project.id} padding="sm" className="flex items-center gap-3">
                  <span className="text-lg">{project.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-[var(--text)]">{project.name}</span>
                      <span className="shrink-0 font-mono text-xs text-[var(--text-muted)]">
                        {progress.completed}/{progress.total} tasks
                        {milestones.total > 0 && ` · ${milestones.completed}/${milestones.total} milestones`}
                      </span>
                    </div>
                    <ProgressBar percent={progress.percent} color={project.color} className="mt-1.5" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold text-[var(--text)]">Analytics</h2>
        <p className="mb-3 text-sm text-[var(--text-muted)]">
          Your average is <span className="font-mono text-[var(--text)]">{(last30 / 30).toFixed(1)}</span> completed
          tasks/day over the past 30 days.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Past 7 days" value={String(last7)} />
          <Stat label="Past 30 days" value={String(last30)} />
          <Stat label="Overdue tasks" value={String(overdueCount)} />
          <Stat label="Projects completed" value={String(projectsCompleted)} />
          <Stat label="Most productive day" value={bestWeekdayIndex !== null ? WEEKDAY_NAMES[bestWeekdayIndex] : '—'} />
          <Stat label="XP earned (lifetime)" value={String(totalXp)} />
          <Stat label="XP redeemed" value={String(xpRedeemed)} />
          <Stat label="XP balance" value={String(xpBalance)} />
        </div>
      </section>
    </div>
  );
}

