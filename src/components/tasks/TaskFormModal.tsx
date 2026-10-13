import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Priority, RecurrenceFrequency, Task } from '../../types';
import { PRIORITIES } from '../../types';
import { useApp } from '../../store/AppContext';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Primitives';
import { Checkbox, Field, Select, TagInput, TextInput, Textarea } from '../ui/FormControls';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultProjectId?: string;
  defaultDueDate?: string;
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function TaskFormModal({ open, onClose, task, defaultProjectId, defaultDueDate }: TaskFormModalProps) {
  const { state, addTask, updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useApp();
  const isEditing = Boolean(task);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency | 'none'>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setName(task.name);
      setDescription(task.description ?? '');
      setProjectId(task.projectId ?? '');
      setDueDate(task.dueDate ?? '');
      setPriority(task.priority);
      setTags(task.tags);
      setNotes(task.notes ?? '');
      setRecurrenceFrequency(task.recurrence?.frequency ?? 'none');
      setRecurrenceInterval(task.recurrence?.interval ?? 1);
    } else {
      setName('');
      setDescription('');
      setProjectId(defaultProjectId ?? '');
      setDueDate(defaultDueDate ?? '');
      setPriority('MEDIUM');
      setTags([]);
      setNotes('');
      setRecurrenceFrequency('none');
      setRecurrenceInterval(1);
    }
    setSubtaskDraft('');
    setError('');
    setConfirmDelete(false);
  }, [open, task, defaultProjectId, defaultDueDate]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the task a name.');
      return;
    }

    const recurrence =
      recurrenceFrequency === 'none'
        ? undefined
        : { frequency: recurrenceFrequency, interval: Math.max(1, recurrenceInterval) };

    const payload = {
      name: trimmed,
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      dueDate: dueDate || undefined,
      priority,
      tags,
      notes: notes.trim() || undefined,
      recurrence,
    };

    if (isEditing && task) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  }

  function handleAddSubtask() {
    if (!task || !subtaskDraft.trim()) return;
    addSubtask(task.id, subtaskDraft.trim());
    setSubtaskDraft('');
  }

  function handleDelete() {
    if (!task) return;
    deleteTask(task.id);
    setConfirmDelete(false);
    onClose();
  }

  const selectableProjects = state.projects.filter((p) => p.status !== 'ARCHIVED');

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? 'Edit task' : 'New task'}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            {isEditing ? (
              <IconButton aria-label="Delete task" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="text-[var(--danger)]" />
              </IconButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="nx-task-form">
                {isEditing ? 'Save changes' : 'Create task'}
              </Button>
            </div>
          </div>
        }
      >
        <form id="nx-task-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Task name" required error={error}>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {selectableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {titleCase(p)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Due date" hint="Optional">
            <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>

          <Field label="Tags">
            <TagInput value={tags} onChange={setTags} placeholder="Press Enter to add a tag" />
          </Field>

          <Field label="Repeats">
            <div className="flex gap-2">
              <Select
                value={recurrenceFrequency}
                onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency | 'none')}
                className="flex-1"
              >
                <option value="none">Doesn&rsquo;t repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
              {recurrenceFrequency !== 'none' && (
                <TextInput
                  type="number"
                  min={1}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Number(e.target.value) || 1)}
                  className="w-20"
                  aria-label="Repeat interval"
                />
              )}
            </div>
          </Field>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </Field>

          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else to remember"
              rows={2}
            />
          </Field>

          {isEditing && task && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-[var(--text)]">Subtasks</span>
              <div className="space-y-1.5">
                {task.subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-1.5"
                  >
                    <Checkbox
                      checked={s.completed}
                      onChange={() => toggleSubtask(task.id, s.id)}
                      label={
                        <span className={s.completed ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'}>
                          {s.title}
                        </span>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => deleteSubtask(task.id, s.id)}
                      aria-label={`Remove subtask ${s.title}`}
                      className="text-[var(--text-faint)] hover:text-[var(--danger)]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <TextInput
                  value={subtaskDraft}
                  onChange={(e) => setSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask"
                  className="flex-1"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSubtask} icon={<Plus size={14} />}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${task?.name ?? 'this task'}"?`}
        confirmLabel="Delete task"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

