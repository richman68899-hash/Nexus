import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { Task } from '../../types';
import { useApp } from '../../store/AppContext';
import { formatRelativeDate, isOverdue, todayKey } from '../../lib/dateUtils';
import { cn } from '../../lib/utils';
import { PriorityBadge } from '../ui/Primitives';
import { TaskFormModal } from './TaskFormModal';

interface TaskItemProps {
  task: Task;
  showProject?: boolean;
}

export function TaskItem({ task, showProject = true }: TaskItemProps) {
  const { state, completeTask, uncompleteTask } = useApp();
  const [editOpen, setEditOpen] = useState(false);

  const project = task.projectId ? state.projects.find((p) => p.id === task.projectId) : undefined;
  const overdue = !task.completed && isOverdue(task.dueDate, todayKey());
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;
  const animationsEnabled = state.settings.animationsEnabled;

  function handleToggle(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (task.completed) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id);
    }
  }

  return (
    <>
      <div
        onClick={() => setEditOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setEditOpen(true);
          }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 transition-colors hover:border-[var(--border-strong)]"
      >
        <button
          onClick={handleToggle}
          aria-label={task.completed ? `Mark "${task.name}" as not done` : `Mark "${task.name}" as done`}
          aria-pressed={task.completed}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            task.completed
              ? 'border-[var(--accent)] bg-[var(--accent)]'
              : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
          )}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
            {task.completed && (
              <path
                d="M4 12.5L9.5 18L20 6"
                stroke="#05070d"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animationsEnabled ? 'nx-check-path' : undefined}
              />
            )}
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm',
              task.completed ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'
            )}
          >
            {task.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
            {showProject && project && (
              <span className="inline-flex items-center gap-1">
                <span>{project.icon}</span>
                {project.name}
              </span>
            )}
            {task.dueDate && (
              <span className={overdue ? 'font-medium text-[var(--danger)]' : undefined}>
                {formatRelativeDate(task.dueDate)}
              </span>
            )}
            {subtaskTotal > 0 && (
              <span>
                {subtaskDone}/{subtaskTotal} subtasks
              </span>
            )}
          </div>
        </div>

        <PriorityBadge priority={task.priority} className="hidden shrink-0 sm:inline-flex" />
      </div>

      <TaskFormModal open={editOpen} onClose={() => setEditOpen(false)} task={task} />
    </>
  );
}

