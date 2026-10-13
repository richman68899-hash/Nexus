import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type {
  Achievement,
  AppState,
  CompletionEvent,
  Milestone,
  NewNoteInput,
  NewProjectInput,
  NewReminderInput,
  NewRewardInput,
  NewTaskInput,
  Note,
  Project,
  Reminder,
  Reward,
  RewardTransaction,
  Subtask,
  Task,
  UserSettings,
} from '../types';
import { generateId } from '../lib/utils';
import { nowISO, todayKey } from '../lib/dateUtils';
import { createEmptyState, loadState, saveState, clearStoredState } from '../lib/persistence';
import { checkAchievements } from '../lib/achievementEngine';
import { getLevel, getTotalXp, getXpBalance, getXpForTask } from '../lib/xpEngine';
import { getProjectProgress } from '../lib/selectors';
import { generateNextOccurrence } from '../lib/recurrence';
import { playSound } from '../lib/soundEngine';
import { getDueReminders, showBrowserNotification } from '../lib/notifications';
import { generateDemoState } from '../lib/demoData';
import { exportStateAsJson, readImportFile } from '../lib/exportImport';
import { getRandomMotivationalMessage } from '../lib/constants';

function withAchievements(next: AppState): { state: AppState; newlyUnlocked: Achievement[] } {
  const { achievements, newlyUnlocked } = checkAchievements(next);
  return { state: { ...next, achievements }, newlyUnlocked };
}

interface AppContextValue {
  state: AppState;
  toastEvent: CompletionEvent | null;
  dismissToast: () => void;
  dataRecovered: boolean;

