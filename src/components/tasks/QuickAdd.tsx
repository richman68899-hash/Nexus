import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../../types';
import { useApp } from '../../store/AppContext';
import { addDays, fromDateKey, todayKey } from '../../lib/dateUtils';
import { Button } from '../ui/Primitives';
import { TextInput } from '../ui/FormControls';

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function nextWeekday(today: string, targetDay: number): string {
  const currentDay = fromDateKey(today).getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  return addDays(today, diff);
}

function resolveDateKeyword(word: string, today: string): string | undefined {
  if (word === 'today') return today;
  if (word === 'tomorrow') return addDays(today, 1);
  if (word in WEEKDAY_INDEX) return nextWeekday(today, WEEKDAY_INDEX[word]);
  return undefined;
}

interface QuickAddResult {
  name: string;
  dueDate?: string;
  projectId?: string;
  projectName?: string;
}

/**
 * Deliberately simple: only recognizes a trailing date keyword and a
 * project name that already exists, both as plain substring/word matches.
 * No fuzzy matching, no AI — reliability over cleverness, per the brief.
 */
function parseQuickAdd(text: string, projects: Project[], today: string): QuickAddResult {
  const words = text.trim().split(/\s+/);
  let dueDate: string | undefined;

  if (words.length > 1) {
    const lastWord = words[words.length - 1].toLowerCase().replace(/[.,!?]+$/, '');
    const resolved = resolveDateKeyword(lastWord, today);
    if (resolved) {
      dueDate = resolved;
      words.pop();
    }
  }

  const name = words.join(' ').trim() || text.trim();
  const lowerName = name.toLowerCase();
  const matchedProject = projects.find(
    (p) => p.name.trim().length > 0 && lowerName.includes(p.name.toLowerCase())
  );

  return { name, dueDate, projectId: matchedProject?.id, projectName: matchedProject?.name };
}

export function QuickAdd() {
  const { state, addTask } = useApp();
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const parsed = parseQuickAdd(trimmed, state.projects, todayKey());
    addTask({ name: parsed.name, dueDate: parsed.dueDate, projectId: parsed.projectId });
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <TextInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Quick add — try "Draft essay outline tomorrow"'
        aria-label="Quick add a task"
      />
      <Button type="submit" icon={<Plus size={15} />} disabled={!value.trim()}>
        Add
      </Button>
    </form>
  );
}

