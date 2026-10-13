import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { SearchResult } from '../../lib/selectors';
import { globalSearch } from '../../lib/selectors';
import { useApp } from '../../store/AppContext';
import { Modal } from '../ui/Modal';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { NoteFormModal } from '../notes/NoteFormModal';
import { RewardFormModal } from '../rewards/RewardFormModal';
import { ProjectDetailModal } from '../projects/ProjectDetailModal';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

type EditTarget =
  | { type: 'task'; id: string }
  | { type: 'note'; id: string }
  | { type: 'reward'; id: string }
  | { type: 'project'; id: string };

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  project: 'Project',
  task: 'Task',
  note: 'Note',
  reward: 'Reward',
};

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const results = useMemo(() => globalSearch(state, query), [state, query]);

  function handleSelect(result: SearchResult) {
    setEditTarget({ type: result.type, id: result.id });
    onClose();
    setQuery('');
  }

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Search" size="md">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, notes, rewards..."
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-raised)] py-2 pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        {query.trim() === '' ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Start typing to search everything.</p>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">No matches for &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left hover:bg-[var(--surface-raised)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[var(--text)]">{result.title}</span>
                  {result.subtitle && (
                    <span className="block truncate text-xs text-[var(--text-muted)]">{result.subtitle}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-[var(--text-faint)]">{TYPE_LABEL[result.type]}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <TaskFormModal
        open={editTarget?.type === 'task'}
        onClose={() => setEditTarget(null)}
        task={editTarget && editTarget.type === 'task' ? state.tasks.find((t) => t.id === editTarget.id) : undefined}
      />
      <NoteFormModal
        open={editTarget?.type === 'note'}
        onClose={() => setEditTarget(null)}
        note={editTarget && editTarget.type === 'note' ? state.notes.find((n) => n.id === editTarget.id) : undefined}
      />
      <RewardFormModal
        open={editTarget?.type === 'reward'}
        onClose={() => setEditTarget(null)}
        reward={
          editTarget && editTarget.type === 'reward' ? state.rewards.find((r) => r.id === editTarget.id) : undefined
        }
      />
      <ProjectDetailModal
        project={
          editTarget && editTarget.type === 'project'
            ? (state.projects.find((p) => p.id === editTarget.id) ?? null)
            : null
        }
        onClose={() => setEditTarget(null)}
      />
    </>
  );
}