  addProject: (input: NewProjectInput) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  duplicateProject: (id: string) => Project | undefined;
  addMilestone: (projectId: string, title: string, targetDate?: string) => void;
  updateMilestone: (projectId: string, milestoneId: string, patch: Partial<Milestone>) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;

  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  moveTaskToDate: (id: string, date: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  addNote: (input: NewNoteInput) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  convertNoteToTask: (id: string) => Task | undefined;

  addReminder: (input: NewReminderInput) => Reminder;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  dismissReminder: (id: string) => void;

  addReward: (input: NewRewardInput) => Reward;
  updateReward: (id: string, patch: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  redeemReward: (id: string) => { success: boolean; error?: string };

  updateSettings: (patch: Partial<UserSettings>) => void;

  exportData: () => void;
  importData: (file: File) => Promise<{ success: boolean; error?: string }>;
  loadDemoData: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadState());
  const [state, setState] = useState<AppState>(initial.state);
  const [toastEvent, setToastEvent] = useState<CompletionEvent | null>(null);
  const dataRecovered = initial.recovered;

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Checks for due reminders on an interval while the app is open. Reads
  // through stateRef rather than the `state` closure so the interval never
  // needs to be torn down and recreated on every keystroke — see the
  // README for why this specific pattern is needed here and nowhere else.
  useEffect(() => {
    const interval = setInterval(() => {
      const current = stateRef.current;
      if (!current.settings.notificationsEnabled) return;
      const due = getDueReminders(current.reminders);
      if (due.length === 0) return;

      const todayKeyValue = todayKey();
      const dueIds = new Set(due.map((r) => r.id));
      const updatedReminders = current.reminders.map((r) =>
        dueIds.has(r.id) ? { ...r, lastTriggeredDate: todayKeyValue } : r
      );
      setState({ ...current, reminders: updatedReminders });

      due.forEach((reminder) => showBrowserNotification(reminder.title));
      if (current.settings.sound.enabled) {
        playSound(current.settings.sound.reminderSound, current.settings.sound.volume);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function playSettingsSound(
    kind: 'completionSound' | 'milestoneSound' | 'rewardSound' | 'reminderSound'
  ) {
    if (!state.settings.sound.enabled) return;
    playSound(state.settings.sound[kind], state.settings.sound.volume);
  }

  // --- Projects --------------------------------------------------------

  const addProject = (input: NewProjectInput): Project => {
    const now = nowISO();
    const project: Project = {
      id: generateId(),
      name: input.name,
      description: input.description ?? '',
      icon: input.icon,
      color: input.color,
      createdAt: now,
      updatedAt: now,
      deadline: input.deadline,
      priority: input.priority,
      status: input.status ?? 'PLANNING',
      tags: input.tags ?? [],
      notes: '',
      milestones: [],
    };
    const { state: finalState } = withAchievements({ ...state, projects: [...state.projects, project] });
    setState(finalState);
    return project;
  };

  const updateProject = (id: string, patch: Partial<Project>): void => {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return;

    const now = nowISO();
    let updated: Project = { ...project, ...patch, updatedAt: now };
    const isNewCompletion =
      patch.status === 'COMPLETED' && project.status !== 'COMPLETED' && !project.completionXpAwarded;
    if (isNewCompletion) {
      updated = { ...updated, completedAt: now, completionXpAwarded: state.settings.xpValues.projectCompletion };
    }

    const nextBase = { ...state, projects: state.projects.map((p) => (p.id === id ? updated : p)) };
    const { state: finalState, newlyUnlocked } = withAchievements(nextBase);
    setState(finalState);

    if (isNewCompletion) {
      const levelBefore = getLevel(getTotalXp(state), state.settings.levelThresholds);
      const levelAfter = getLevel(getTotalXp(finalState), finalState.settings.levelThresholds);
      setToastEvent({
        id: generateId(),
        type: 'project_completed',
        label: project.name,
        xpAwarded: updated.completionXpAwarded ?? 0,
        leveledUp: levelAfter > levelBefore,
        newLevel: levelAfter,
        newlyUnlockedAchievements: newlyUnlocked,
        message: getRandomMotivationalMessage(),
      });
      playSettingsSound('milestoneSound');
    }
  };

  const deleteProject = (id: string): void => {
    const nextBase = {
      ...state,
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const archiveProject = (id: string): void => updateProject(id, { status: 'ARCHIVED' });

  const duplicateProject = (id: string): Project | undefined => {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return undefined;
    const now = nowISO();
    const newProject: Project = {
      ...project,
      id: generateId(),
      name: `${project.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      status: 'PLANNING',
      completedAt: undefined,
      completionXpAwarded: undefined,
      milestones: project.milestones.map((m) => ({
        ...m,
        id: generateId(),
        completed: false,
        completedAt: undefined,
        xpAwarded: undefined,
      })),
    };
    const newTasks: Task[] = state.tasks
      .filter((t) => t.projectId === id)
      .map((t) => ({
        ...t,
        id: generateId(),
        projectId: newProject.id,
        completed: false,
        completedAt: undefined,
        xpAwarded: undefined,
        createdAt: now,
        updatedAt: now,
        subtasks: t.subtasks.map((s) => ({ ...s, id: generateId(), completed: false })),
      }));

    const nextBase = { ...state, projects: [...state.projects, newProject], tasks: [...state.tasks, ...newTasks] };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
    return newProject;
  };

  const addMilestone = (projectId: string, title: string, targetDate?: string): void => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const milestone: Milestone = { id: generateId(), title: trimmed, completed: false, targetDate };
    const nextBase = {
      ...state,
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, milestones: [...p.milestones, milestone], updatedAt: nowISO() } : p
      ),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const updateMilestone = (projectId: string, milestoneId: string, patch: Partial<Milestone>): void => {
    const nextBase = {
      ...state,
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, ...patch } : m)) }
          : p
      ),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const toggleMilestone = (projectId: string, milestoneId: string): void => {
    const project = state.projects.find((p) => p.id === projectId);
    const milestone = project?.milestones.find((m) => m.id === milestoneId);
    if (!project || !milestone) return;

    const completing = !milestone.completed;
    const now = nowISO();
    const xpAwarded = completing ? state.settings.xpValues.milestone : undefined;

    const nextBase = {
      ...state,
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId
                  ? { ...m, completed: completing, completedAt: completing ? now : undefined, xpAwarded }
                  : m
              ),
            }
          : p
      ),
    };
    const { state: finalState, newlyUnlocked } = withAchievements(nextBase);
    setState(finalState);

    if (completing) {
      const levelBefore = getLevel(getTotalXp(state), state.settings.levelThresholds);
      const levelAfter = getLevel(getTotalXp(finalState), finalState.settings.levelThresholds);
      setToastEvent({
        id: generateId(),
        type: 'milestone_completed',
        label: milestone.title,
        xpAwarded: xpAwarded ?? 0,
        leveledUp: levelAfter > levelBefore,
        newLevel: levelAfter,
        newlyUnlockedAchievements: newlyUnlocked,
        message: getRandomMotivationalMessage(),
      });
      playSettingsSound('milestoneSound');
    }
  };

  const deleteMilestone = (projectId: string, milestoneId: string): void => {
    const nextBase = {
      ...state,
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) } : p
      ),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  // --- Tasks -------------------------------------------------------------

  const addTask = (input: NewTaskInput): Task => {
    const now = nowISO();
    const task: Task = {
      id: generateId(),
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      dueDate: input.dueDate,
      startDate: input.startDate,
      priority: input.priority ?? 'MEDIUM',
      tags: input.tags ?? [],
      estimatedDuration: input.estimatedDuration,
      recurrence: input.recurrence,
      notes: input.notes,
      completed: false,
      createdAt: now,
      updatedAt: now,
      subtasks: (input.subtasks ?? []).map((title) => ({ id: generateId(), title, completed: false })),
    };
    const { state: finalState } = withAchievements({ ...state, tasks: [...state.tasks, task] });
    setState(finalState);
    return task;
  };

  const updateTask = (id: string, patch: Partial<Task>): void => {
    const nextBase = {
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const deleteTask = (id: string): void => {
    const { state: finalState } = withAchievements({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
    setState(finalState);
  };

  const completeTask = (id: string): void => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.completed) return;

    const xpAwarded = getXpForTask(task.priority, state.settings.xpValues);
    const now = nowISO();
    let updatedTasks = state.tasks.map((t) =>
      t.id === id ? { ...t, completed: true, completedAt: now, xpAwarded } : t
    );
    if (task.recurrence) {
      updatedTasks = [...updatedTasks, generateNextOccurrence(task)];
    }

    const { state: finalState, newlyUnlocked } = withAchievements({ ...state, tasks: updatedTasks });

    const levelBefore = getLevel(getTotalXp(state), state.settings.levelThresholds);
    const levelAfter = getLevel(getTotalXp(finalState), finalState.settings.levelThresholds);

    let projectProgress: CompletionEvent['projectProgress'];
    if (task.projectId) {
      const project = state.projects.find((p) => p.id === task.projectId);
      if (project) {
        projectProgress = {
          projectName: project.name,
          before: getProjectProgress(task.projectId, state.tasks).percent,
          after: getProjectProgress(task.projectId, finalState.tasks).percent,
        };
      }
    }

    setState(finalState);
    setToastEvent({
      id: generateId(),
      type: 'task_completed',
      label: task.name,
      xpAwarded,
      leveledUp: levelAfter > levelBefore,
      newLevel: levelAfter,
      projectProgress,
      newlyUnlockedAchievements: newlyUnlocked,
      message: getRandomMotivationalMessage(),
    });
    playSettingsSound('completionSound');
  };

  const uncompleteTask = (id: string): void => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task || !task.completed) return;
    const nextBase = {
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: false, completedAt: undefined } : t)),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const moveTaskToDate = (id: string, date: string): void => updateTask(id, { dueDate: date });

  const addSubtask = (taskId: string, title: string): void => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const subtask: Subtask = { id: generateId(), title: trimmed, completed: false };
    const nextBase = {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask], updatedAt: nowISO() } : t
      ),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const toggleSubtask = (taskId: string, subtaskId: string): void => {
    const nextBase = {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
              updatedAt: nowISO(),
            }
          : t
      ),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const deleteSubtask = (taskId: string, subtaskId: string): void => {
    const nextBase = {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId), updatedAt: nowISO() } : t
      ),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  // --- Notes ---------------------------------------------------------------

  const addNote = (input: NewNoteInput): Note => {
    const now = nowISO();
    const note: Note = {
      id: generateId(),
      title: input.title,
      body: input.body,
      date: input.date ?? todayKey(),
      createdAt: now,
      updatedAt: now,
      projectId: input.projectId,
      tags: input.tags ?? [],
      deadline: input.deadline,
    };
    const { state: finalState } = withAchievements({ ...state, notes: [...state.notes, note] });
    setState(finalState);
    return note;
  };

  const updateNote = (id: string, patch: Partial<Note>): void => {
    const nextBase = {
      ...state,
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n)),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
  };

  const deleteNote = (id: string): void => {
    const { state: finalState } = withAchievements({ ...state, notes: state.notes.filter((n) => n.id !== id) });
    setState(finalState);
  };

  const convertNoteToTask = (id: string): Task | undefined => {
    const note = state.notes.find((n) => n.id === id);
    if (!note || note.convertedToTaskId) return undefined;

    const now = nowISO();
    const task: Task = {
      id: generateId(),
      projectId: note.projectId,
      name: note.title,
      description: note.body,
      dueDate: note.deadline,
      priority: 'MEDIUM',
      tags: [],
      completed: false,
      createdAt: now,
      updatedAt: now,
      subtasks: [],
    };
    const nextBase = {
      ...state,
      tasks: [...state.tasks, task],
      notes: state.notes.map((n) => (n.id === id ? { ...n, convertedToTaskId: task.id, updatedAt: now } : n)),
    };
    const { state: finalState } = withAchievements(nextBase);
    setState(finalState);
    return task;
  };

  // --- Reminders -----------------------------------------------------------

  const addReminder = (input: NewReminderInput): Reminder => {
    const reminder: Reminder = {
      id: generateId(),
      title: input.title,
      date: input.date,
      time: input.time,
      repeat: input.repeat,
      linkedType: input.linkedType ?? 'custom',
      linkedId: input.linkedId,
      createdAt: nowISO(),
      dismissed: false,
    };
    const { state: finalState } = withAchievements({ ...state, reminders: [...state.reminders, reminder] });
    setState(finalState);
    return reminder;
  };

  const updateReminder = (id: string, patch: Partial<Reminder>): void => {
    setState({ ...state, reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  };

  const deleteReminder = (id: string): void => {
    setState({ ...state, reminders: state.reminders.filter((r) => r.id !== id) });
  };

  const dismissReminder = (id: string): void => updateReminder(id, { dismissed: true });

  // --- Rewards ---------------------------------------------------------------

  const addReward = (input: NewRewardInput): Reward => {
    const reward: Reward = {
      id: generateId(),
      name: input.name,
      description: input.description,
      icon: input.icon,
      cost: input.cost,
      createdAt: nowISO(),
    };
    setState({ ...state, rewards: [...state.rewards, reward] });
    return reward;
  };

  const updateReward = (id: string, patch: Partial<Reward>): void => {
    setState({ ...state, rewards: state.rewards.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  };

  const deleteReward = (id: string): void => {
    setState({ ...state, rewards: state.rewards.filter((r) => r.id !== id) });
  };

  const redeemReward = (id: string): { success: boolean; error?: string } => {
    const reward = state.rewards.find((r) => r.id === id);
    if (!reward) return { success: false, error: 'That reward no longer exists.' };
    const balance = getXpBalance(state);
    if (balance < reward.cost) {
      return { success: false, error: `You need ${reward.cost - balance} more XP to redeem this.` };
    }
    const transaction: RewardTransaction = {
      id: generateId(),
      rewardId: reward.id,
      rewardName: reward.name,
      rewardIcon: reward.icon,
      cost: reward.cost,
      redeemedAt: nowISO(),
    };
    setState({ ...state, rewardTransactions: [...state.rewardTransactions, transaction] });
    playSettingsSound('rewardSound');
    return { success: true };
  };

  // --- Settings & data ---------------------------------------------------

  const updateSettings = (patch: Partial<UserSettings>): void => {
    setState({ ...state, settings: { ...state.settings, ...patch } });
  };

  const exportData = (): void => exportStateAsJson(state);

  const importData = async (file: File): Promise<{ success: boolean; error?: string }> => {
    const result = await readImportFile(file);
    if (!result.success || !result.state) return { success: false, error: result.error };
    const { state: finalState } = withAchievements(result.state);
    setState(finalState);
    return { success: true };
  };

  const loadDemoData = (): void => setState(generateDemoState());

  const resetAllData = (): void => {
    clearStoredState();
    setState(createEmptyState());
  };

  const dismissToast = (): void => setToastEvent(null);

  const value: AppContextValue = {
    state,
    toastEvent,
    dismissToast,
    dataRecovered,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    duplicateProject,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    moveTaskToDate,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addNote,
    updateNote,
    deleteNote,
    convertNoteToTask,
    addReminder,
    updateReminder,
    deleteReminder,
    dismissReminder,
    addReward,
    updateReward,
    deleteReward,
    redeemReward,
    updateSettings,
    exportData,
    importData,
    loadDemoData,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}

