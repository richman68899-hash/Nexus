import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Priority, Project, ProjectStatus } from '../../types';
import { PRIORITIES, PROJECT_STATUSES } from '../../types';
import { useApp } from '../../store/AppContext';
import { PROJECT_COLOR_PRESETS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Primitives';
import { Field, Select, TagInput, TextInput, Textarea } from '../ui/FormControls';
import { ColorPicker, IconPicker } from '../ui/Pickers';

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project;
  onSaved?: (project: Project) => void;
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function ProjectFormModal({ open, onClose, project, onSaved }: ProjectFormModalProps) {
  const { addProject, updateProject } = useApp();
  const isEditing = Boolean(project);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [color, setColor] = useState(PROJECT_COLOR_PRESETS[0]);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setIcon(project.icon);
      setColor(project.color);
      setDeadline(project.deadline ?? '');
      setPriority(project.priority);
      setStatus(project.status);
      setTags(project.tags);
    } else {
      setName('');
      setDescription('');
      setIcon('🚀');
      setColor(PROJECT_COLOR_PRESETS[0]);
      setDeadline('');
      setPriority('MEDIUM');
      setStatus('PLANNING');
      setTags([]);
    }
    setError('');
  }, [open, project]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the project a name.');
      return;
    }

    const payload = {
      name: trimmed,
      description: description.trim(),
      icon,
      color,
      deadline: deadline || undefined,
      priority,
      status,
      tags,
    };

    if (isEditing && project) {
      updateProject(project.id, payload);
      onSaved?.(project);
    } else {
      const created = addProject(payload);
      onSaved?.(created);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit project' : 'New project'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="nx-project-form">
            {isEditing ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="nx-project-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" required error={error}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vocogni"
            autoFocus
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
          />
        </Field>
        <Field label="Icon">
          <IconPicker value={icon} onChange={setIcon} />
        </Field>
        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} presets={PROJECT_COLOR_PRESETS} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Deadline" hint="Optional">
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Tags">
          <TagInput value={tags} onChange={setTags} placeholder="Press Enter to add a tag" />
        </Field>
      </form>
    </Modal>
  );
}

