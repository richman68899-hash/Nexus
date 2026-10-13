import type {
  AppState,
  Milestone,
  Note,
  Priority,
  Project,
  Reminder,
  Reward,
  RewardTransaction,
  Subtask,
  Task,
} from '../types';
import { generateId } from './utils';
import { addDays, nowISO, todayKey } from './dateUtils';
import { createEmptyState } from './persistence';
import { getXpForTask } from './xpEngine';
import { checkAchievements } from './achievementEngine';

function makeMilestone(title: string, extra: Partial<Milestone> = {}): Milestone {
  return { id: generateId(), title, completed: false, ...extra };
}

function makeSubtask(title: string, completed = false): Subtask {
  return { id: generateId(), title, completed };
}

interface TaskSeed {
  name: string;
  dueOffset?: number; // days from today
  priority?: Priority;
  completedOffset?: number; // days ago; presence marks the task completed
  subtasks?: Array<[string, boolean]>;
  tags?: string[];
}

function buildTasks(
  projectId: string,
  seeds: TaskSeed[],
  xpValues: { normal: number; important: number },
  today: string
): Task[] {
  const now = nowISO();
  return seeds.map((seed) => {
    const priority = seed.priority ?? 'MEDIUM';
    const completed = seed.completedOffset !== undefined;
    const completedAt = completed
      ? new Date(Date.now() - (seed.completedOffset as number) * 86400000).toISOString()
      : undefined;
    return {
      id: generateId(),
      projectId,
      name: seed.name,
      dueDate: seed.dueOffset !== undefined ? addDays(today, seed.dueOffset) : undefined,
      priority,
      tags: seed.tags ?? [],
      completed,
      completedAt,
      xpAwarded: completed ? getXpForTask(priority, xpValues) : undefined,
      createdAt: now,
      updatedAt: now,
      subtasks: (seed.subtasks ?? []).map(([title, done]) => makeSubtask(title, done)),
    };
  });
}

