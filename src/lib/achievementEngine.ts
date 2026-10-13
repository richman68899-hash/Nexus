import type { Achievement, AppState } from '../types';
import { getCurrentStreak, getDailyActivityMap } from './selectors';
import { nowISO } from './dateUtils';

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: (state: AppState) => boolean;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first task.',
    icon: '🏁',
    isUnlocked: (state) => state.tasks.some((t) => t.completed),
  },
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Complete 10 tasks.',
    icon: '⭐',
    isUnlocked: (state) => state.tasks.filter((t) => t.completed).length >= 10,
  },
  {
    id: 'consistency',
    title: 'Consistency',
    description: 'Complete tasks 7 days in a row.',
    icon: '🔥',
    isUnlocked: (state) => getCurrentStreak(getDailyActivityMap(state)) >= 7,
  },
  {
    id: 'project_finisher',
    title: 'Project Finisher',
    description: 'Complete a project.',
    icon: '🏆',
    isUnlocked: (state) => state.projects.some((p) => p.status === 'COMPLETED'),
  },
  {
    id: 'big_day',
    title: 'Big Day',
    description: 'Complete 10 tasks in one day.',
    icon: '⚡',
    isUnlocked: (state) => {
      for (const stats of getDailyActivityMap(state).values()) {
        if (stats.tasksCompleted >= 10) return true;
      }
      return false;
    },
  },
];

/** The full achievement list, all locked — used to seed a fresh install. */
export function getDefaultAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFS.map(({ id, title, description, icon }) => ({
    id,
    title,
    description,
    icon,
    unlockedAt: undefined,
  }));
}

/**
 * Re-evaluates every achievement against the given state. Achievements only
 * ever unlock, never re-lock: undoing a completion later won't take one
 * away, the same way a race result still counts after you stop running.
 */
export function checkAchievements(state: AppState): {
  achievements: Achievement[];
  newlyUnlocked: Achievement[];
} {
  const newlyUnlocked: Achievement[] = [];
  const byId = new Map(state.achievements.map((a) => [a.id, a]));

  const achievements = ACHIEVEMENT_DEFS.map((def) => {
    const existing = byId.get(def.id);
    if (existing?.unlockedAt) return existing;

    if (def.isUnlocked(state)) {
      const unlocked: Achievement = {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlockedAt: nowISO(),
      };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }

    return (
      existing ?? {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlockedAt: undefined,
      }
    );
  });

  return { achievements, newlyUnlocked };
}

