import { useMemo, useState } from 'react';
import type { Priority } from '../../types';
import { PRIORITIES } from '../../types';
import { useApp } from '../../store/AppContext';
import { addDays, isOverdue, todayKey } from '../../lib/dateUtils';
import { sortTasks, TaskSortKey } from '../../lib/selectors';
import { EmptyState } from '../ui/Primitives';
import { Select } from '../ui/FormControls';
import { TaskItem } from './TaskItem';
import { QuickAdd } from './QuickAdd';

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function TasksPage() {
  const { state } = useApp();
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<TaskSortKey>('dueDate');
  const [showCompleted, setShowCompleted] = useState(false);

  const today = todayKey();

  function applyFilters(list: typeof state.tasks) {
    let result = list;
    if (projectFilter !== 'ALL') {
      result =
        projectFilter === 'NONE'
          ? result.filter((t) => !t.projectId)
          : result.filter((t) => t.projectId === projectFilter);
    }
    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }

  const filteredIncomplete = useMemo(
    () => applyFilters(state.tasks.filter((t) => !t.completed)),
    [state.tasks, projectFilter, priorityFilter]
  );

  const groups = useMemo(() => {
    const weekEnd = addDays(today, 7);
    const overdue = filteredIncomplete.filter((t) => isOverdue(t.dueDate, today));
    const dueToday = filteredIncomplete.filter((t) => t.dueDate === today);
    const thisWeek = filteredIncomplete.filter((t) => t.dueDate && t.dueDate > today && t.dueDate <= weekEnd);
    const later = filteredIncomplete.filter((t) => t.dueDate && t.dueDate > weekEnd);
    const noDate = filteredIncomplete.filter((t) => !t.dueDate);
    return [
      { label: 'Overdue', tasks: sortTasks(overdue, sortKey), danger: true },
      { label: 'Today', tasks: sortTasks(dueToday, sortKey), danger: false },
      { label: 'This week', tasks: sortTasks(thisWeek, sortKey), danger: false },
      { label: 'Later', tasks: sortTasks(later, sortKey), danger: false },
      { label: 'No date', tasks: sortTasks(noDate, sortKey), danger: false },
    ].filter((g) => g.tasks.length > 0);
  }, [filteredIncomplete, sortKey, today]);

  const completedTasks = useMemo(
    () => sortTasks(applyFilters(state.tasks.filter((t) => t.completed)), 'completedAt', 'desc'),
    [state.tasks, projectFilter, priorityFilter]
  );

  const hasAnyTasks = state.tasks.length > 0;
  const noMatches = groups.length === 0 && completedTasks.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <QuickAdd />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-40"
          aria-label="Filter by project"
        >
          <option value="ALL">All projects</option>
          <option value="NONE">No project</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </Select>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
          className="w-32"
          aria-label="Filter by priority"
        >
          <option value="ALL">All priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {titleCase(p)}
            </option>
          ))}
        </Select>
        <Select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as TaskSortKey)}
          className="w-40"
          aria-label="Sort tasks"
        >
          <option value="dueDate">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
          <option value="createdAt">Sort: Newest</option>
        </Select>
      </div>

      {!hasAnyTasks ? (
        <EmptyState
          icon="✅"
          title="No tasks yet"
          description="Add your first task above, or create one from inside a project."
        />
      ) : noMatches ? (
        <EmptyState icon="🔍" title="No tasks match these filters" description="Try a different project or priority." />
      ) : (
        <div className="space-y-6">
          {groups.length === 0 && (
            <EmptyState icon="🎉" title="Nothing left to do" description="Every matching task is complete. Nice work." />
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <h2
                className={`mb-2 font-display text-sm font-semibold ${
                  group.danger ? 'text-[var(--danger)]' : 'text-[var(--text)]'
                }`}
              >
                {group.label}{' '}
                <span className="font-mono text-xs font-normal text-[var(--text-muted)]">({group.tasks.length})</span>
              </h2>
              <div className="space-y-1.5">
                {group.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}

          {completedTasks.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Completed <span className="font-mono text-xs font-normal">({completedTasks.length})</span>
              </button>
              {showCompleted && (
                <div className="space-y-1.5">
                  {completedTasks.slice(0, 50).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

