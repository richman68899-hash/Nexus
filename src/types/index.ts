// ============================================================================
// Nexus — core data model
// ============================================================================
// This file is the single source of truth for every entity the app stores.
// Derived values (XP totals, levels, streaks, progress percentages) are
// deliberately NOT stored here — they're computed from this data by the
// selectors in `lib/selectors.ts`, so there's never a stale copy to keep in
// sync. See the README for more on that choice.

export type ID = string;

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'PLANNING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
];

export interface Milestone {
  id: ID;
  title: string;
  targetDate?: string; // ISO date, yyyy-mm-dd
  completed: boolean;
  completedAt?: string; // ISO datetime
  xpAwarded?: number; // snapshot of XP granted when completed
}

export interface Project {
  id: ID;
  name: string;
  description: string;
  icon: string; // emoji
  color: string; // hex — this project's own identity color, independent of the app accent
  createdAt: string; // ISO datetime
  updatedAt: string;
  deadline?: string; // ISO date
  priority: Priority;
  status: ProjectStatus;
  tags: string[];
  notes: string; // free-form scratchpad text for this project
  milestones: Milestone[];
  completedAt?: string;
  completionXpAwarded?: number; // set once, guards against double-awarding XP
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N days / weeks / months
}

export interface Subtask {
  id: ID;
  title: string;
  completed: boolean;
}

export type TaskType = 'normal' | 'important';

export interface Task {
  id: ID;
  projectId?: ID;
  name: string;
  description?: string;
  dueDate?: string; // ISO date
  startDate?: string; // ISO date
  priority: Priority;
  tags: string[];
  estimatedDuration?: number; // minutes
  recurrence?: RecurrenceRule;
  notes?: string;
  completed: boolean;
  completedAt?: string; // ISO datetime
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
  xpAwarded?: number; // snapshot of XP granted at completion
  generatedFrom?: ID; // id of the task this recurring instance was generated from
}

export interface Note {
  id: ID;
  title: string;
  body: string;
  date: string; // ISO date this note is "for"
  createdAt: string;
  updatedAt: string;
  projectId?: ID;
  tags: string[];
  deadline?: string; // ISO date, optional reminder/deadline
  convertedToTaskId?: ID;
}

export type ReminderLinkType = 'task' | 'project' | 'note' | 'custom';

export interface Reminder {
  id: ID;
  title: string;
  date: string; // ISO date
  time?: string; // HH:MM, 24h
  repeat?: RecurrenceRule;
  linkedType: ReminderLinkType;
  linkedId?: ID;
  createdAt: string;
  lastTriggeredDate?: string; // ISO date — prevents re-firing repeatedly in the same period
  dismissed: boolean;
}

export interface Reward {
  id: ID;
  name: string;
  description?: string;
  icon: string;
  cost: number; // XP cost
  createdAt: string;
}

export interface RewardTransaction {
  id: ID;
  rewardId: ID;
  rewardName: string; // snapshot — survives later reward edits/deletes
  rewardIcon: string;
  cost: number;
  redeemedAt: string; // ISO datetime
}

export interface Achievement {
  id: ID; // stable key, e.g. 'first_step'
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO datetime — undefined means still locked
}

export interface XpValues {
  normal: number;
  important: number;
  milestone: number;
  projectCompletion: number;
}

export type SoundName = 'chime' | 'pop' | 'bell' | 'sparkle' | 'none';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0..1
  completionSound: SoundName;
  milestoneSound: SoundName;
  rewardSound: SoundName;
  reminderSound: SoundName;
}

export interface UserSettings {
  accentColor: string; // hex
  theme: 'dark' | 'light';
  compactLayout: boolean;
  animationsEnabled: boolean;
  sound: SoundSettings;
  notificationsEnabled: boolean;
  xpValues: XpValues;
  levelThresholds: number[]; // cumulative XP required to reach each level; index 0 = level 1 = 0
  lastView?: ViewName;
}

export interface DailyStats {
  date: string; // yyyy-mm-dd
  tasksCompleted: number;
  xpEarned: number;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  reminders: Reminder[];
  rewards: Reward[];
  rewardTransactions: RewardTransaction[];
  achievements: Achievement[];
  settings: UserSettings;
}

// ---------------------------------------------------------------------------
// Input shapes for create actions. The store fills in ids, timestamps, and
// defaults for everything else.
// ---------------------------------------------------------------------------

export interface NewProjectInput {
  name: string;
  description?: string;
  icon: string;
  color: string;
  deadline?: string;
  priority: Priority;
  status?: ProjectStatus;
  tags?: string[];
}

export interface NewTaskInput {
  name: string;
  description?: string;
  projectId?: ID;
  dueDate?: string;
  startDate?: string;
  priority?: Priority;
  tags?: string[];
  estimatedDuration?: number;
  recurrence?: RecurrenceRule;
  notes?: string;
  subtasks?: string[];
}

export interface NewNoteInput {
  title: string;
  body: string;
  date?: string;
  projectId?: ID;
  tags?: string[];
  deadline?: string;
}

export interface NewReminderInput {
  title: string;
  date: string;
  time?: string;
  repeat?: RecurrenceRule;
  linkedType?: ReminderLinkType;
  linkedId?: ID;
}

export interface NewRewardInput {
  name: string;
  description?: string;
  icon: string;
  cost: number;
}

// ---------------------------------------------------------------------------
// Transient, UI-facing types — never persisted.
// ---------------------------------------------------------------------------

export type CompletionEventType = 'task_completed' | 'milestone_completed' | 'project_completed';

export interface CompletionEvent {
  id: ID;
  type: CompletionEventType;
  label: string;
  xpAwarded: number;
  leveledUp: boolean;
  newLevel: number;
  projectProgress?: {
    projectName: string;
    before: number;
    after: number;
  };
  newlyUnlockedAchievements: Achievement[];
  message?: string;
}

export type ViewName =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'calendar'
  | 'notes'
  | 'progress'
  | 'rewards'
  | 'settings';

export const VIEW_LABELS: Record<ViewName, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  calendar: 'Calendar',
  notes: 'Notes',
  progress: 'Progress',
  rewards: 'Rewards',
  settings: 'Settings',
};

