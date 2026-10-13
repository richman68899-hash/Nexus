import type { AppState } from '../types';
import { createDefaultSettings } from './constants';
import { getDefaultAchievements } from './achievementEngine';

const STORAGE_KEY = 'nexus:state:v1';

export function createEmptyState(): AppState {
  return {
    projects: [],
    tasks: [],
    notes: [],
    reminders: [],
    rewards: [],
    rewardTransactions: [],
    achievements: getDefaultAchievements(),
    settings: createDefaultSettings(),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges arbitrary saved/imported JSON over fresh defaults so that missing
 * fields, an older save from before a field existed, or a partly-corrupted
 * file can never crash the app — every entity list and every setting falls
 * back independently rather than the whole load failing at once.
 */
export function mergeWithDefaults(saved: unknown): AppState {
  const defaults = createEmptyState();
  if (!isPlainObject(saved)) return defaults;

  const savedSettings = isPlainObject(saved.settings) ? saved.settings : {};
  const savedSound = isPlainObject(savedSettings.sound) ? savedSettings.sound : {};
  const savedXpValues = isPlainObject(savedSettings.xpValues) ? savedSettings.xpValues : {};

  return {
    projects: Array.isArray(saved.projects) ? (saved.projects as AppState['projects']) : defaults.projects,
    tasks: Array.isArray(saved.tasks) ? (saved.tasks as AppState['tasks']) : defaults.tasks,
    notes: Array.isArray(saved.notes) ? (saved.notes as AppState['notes']) : defaults.notes,
    reminders: Array.isArray(saved.reminders)
      ? (saved.reminders as AppState['reminders'])
      : defaults.reminders,
    rewards: Array.isArray(saved.rewards) ? (saved.rewards as AppState['rewards']) : defaults.rewards,
    rewardTransactions: Array.isArray(saved.rewardTransactions)
      ? (saved.rewardTransactions as AppState['rewardTransactions'])
      : defaults.rewardTransactions,
    achievements: Array.isArray(saved.achievements)
      ? (saved.achievements as AppState['achievements'])
      : defaults.achievements,
    settings: {
      ...defaults.settings,
      ...(savedSettings as Partial<AppState['settings']>),
      sound: { ...defaults.settings.sound, ...(savedSound as Partial<AppState['settings']['sound']>) },
      xpValues: {
        ...defaults.settings.xpValues,
        ...(savedXpValues as Partial<AppState['settings']['xpValues']>),
      },
    },
  };
}

export interface LoadResult {
  state: AppState;
  recovered: boolean; // true if saved data existed but was unreadable, so we fell back to defaults
}

export function loadState(): LoadResult {
  if (typeof window === 'undefined') return { state: createEmptyState(), recovered: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createEmptyState(), recovered: false };
    return { state: mergeWithDefaults(JSON.parse(raw)), recovered: false };
  } catch (error) {
    console.error('Nexus: saved data could not be read, starting fresh.', error);
    return { state: createEmptyState(), recovered: true };
  }
}

export function saveState(state: AppState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Nexus: could not save — storage may be full or unavailable.', error);
    return false;
  }
}

export function clearStoredState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}

