import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Note } from '../../types';
import { useApp } from '../../store/AppContext';
import { formatRelativeDate } from '../../lib/dateUtils';
import { Button, Card, EmptyState } from '../ui/Primitives';
import { Select } from '../ui/FormControls';
import { NoteFormModal } from './NoteFormModal';

export function NotesPage() {
  const { state } = useApp();
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);

  const filtered = useMemo(() => {
    const base =
      projectFilter === 'ALL'
        ? state.notes
        : projectFilter === 'NONE'
          ? state.notes.filter((n) => !n.projectId)
          : state.notes.filter((n) => n.projectId === projectFilter);
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.notes, projectFilter]);

  function openNew() {
    setEditingNote(undefined);
    setFormOpen(true);
  }

  function openEdit(note: Note) {
    setEditingNote(note);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-40"
          aria-label="Filter by project"
        >
          <option value="ALL">All notes</option>
          <option value="NONE">No project</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </Select>
        <Button onClick={openNew} icon={<Plus size={15} />}>
          New note
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🗒️"
          title={state.notes.length === 0 ? 'No notes yet' : 'No notes match this filter'}
          description={
            state.notes.length === 0
              ? 'Jot something down — research, ideas, things to test.'
              : 'Try a different project.'
          }
          action={
            state.notes.length === 0 ? (
              <Button onClick={openNew} icon={<Plus size={15} />}>
                Create note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => {
            const project = note.projectId ? state.projects.find((p) => p.id === note.projectId) : undefined;
            return (
              <Card key={note.id} interactive onClick={() => openEdit(note)} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-[var(--text)]">{note.title}</p>
                  <span className="shrink-0 text-xs text-[var(--text-faint)]">{formatRelativeDate(note.date)}</span>
                </div>
                {note.body && <p className="line-clamp-3 text-sm text-[var(--text-muted)]">{note.body}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                  {project && (
                    <span className="text-xs text-[var(--text-faint)]">
                      {project.icon} {project.name}
                    </span>
                  )}
                  {note.tags.map((tag) => (
                    <span key={tag} className="text-xs text-[var(--text-faint)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <NoteFormModal open={formOpen} onClose={() => setFormOpen(false)} note={editingNote} />
    </div>
  );
}

