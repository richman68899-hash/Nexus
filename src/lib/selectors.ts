import type { AppState, DailyStats, Note, Priority, Project, Task } from '../types';
import { addDays, isDueToday, isOverdue, toDateKey, todayKey } from './dateUtils';
import { clampPercent } from './utils';

export const PRIORITY_RANK: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface ProgressStat {
  completed: number;
  total: number;
  percent: number;
  remaining: number;
}

function toProgressStat(completed: number, total: number): ProgressStat {
  return {
    completed,
    total,
    percent: total === 0 ? 0 : clampPercent((completed / total) * 100),
    remaining: total - completed,
  };
}

export function getProjectTasks(projectId: string, tasks: Task[]): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

export function getProjectProgress(projectId: string, tasks: Task[]): ProgressStat {
  const projectTasks = getProjectTasks(projectId, tasks);
  return toProgressStat(projectTasks.filter((t) => t.completed).length, projectTasks.length);
}

export function getMilestoneProgress(project: Project): ProgressStat {
  return toProgressStat(
    project.milestones.filter((m) => m.completed).length,
    project.milestones.length
  );
}

// ---------------------------------------------------------------------------
// Daily activity — derived entirely from completed tasks/milestones/projects.
// This is the single source of truth for the activity graph AND streaks, so
// there's nothing separate to keep in sync when a completion is undone.
// ---------------------------------------------------------------------------

export function getDailyActivityMap(
  state: Pick<AppState, 'tasks' | 'projects'>
): Map<string, DailyStats> {
  const map = new Map<string, DailyStats>();
  const bump = (date: string, taskInc: number, xpInc: number) => {
    const entry = map.get(date) ?? { date, tasksCompleted: 0, xpEarned: 0 };
    entry.tasksCompleted += taskInc;
    entry.xpEarned += xpInc;
    map.set(date, entry);
  };

  for (const t of state.tasks) {
    if (t.completed && t.completedAt) {
      bump(toDateKey(new Date(t.completedAt)), 1, t.xpAwarded ?? 0);
    }
  }
  for (const p of state.projects) {
    for (const m of p.milestones) {
      if (m.completed && m.completedAt) {
        bump(toDateKey(new Date(m.completedAt)), 0, m.xpAwarded ?? 0);
      }
    }
    if (p.completedAt && p.completionXpAwarded) {
      bump(toDateKey(new Date(p.completedAt)), 0, p.completionXpAwarded);
    }
  }
  return map;
}

function hasTaskActivity(map: Map<string, DailyStats>, date: string): boolean {
  return (map.get(date)?.tasksCompleted ?? 0) > 0;
}

