import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Reward } from '../../types';
import { useApp } from '../../store/AppContext';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Primitives';
import { Field, TextInput, Textarea } from '../ui/FormControls';
import { IconPicker } from '../ui/Pickers';

interface RewardFormModalProps {
  open: boolean;
  onClose: () => void;
  reward?: Reward;
}

export function RewardFormModal({ open, onClose, reward }: RewardFormModalProps) {
  const { addReward, updateReward, deleteReward } = useApp();
  const isEditing = Boolean(reward);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [cost, setCost] = useState(100);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (reward) {
      setName(reward.name);
      setDescription(reward.description ?? '');
      setIcon(reward.icon);
      setCost(reward.cost);
    } else {
      setName('');
      setDescription('');
      setIcon('🎁');
      setCost(100);
    }
    setError('');
    setConfirmDelete(false);
  }, [open, reward]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the reward a name.');
      return;
    }
    if (cost <= 0) {
      setError('Cost must be at least 1 XP.');
      return;
    }
    const payload = { name: trimmed, description: description.trim() || undefined, icon, cost };
    if (isEditing && reward) {
      updateReward(reward.id, payload);
    } else {
      addReward(payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!reward) return;
    deleteReward(reward.id);
    setConfirmDelete(false);
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? 'Edit reward' : 'New reward'}
        size="md"
        footer={
          <div className="flex w-full items-center justify-between">
            {isEditing ? (
              <IconButton aria-label="Delete reward" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="text-[var(--danger)]" />
              </IconButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="nx-reward-form">
                {isEditing ? 'Save changes' : 'Create reward'}
              </Button>
            </div>
          </div>
        }
      >
        <form id="nx-reward-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Reward name" required error={error}>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Watch a movie"
              autoFocus
            />
          </Field>
          <Field label="Description" hint="Optional">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          <Field label="Icon">
            <IconPicker value={icon} onChange={setIcon} />
          </Field>
          <Field label="XP cost">
            <TextInput type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
          </Field>
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${reward?.name ?? 'this reward'}"?`}
        confirmLabel="Delete reward"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

