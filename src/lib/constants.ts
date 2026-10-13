import type { UserSettings } from '../types';
import { generateDefaultLevelThresholds } from './xpEngine';

export interface AccentPreset {
  name: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Neon Cyan', hex: '#22D3EE' },
  { name: 'Neon Purple', hex: '#A78BFA' },
  { name: 'Neon Green', hex: '#34D399' },
  { name: 'Neon Blue', hex: '#60A5FA' },
  { name: 'Neon Pink', hex: '#F472B6' },
];

export const PROJECT_COLOR_PRESETS: string[] = [
  '#22D3EE', '#A78BFA', '#34D399', '#60A5FA', '#F472B6',
  '#FB923C', '#FACC15', '#F87171', '#4ADE80', '#818CF8',
];

export const ICON_PRESETS: string[] = [
  '🚀', '🎯', '🧠', '⚡', '🔥', '💎', '🏆', '⭐', '🎓', '📚',
  '💡', '🛠️', '🎨', '📈', '🧩', '🗂️', '🌱', '🏔️', '♟️', '🎮',
  '🧪', '🎵', '✍️', '🏗️', '🌟', '📌', '🔭', '🧭', '🗓️', '✅',
];

export const DEFAULT_XP_VALUES = {
  normal: 10,
  important: 20,
  milestone: 50,
  projectCompletion: 100,
};

export const MOTIVATIONAL_MESSAGES: string[] = [
  'Momentum is building.',
  "That's the way to keep it moving.",
  'Small step, real progress.',
  'You showed up — that counts.',
  'Nice work. On to the next.',
  'Consistency wins. Keep going.',
  'One more done. Stack them up.',
  'Progress, not perfection.',
];

export function getRandomMotivationalMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

export function createDefaultSettings(): UserSettings {
  return {
    accentColor: ACCENT_PRESETS[0].hex,
    theme: 'dark',
    compactLayout: false,
    animationsEnabled: true,
    sound: {
      enabled: true,
      volume: 0.6,
      completionSound: 'chime',
      milestoneSound: 'sparkle',
      rewardSound: 'bell',
      reminderSound: 'pop',
    },
    notificationsEnabled: false,
    xpValues: { ...DEFAULT_XP_VALUES },
    levelThresholds: generateDefaultLevelThresholds(),
    lastView: 'dashboard',
  };
}

