import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Priority, ProjectStatus } from '../../types';
import { PROJECT_STATUSES } from '../../types';
import { useApp } from '../../store/AppContext';
import { Button, EmptyState } from '../ui/Primitives';
import { Select } from '../ui/FormControls';
import { ProjectCard } from './ProjectCard';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectDetailModal } from './ProjectDetailModal';

type SortKey = 'priority' | 'deadline' | 'created' | 'name';

const PRIORITY_RANK: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function ProjectsPage() {
  const { state, loadDemoData } = useApp();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base =
      statusFilter === 'ALL'
        ? state.projects.filter((p) => p.status !== 'ARCHIVED')
        : state.projects.filter((p) => p.status === statusFilter);

    return [...base].sort((a, b) => {
      switch (sortKey) {
        case 'deadline':
          return (a.deadline ?? '9999-99-99').localeCompare(b.deadline ?? '9999-99-99');
        case 'priority':
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case 'created':
          return b.createdAt.localeCompare(a.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [state.projects, statusFilter, sortKey]);

  const selectedProject = selectedProjectId
    ? (state.projects.find((p) => p.id === selectedProjectId) ?? null)
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
            className="w-36"
            aria-label="Filter by status"
          >
            <option value="ALL">All active</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="w-40"
            aria-label="Sort projects"
          >
            <option value="priority">Sort: Priority</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="created">Sort: Newest</option>
            <option value="name">Sort: Name</option>
          </Select>
        </div>
        <Button onClick={() => setFormOpen(true)} icon={<Plus size={15} />}>
          New project
        </Button>
      </div>

      {filtered.length === 0 ? (
        state.projects.length === 0 ? (
          <EmptyState
            icon="🛰️"
            title="No projects yet"
            description="Create your first project to start building your command center."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setFormOpen(true)} icon={<Plus size={15} />}>
                  Create project
                </Button>
                <Button variant="secondary" onClick={loadDemoData}>
                  Load demo data
                </Button>
              </div>
            }
          />
        ) : (
          <EmptyState icon="🔍" title="No projects match this filter" description="Try a different status." />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={state.tasks}
              onClick={() => setSelectedProjectId(project.id)}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(p) => setSelectedProjectId(p.id)}
      />
      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProjectId(null)} />
    </div>
  );
}