/** Consecutive days (ending today, or yesterday if today has no activity yet) with at least one completed task. */
export function getCurrentStreak(
  map: Map<string, DailyStats>,
  reference: string = todayKey()
): number {
  let cursor = hasTaskActivity(map, reference) ? reference : addDays(reference, -1);
  let count = 0;
  while (hasTaskActivity(map, cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function getLongestStreak(map: Map<string, DailyStats>): number {
  const activeDates = [...map.entries()]
    .filter(([, stats]) => stats.tasksCompleted > 0)
    .map(([date]) => date)
    .sort();

  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;
  for (const date of activeDates) {
    current = prevDate && addDays(prevDate, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevDate = date;
  }
  return longest;
}

// ---------------------------------------------------------------------------
// Task queries
// ---------------------------------------------------------------------------

export function getOverdueTasks(tasks: Task[], reference: string = todayKey()): Task[] {
  return tasks.filter((t) => !t.completed && isOverdue(t.dueDate, reference));
}

export function getTasksDueToday(tasks: Task[], reference: string = todayKey()): Task[] {
  return tasks.filter((t) => !t.completed && isDueToday(t.dueDate, reference));
}

export function getTasksCompletedOn(tasks: Task[], dateKey: string): Task[] {
  return tasks.filter(
    (t) => t.completed && t.completedAt && toDateKey(new Date(t.completedAt)) === dateKey
  );
}

export function getUpcomingTasks(
  tasks: Task[],
  days: number,
  reference: string = todayKey()
): Task[] {
  const end = addDays(reference, days);
  return tasks
    .filter((t) => !t.completed && t.dueDate && t.dueDate > reference && t.dueDate <= end)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
}

/** The single most important incomplete task to surface as "next up". */
export function getNextUpTask(tasks: Task[], reference: string = todayKey()): Task | null {
  const candidates = tasks.filter((t) => !t.completed);
  if (candidates.length === 0) return null;

  const scored = candidates.map((t) => {
    const overdue = isOverdue(t.dueDate, reference);
    const dueToday = isDueToday(t.dueDate, reference);
    let bucket = 3; // no date at all
    if (overdue) bucket = 0;
    else if (dueToday) bucket = 1;
    else if (t.dueDate) bucket = 2;
    return { task: t, bucket, priority: PRIORITY_RANK[t.priority] ?? 4 };
  });

  scored.sort((a, b) => {
    if (a.bucket !== b.bucket) return a.bucket - b.bucket;
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ad = a.task.dueDate ?? '9999-99-99';
    const bd = b.task.dueDate ?? '9999-99-99';
    return ad.localeCompare(bd);
  });

  return scored[0]?.task ?? null;
}

export type TaskSortKey = 'dueDate' | 'priority' | 'createdAt' | 'completedAt';

export function sortTasks(
  tasks: Task[],
  key: TaskSortKey,
  direction: 'asc' | 'desc' = 'asc'
): Task[] {
  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'dueDate':
        cmp = (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99');
        break;
      case 'priority':
        cmp = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
        break;
      case 'createdAt':
        cmp = a.createdAt.localeCompare(b.createdAt);
        break;
      case 'completedAt':
        cmp = (a.completedAt ?? '').localeCompare(b.completedAt ?? '');
        break;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ---------------------------------------------------------------------------
// Dashboard "today" bundle
// ---------------------------------------------------------------------------

export interface TodayStats {
  dueToday: Task[];
  overdue: Task[];
  completedToday: Task[];
  progressPercent: number | null; // null when nothing is due today to measure
  xpEarnedToday: number;
}

export function getTodayStats(
  state: Pick<AppState, 'tasks' | 'projects'>,
  reference: string = todayKey()
): TodayStats {
  const dueToday = getTasksDueToday(state.tasks, reference);
  const overdue = getOverdueTasks(state.tasks, reference);
  const completedToday = getTasksCompletedOn(state.tasks, reference);
  const allDueToday = state.tasks.filter((t) => t.dueDate === reference);
  const completedOfDueToday = allDueToday.filter((t) => t.completed).length;
  const progressPercent =
    allDueToday.length === 0
      ? null
      : clampPercent((completedOfDueToday / allDueToday.length) * 100);
  const dailyMap = getDailyActivityMap(state);
  const xpEarnedToday = dailyMap.get(reference)?.xpEarned ?? 0;

  return { dueToday, overdue, completedToday, progressPercent, xpEarnedToday };
}

// ---------------------------------------------------------------------------
// Calendar aggregation
// ---------------------------------------------------------------------------

export type CalendarItemType = 'task' | 'deadline' | 'milestone' | 'reminder' | 'note';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  time?: string;
  completed?: boolean;
  color?: string;
  refId: string;
  projectId?: string;
}

export function getCalendarItemsForDate(state: AppState, dateKey: string): CalendarItem[] {
  const items: CalendarItem[] = [];

  for (const t of state.tasks) {
    if (t.dueDate === dateKey) {
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.name,
        completed: t.completed,
        refId: t.id,
        projectId: t.projectId,
      });
    }
  }

  for (const p of state.projects) {
    if (p.deadline === dateKey) {
      items.push({
        id: `deadline-${p.id}`,
        type: 'deadline',
        title: `${p.name} deadline`,
        color: p.color,
        refId: p.id,
        projectId: p.id,
      });
    }
    for (const m of p.milestones) {
      if (m.targetDate === dateKey) {
        items.push({
          id: `milestone-${m.id}`,
          type: 'milestone',
          title: m.title,
          completed: m.completed,
          color: p.color,
          refId: p.id,
          projectId: p.id,
        });
      }
    }
  }

  for (const r of state.reminders) {
    if (r.date === dateKey) {
      items.push({ id: `reminder-${r.id}`, type: 'reminder', title: r.title, time: r.time, refId: r.id });
    }
  }

  for (const n of state.notes) {
    if (n.deadline === dateKey) {
      items.push({
        id: `note-${n.id}`,
        type: 'note',
        title: n.title,
        refId: n.id,
        projectId: n.projectId,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function getAllTags(projects: Project[], tasks: Task[], notes: Note[]): string[] {
  const set = new Set<string>();
  projects.forEach((p) => p.tags.forEach((t) => set.add(t)));
  tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
  notes.forEach((n) => n.tags.forEach((tag) => set.add(tag)));
  return [...set].sort((a, b) => a.localeCompare(b));
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  type: 'project' | 'task' | 'note' | 'reward';
  id: string;
  title: string;
  subtitle?: string;
}

export function globalSearch(state: AppState, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const p of state.projects) {
    const haystack = `${p.name} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
    if (haystack.includes(q)) {
      results.push({ type: 'project', id: p.id, title: p.name, subtitle: p.description });
    }
  }
  for (const t of state.tasks) {
    const haystack = `${t.name} ${t.description ?? ''} ${t.tags.join(' ')}`.toLowerCase();
    if (haystack.includes(q)) {
      const project = t.projectId ? state.projects.find((p) => p.id === t.projectId) : undefined;
      results.push({ type: 'task', id: t.id, title: t.name, subtitle: project?.name });
    }
  }
  for (const n of state.notes) {
    const haystack = `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase();
    if (haystack.includes(q)) {
      results.push({ type: 'note', id: n.id, title: n.title, subtitle: n.body.slice(0, 80) });
    }
  }
  for (const r of state.rewards) {
    const haystack = `${r.name} ${r.description ?? ''}`.toLowerCase();
    if (haystack.includes(q)) {
      results.push({ type: 'reward', id: r.id, title: r.name, subtitle: `${r.cost} XP` });
    }
  }

  return results;
}

