import { useEffect, useState } from 'react';
import { Archive, Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Project } from '../../types';
import { useApp } from '../../store/AppContext';
import { getMilestoneProgress, getProjectProgress, getProjectTasks } from '../../lib/selectors';
import { formatFullDate } from '../../lib/dateUtils';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Button, EmptyState, IconButton, PriorityBadge, ProgressBar, StatusBadge } from '../ui/Primitives';
import { Checkbox, TextInput, Textarea } from '../ui/FormControls';
import { TaskItem } from '../tasks/TaskItem';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { ProjectFormModal } from './ProjectFormModal';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const {
    state,
    deleteProject,
    archiveProject,
    duplicateProject,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    updateProject,
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    setNotesDraft(project?.notes ?? '');
  }, [project?.id, project?.notes]);

  const current = project ? state.projects.find((p) => p.id === project.id) : undefined;

  if (!project || !current) return null;

  const tasks = getProjectTasks(current.id, state.tasks);
  const progress = getProjectProgress(current.id, state.tasks);
  const milestoneProgress = getMilestoneProgress(current);

  function handleAddMilestone() {
    if (!milestoneDraft.trim()) return;
    addMilestone(current.id, milestoneDraft.trim());
    setMilestoneDraft('');
  }

  function handleDelete() {
    deleteProject(current.id);
    setConfirmDelete(false);
    onClose();
  }

  return (
    <>
      <Modal
        open={Boolean(project)}
        onClose={onClose}
        title={`${current.icon} ${current.name}`}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <IconButton aria-label="Edit project" onClick={() => setEditOpen(true)}>
                <Pencil size={16} />
              </IconButton>
              <IconButton aria-label="Duplicate project" onClick={() => duplicateProject(current.id)}>
                <Copy size={16} />
              </IconButton>
              {current.status !== 'ARCHIVED' && (
                <IconButton aria-label="Archive project" onClick={() => archiveProject(current.id)}>
                  <Archive size={16} />
                </IconButton>
              )}
              <IconButton aria-label="Delete project" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="text-[var(--danger)]" />
              </IconButton>
            </div>
            <Button onClick={onClose}>Done</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            {current.description && <p className="text-sm text-[var(--text-muted)]">{current.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={current.priority} />
              <StatusBadge status={current.status} />
              {current.deadline && (
                <span className="text-xs text-[var(--text-faint)]">Due {formatFullDate(current.deadline)}</span>
              )}
              {current.tags.map((tag) => (
                <span key={tag} className="text-xs text-[var(--text-faint)]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Progress</span>
              <span className="font-mono">
                {progress.completed}/{progress.total} tasks &middot; {progress.percent}%
              </span>
            </div>
            <ProgressBar percent={progress.percent} color={current.color} height={8} />
          </div>

          <section>
            <h3 className="mb-2 font-display text-sm font-semibold text-[var(--text)]">
              Milestones
              {current.milestones.length > 0 && (
                <span className="ml-1.5 font-mono text-xs font-normal text-[var(--text-muted)]">
                  {milestoneProgress.completed}/{milestoneProgress.total}
                </span>
              )}
            </h3>
            <div className="space-y-1.5">
              {current.milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-2"
                >
                  <Checkbox
                    checked={m.completed}
                    onChange={() => toggleMilestone(current.id, m.id)}
                    label={
                      <span className={m.completed ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'}>
                        {m.title}
                      </span>
                    }
                  />
                  <button
                    onClick={() => deleteMilestone(current.id, m.id)}
                    aria-label={`Delete milestone ${m.title}`}
                    className="text-[var(--text-faint)] hover:text-[var(--danger)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TextInput
                value={milestoneDraft}
                onChange={(e) => setMilestoneDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                placeholder="Add a milestone"
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddMilestone} icon={<Plus size={14} />}>
                Add
              </Button>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[var(--text)]">Tasks</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTaskFormOpen(true)}
                icon={<Plus size={14} />}
              >
                Add task
              </Button>
            </div>
            {tasks.length === 0 ? (
              <EmptyState title="No tasks yet" description="Break this project down into a first task." />
            ) : (
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} showProject={false} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-display text-sm font-semibold text-[var(--text)]">Notes</h3>
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => updateProject(current.id, { notes: notesDraft })}
              placeholder="Quick scratchpad for this project..."
              rows={4}
            />
          </section>
        </div>
      </Modal>

      <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={current} />
      <TaskFormModal open={taskFormOpen} onClose={() => setTaskFormOpen(false)} defaultProjectId={current.id} />
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${current.name}"?`}
        description="This removes the project and every task inside it."
        confirmLabel="Delete project"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

