import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ListChecks, Trash2 } from 'lucide-react';
import type { Note } from '../../types';
import { useApp } from '../../store/AppContext';
import { todayKey } from '../../lib/dateUtils';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Badge, Button, IconButton } from '../ui/Primitives';
import { Field, Select, TagInput, TextInput, Textarea } from '../ui/FormControls';

interface NoteFormModalProps {
  open: boolean;
  onClose: () => void;
  note?: Note;
  defaultProjectId?: string;
}

export function NoteFormModal({ open, onClose, note, defaultProjectId }: NoteFormModalProps) {
  const { state, addNote, updateNote, deleteNote, convertNoteToTask } = useApp();
  const isEditing = Boolean(note);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setDate(note.date);
      setProjectId(note.projectId ?? '');
      setTags(note.tags);
      setDeadline(note.deadline ?? '');
    } else {
      setTitle('');
      setBody('');
      setDate(todayKey());
      setProjectId(defaultProjectId ?? '');
      setTags([]);
      setDeadline('');
    }
    setError('');
    setConfirmDelete(false);
  }, [open, note, defaultProjectId]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Give the note a title.');
      return;
    }
    const payload = {
      title: trimmedTitle,
      body,
      date,
      projectId: projectId || undefined,
      tags,
      deadline: deadline || undefined,
    };
    if (isEditing && note) {
      updateNote(note.id, payload);
    } else {
      addNote(payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!note) return;
    deleteNote(note.id);
    setConfirmDelete(false);
    onClose();
  }

  function handleConvert() {
    if (!note) return;
    convertNoteToTask(note.id);
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? 'Edit note' : 'New note'}
        size="md"
        footer={
          <div className="flex w-full items-center justify-between">
            {isEditing ? (
              <IconButton aria-label="Delete note" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="text-[var(--danger)]" />
              </IconButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="nx-note-form">
                {isEditing ? 'Save changes' : 'Create note'}
              </Button>
            </div>
          </div>
        }
      >
        <form id="nx-note-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" required error={error}>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" autoFocus />
          </Field>
          <Field label="Body">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write it down..." rows={5} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Project" hint="Optional">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Reminder / deadline" hint="Optional">
            <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Tags">
            <TagInput value={tags} onChange={setTags} placeholder="Press Enter to add a tag" />
          </Field>

          {isEditing && note && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3">
              {note.convertedToTaskId ? (
                <Badge tone="success">Converted to a task</Badge>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleConvert}
                  icon={<ListChecks size={14} />}
                >
                  Convert to task
                </Button>
              )}
            </div>
          )}
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${note?.title ?? 'this note'}"?`}
        confirmLabel="Delete note"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

