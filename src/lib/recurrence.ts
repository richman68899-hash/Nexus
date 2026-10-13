import type { Task } from '../types';
import { generateId } from './utils';
import { addDays, addMonths, daysBetween, nowISO, todayKey } from './dateUtils';

/**
 * Builds the next occurrence of a recurring task, preserving the gap
 * between start date and due date (if both were set) and resetting
 * subtasks and completion state. Kept deliberately simple — daily / weekly
 * / monthly with an interval — rather than a full RRULE engine, per the
 * brief's own "reliability over AI/feature complexity" guidance.
 */
export function generateNextOccurrence(task: Task): Task {
  if (!task.recurrence) return { ...task, id: generateId() };

  const base = task.dueDate ?? task.startDate ?? todayKey();
  const interval = Math.max(1, task.recurrence.interval);

  let nextBase: string;
  switch (task.recurrence.frequency) {
    case 'weekly':
      nextBase = addDays(base, 7 * interval);
      break;
    case 'monthly':
      nextBase = addMonths(base, interval);
      break;
    case 'daily':
    default:
      nextBase = addDays(base, interval);
      break;
  }

  let nextDue: string | undefined;
  let nextStart: string | undefined;

  if (task.dueDate) {
    nextDue = nextBase;
    if (task.startDate) {
      const gap = daysBetween(task.startDate, task.dueDate);
      nextStart = addDays(nextBase, -gap);
    }
  } else if (task.startDate) {
    nextStart = nextBase;
  }

  const now = nowISO();
  return {
    ...task,
    id: generateId(),
    dueDate: nextDue,
    startDate: nextStart,
    completed: false,
    completedAt: undefined,
    xpAwarded: undefined,
    createdAt: now,
    updatedAt: now,
    subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
    generatedFrom: task.id,
  };
}

