import type { AppState, Priority, TaskType, XpValues } from '../types';
import { clampPercent } from './utils';

/** LOW/MEDIUM tasks count as 'normal'; HIGH/URGENT count as 'important'. */
export function getTaskType(priority: Priority): TaskType {
  return priority === 'HIGH' || priority === 'URGENT' ? 'important' : 'normal';
}

export function getXpForTask(priority: Priority, xpValues: XpValues): number {
  return getTaskType(priority) === 'important' ? xpValues.important : xpValues.normal;
}

/**
 * Default level curve. Levels 1-4 match the brief's own example exactly
 * (0 / 100 / 250 / 500 XP); from level 4 onward the gap between levels
 * keeps growing by a steady 100 XP per level, so the climb never flattens
 * out or suddenly explodes. Fully replaceable from Settings.
 */
export function generateDefaultLevelThresholds(levelCount = 60): number[] {
  const initialGaps = [100, 150, 250]; // L1->L2, L2->L3, L3->L4
  const thresholds: number[] = [0];
  let gap = initialGaps[0];
  for (let i = 1; i < levelCount; i++) {
    gap = i - 1 < initialGaps.length ? initialGaps[i - 1] : gap + 100;
    thresholds.push(thresholds[i - 1] + gap);
  }
  return thresholds;
}

export function getLevel(totalXp: number, thresholds: number[]): number {
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalXp >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

function clampIndex(idx: number, length: number): number {
  return Math.max(0, Math.min(idx, length - 1));
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  currentLevelFloor: number;
  nextLevelCeiling: number | null; // null once past the highest defined level
  xpIntoLevel: number;
  xpForLevel: number | null;
  percentToNextLevel: number; // 0-100
}

export function getLevelProgress(totalXp: number, thresholds: number[]): LevelProgress {
  const level = getLevel(totalXp, thresholds);
  const floorIdx = clampIndex(level - 1, thresholds.length);
  const floor = thresholds[floorIdx] ?? 0;
  const ceiling = level < thresholds.length ? thresholds[level] : null;
  const xpIntoLevel = totalXp - floor;
  const xpForLevel = ceiling !== null ? ceiling - floor : null;
  const percent = xpForLevel ? clampPercent((xpIntoLevel / xpForLevel) * 100) : 100;
  return {
    level,
    totalXp,
    currentLevelFloor: floor,
    nextLevelCeiling: ceiling,
    xpIntoLevel,
    xpForLevel,
    percentToNextLevel: percent,
  };
}

/**
 * Total lifetime XP earned, derived entirely from completed items. This is
 * intentionally never stored — summing it from the actual completed tasks,
 * milestones and projects means it can never drift out of sync with them.
 */
export function getTotalXp(state: Pick<AppState, 'tasks' | 'projects'>): number {
  const taskXp = state.tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.xpAwarded ?? 0), 0);
  const milestoneXp = state.projects
    .flatMap((p) => p.milestones)
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + (m.xpAwarded ?? 0), 0);
  const projectXp = state.projects
    .filter((p) => p.completionXpAwarded)
    .reduce((sum, p) => sum + (p.completionXpAwarded ?? 0), 0);
  return taskXp + milestoneXp + projectXp;
}

/** Lifetime XP earned minus XP already spent in the reward shop. */
export function getXpBalance(
  state: Pick<AppState, 'tasks' | 'projects' | 'rewardTransactions'>
): number {
  const earned = getTotalXp(state);
  const spent = state.rewardTransactions.reduce((sum, t) => sum + t.cost, 0);
  return earned - spent;
}

