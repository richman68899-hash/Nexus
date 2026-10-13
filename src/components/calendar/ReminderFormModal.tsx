import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { RecurrenceFrequency, Reminder } from '../../types';
import { useApp } from '../../store/AppContext';
import { todayKey } from '../../lib/dateUtils';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Primitives';
import { Field, Select, TextInput } from '../ui/FormControls';

interface ReminderFormModalProps {
  open: boolean;
  onClose: () => void;
  reminder?: Reminder;
  defaultDate?: string;
}

export function ReminderFormModal({ open, onClose, reminder, defaultDate }: ReminderFormModalProps) {
  const { addReminder, updateReminder, deleteReminder } = useApp();
  const isEditing = Boolean(reminder);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [repeatFrequency, setRepeatFrequency] = useState<RecurrenceFrequency | 'none'>('none');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (reminder) {
      setTitle(reminder.title);
      setDate(reminder.date);
      setTime(reminder.time ?? '');
      setRepeatFrequency(reminder.repeat?.frequency ?? 'none');
    } else {
      setTitle('');
      setDate(defaultDate ?? todayKey());
      setTime('');
      setRepeatFrequency('none');
    }
    setError('');
    setConfirmDelete(false);
  }, [open, reminder, defaultDate]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give the reminder a title.');
      return;
    }
    if (!date) {
      setError('Pick a date.');
      return;
    }
    const repeat = repeatFrequency === 'none' ? undefined : { frequency: repeatFrequency, interval: 1 };

    if (isEditing && reminder) {
      updateReminder(reminder.id, { title: trimmed, date, time: time || undefined, repeat });
    } else {
      addReminder({ title: trimmed, date, time: time || undefined, repeat, linkedType: 'custom' });
    }
    onClose();
  }

  function handleDelete() {
    if (!reminder) return;
    deleteReminder(reminder.id);
    setConfirmDelete(false);
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? 'Edit reminder' : 'New reminder'}
        size="sm"
        footer={
          <div className="flex w-full items-center justify-between">
            {isEditing ? (
              <IconButton aria-label="Delete reminder" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="text-[var(--danger)]" />
              </IconButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="nx-reminder-form">
                {isEditing ? 'Save changes' : 'Create reminder'}
              </Button>
            </div>
          </div>
        }
      >
        <form id="nx-reminder-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" required error={error}>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should we remind you about?"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Time" hint="Optional">
              <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Field label="Repeats">
            <Select
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value as RecurrenceFrequency | 'none')}
            >
              <option value="none">Doesn&rsquo;t repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </Field>
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this reminder?"
        confirmLabel="Delete reminder"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