export function generateDemoState(): AppState {
  const base = createEmptyState();
  const today = todayKey();
  const now = nowISO();
  const xpValues = base.settings.xpValues;

  // --- Vocogni -------------------------------------------------------------
  const vocogniId = generateId();
  const vocogniTasks = buildTasks(
    vocogniId,
    [
      { name: 'Design landing page', completedOffset: 6 },
      { name: 'Build authentication', priority: 'HIGH', completedOffset: 4 },
      {
        name: 'Create dashboard',
        dueOffset: 2,
        priority: 'HIGH',
        subtasks: [
          ['Create navbar', true],
          ['Create project cards', true],
          ['Create progress chart', false],
          ['Test mobile layout', false],
        ],
      },
      { name: 'Build task system', dueOffset: 6, priority: 'HIGH' },
      { name: 'Test with students', dueOffset: 14 },
      { name: 'Launch prototype', dueOffset: 30, priority: 'URGENT' },
    ],
    xpValues,
    today
  );
  const vocogni: Project = {
    id: vocogniId,
    name: 'Vocogni',
    description: 'Build and launch the first working prototype.',
    icon: '🚀',
    color: '#22D3EE',
    createdAt: now,
    updatedAt: now,
    deadline: addDays(today, 45),
    priority: 'HIGH',
    status: 'ACTIVE',
    tags: ['startup', 'build'],
    notes: 'Focus on a working demo over polish for the first milestone.',
    milestones: [
      makeMilestone('MVP feature-complete', { targetDate: addDays(today, 10) }),
      makeMilestone('First 10 test users', { targetDate: addDays(today, 20) }),
    ],
  };

  // --- Chess Club ------------------------------------------------------------
  const chessId = generateId();
  const chessTasks = buildTasks(
    chessId,
    [
      { name: 'Order new chess sets', completedOffset: 5 },
      { name: 'Update club constitution', completedOffset: 3 },
      { name: 'Plan weekly meeting schedule', dueOffset: 1 },
      { name: 'Recruit new members', dueOffset: 5, tags: ['outreach'] },
      { name: 'Design tournament poster', dueOffset: -2, priority: 'LOW' },
      { name: 'Organize year-end tournament', dueOffset: 18 },
    ],
    xpValues,
    today
  );
  const chessClub: Project = {
    id: chessId,
    name: 'Chess Club',
    description: 'Grow and run the school chess club this term.',
    icon: '♟️',
    color: '#A78BFA',
    createdAt: now,
    updatedAt: now,
    deadline: addDays(today, 20),
    priority: 'MEDIUM',
    status: 'ACTIVE',
    tags: ['leadership'],
    notes: '',
    milestones: [
      makeMilestone('20 active members'),
      makeMilestone('First tournament held', { targetDate: addDays(today, 18) }),
    ],
  };

  // --- Scholarship Portfolio ---------------------------------------------
  const scholarshipId = generateId();
  const scholarshipTasks = buildTasks(
    scholarshipId,
    [
      { name: 'Draft personal statement', completedOffset: 6 },
      { name: 'Request recommendation letters', completedOffset: 5 },
      {
        name: 'Compile project showcase',
        dueOffset: 3,
        priority: 'HIGH',
        subtasks: [
          ['Pick 3 best projects', false],
          ['Write short summaries', false],
          ['Add screenshots', false],
        ],
      },
      { name: 'Proofread full application', dueOffset: 10 },
      { name: 'Prepare for interview', dueOffset: 20 },
      { name: 'Submit application', dueOffset: 25, priority: 'URGENT' },
    ],
    xpValues,
    today
  );
  const scholarshipMilestone = makeMilestone('First draft complete', {
    completed: true,
    completedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    xpAwarded: xpValues.milestone,
  });
  const scholarshipDeadline = addDays(today, 25);
  const scholarship: Project = {
    id: scholarshipId,
    name: 'Scholarship Portfolio',
    description: 'Pull every project and story together into one application.',
    icon: '🎓',
    color: '#60A5FA',
    createdAt: now,
    updatedAt: now,
    deadline: scholarshipDeadline,
    priority: 'URGENT',
    status: 'ACTIVE',
    tags: ['application'],
    notes: 'Lead with Vocogni and the chess club leadership angle.',
    milestones: [scholarshipMilestone, makeMilestone('Application submitted', { targetDate: addDays(today, 25) })],
  };

  // --- Olympiad Preparation --------------------------------------------------
  const olympiadId = generateId();
  const olympiadTasks = buildTasks(
    olympiadId,
    [
      { name: 'Review algebra problem sets', completedOffset: 4 },
      { name: 'Attend weekend prep session', completedOffset: 2 },
      { name: 'Practice past papers — set 1', dueOffset: 4 },
      { name: 'Take timed mock exam', dueOffset: 12, priority: 'HIGH' },
      { name: 'Review mock exam mistakes', dueOffset: 13 },
      { name: 'Register for regional round', dueOffset: -1, priority: 'URGENT' },
    ],
    xpValues,
    today
  );
  const olympiad: Project = {
    id: olympiadId,
    name: 'Olympiad Preparation',
    description: 'Train consistently for the regional math olympiad.',
    icon: '🧠',
    color: '#34D399',
    createdAt: now,
    updatedAt: now,
    deadline: addDays(today, 35),
    priority: 'HIGH',
    status: 'ACTIVE',
    tags: ['study'],
    notes: '',
    milestones: [makeMilestone('Mock score above 80%', { targetDate: addDays(today, 12) })],
  };

  // --- Personal Development -----------------------------------------------
  const personalId = generateId();
  const personalTasks = buildTasks(
    personalId,
    [
      { name: 'Finish current book', completedOffset: 1 },
      { name: 'Keep the typing-practice streak alive', completedOffset: 1 },
      { name: 'Morning routine — day 1', dueOffset: 0, priority: 'LOW' },
      { name: 'Journal three times this week', dueOffset: 2, priority: 'LOW' },
      { name: 'Try a new workout class', dueOffset: 6, priority: 'LOW' },
      { name: 'Declutter desk and workspace', dueOffset: -3, priority: 'LOW' },
    ],
    xpValues,
    today
  );
  const personalDev: Project = {
    id: personalId,
    name: 'Personal Development',
    description: 'Small, steady habits alongside the bigger projects.',
    icon: '🌱',
    color: '#F472B6',
    createdAt: now,
    updatedAt: now,
    priority: 'LOW',
    status: 'ACTIVE',
    tags: ['habits'],
    notes: '',
    milestones: [makeMilestone('Read 12 books this year')],
  };

  const projects = [vocogni, chessClub, scholarship, olympiad, personalDev];
  const tasks = [...vocogniTasks, ...chessTasks, ...scholarshipTasks, ...olympiadTasks, ...personalTasks];

  // --- Notes -----------------------------------------------------------------
  const notes: Note[] = [
    {
      id: generateId(),
      title: 'Research competing productivity apps',
      body: 'Look at what Todoist, Habitica and ColorNote each do well before finalizing the Vocogni feature list.',
      date: today,
      createdAt: now,
      updatedAt: now,
      projectId: vocogniId,
      tags: ['research'],
    },
    {
      id: generateId(),
      title: 'Ask about the scholarship interview format',
      body: 'Is it a panel or one-on-one? How long? Confirm before prepping answers.',
      date: today,
      createdAt: now,
      updatedAt: now,
      projectId: scholarshipId,
      tags: [],
      deadline: addDays(today, 8),
    },
    {
      id: generateId(),
      title: 'Tournament prize ideas',
      body: 'Trophy for 1st, chess books for 2nd/3rd, pizza for everyone after.',
      date: today,
      createdAt: now,
      updatedAt: now,
      projectId: chessId,
      tags: [],
    },
    {
      id: generateId(),
      title: 'Book recommendation from Sarah',
      body: '"Atomic Habits" — she said the chapter on identity-based habits is worth rereading.',
      date: addDays(today, -2),
      createdAt: now,
      updatedAt: now,
      tags: ['reading'],
    },
  ];

  // --- Reminders ---------------------------------------------------------
  const reminders: Reminder[] = [
    {
      id: generateId(),
      title: 'Submit scholarship application',
      date: scholarshipDeadline,
      time: '09:00',
      linkedType: 'project',
      linkedId: scholarshipId,
      createdAt: now,
      dismissed: false,
    },
    {
      id: generateId(),
      title: 'Weekly chess club meeting',
      date: today,
      time: '16:00',
      repeat: { frequency: 'weekly', interval: 1 },
      linkedType: 'project',
      linkedId: chessId,
      createdAt: now,
      dismissed: false,
    },
    {
      id: generateId(),
      title: 'Stretch and take a break',
      date: today,
      time: '18:00',
      linkedType: 'custom',
      createdAt: now,
      dismissed: false,
    },
  ];

  // --- Reward shop + achievements ----------------------------------------
  const rewards: Reward[] = [
    { id: generateId(), name: 'Watch a movie', icon: '🎬', cost: 100, createdAt: now },
    { id: generateId(), name: 'Play games for 30 minutes', icon: '🎮', cost: 150, createdAt: now },
    { id: generateId(), name: 'Buy a small snack', icon: '🍪', cost: 300, createdAt: now },
    { id: generateId(), name: 'Take a completely free evening', icon: '🌙', cost: 500, createdAt: now },
  ];

  const rewardTransactions: RewardTransaction[] = [
    {
      id: generateId(),
      rewardId: rewards[0].id,
      rewardName: rewards[0].name,
      rewardIcon: rewards[0].icon,
      cost: rewards[0].cost,
      redeemedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const preliminary: AppState = {
    ...base,
    projects,
    tasks,
    notes,
    reminders,
    rewards,
    rewardTransactions,
  };

  const { achievements } = checkAchievements(preliminary);

  return { ...preliminary, achievements };
}

