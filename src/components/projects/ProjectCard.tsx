import type { Project, Task } from '../../types';
import { getProjectProgress } from '../../lib/selectors';
import { formatRelativeDate, isOverdue, todayKey } from '../../lib/dateUtils';
import { truncate, cn } from '../../lib/utils';
import { Card, PriorityBadge, ProgressBar, StatusBadge } from '../ui/Primitives';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onClick: () => void;
}

export function ProjectCard({ project, tasks, onClick }: ProjectCardProps) {
  const progress = getProjectProgress(project.id, tasks);
  const deadlinePastDue =
    project.deadline && project.status !== 'COMPLETED' ? isOverdue(project.deadline, todayKey()) : false;

  return (
    <Card interactive onClick={onClick} className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-lg"
          style={{ backgroundColor: `${project.color}22` }}
        >
          {project.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-[var(--text)]">{project.name}</p>
          {project.description && (
            <p className="truncate text-xs text-[var(--text-muted)]">{truncate(project.description, 64)}</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-mono">{progress.percent}%</span>
          <span className="font-mono">
            {progress.completed}/{progress.total} tasks
          </span>
        </div>
        <ProgressBar percent={progress.percent} color={project.color} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={project.priority} />
        <StatusBadge status={project.status} />
        {project.deadline && (
          <span className={cn('ml-auto text-xs', deadlinePastDue ? 'text-[var(--danger)]' : 'text-[var(--text-faint)]')}>
            Due {formatRelativeDate(project.deadline)}
          </span>
        )}
      </div>
    </Card>
  );
}

