import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarItem, CalendarItemType } from '../../lib/selectors';
import { getCalendarItemsForDate } from '../../lib/selectors';
import { useApp } from '../../store/AppContext';
import {
  addDays,
  addMonths,
  formatFullDate,
  formatTime,
  fromDateKey,
  getMonthMatrix,
  getWeekDays,
  monthLong,
  todayKey,
  weekdayShort,
} from '../../lib/dateUtils';
import { cn } from '../../lib/utils';
import { Button, EmptyState, IconButton } from '../ui/Primitives';
import { Modal } from '../ui/Modal';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { ReminderFormModal } from './ReminderFormModal';
import { NoteFormModal } from '../notes/NoteFormModal';
import { ProjectDetailModal } from '../projects/ProjectDetailModal';

type CalendarViewMode = 'month' | 'week' | 'day';

type EditTarget =
  | { type: 'task'; id: string }
  | { type: 'reminder'; id: string }
  | { type: 'note'; id: string }
  | { type: 'project'; id: string };

const ITEM_TYPE_META: Record<CalendarItemType, { label: string; color: string }> = {
  task: { label: 'Task', color: 'var(--accent)' },
  deadline: { label: 'Deadline', color: 'var(--danger)' },
  milestone: { label: 'Milestone', color: 'var(--warning)' },
  reminder: { label: 'Reminder', color: '#a78bfa' },
  note: { label: 'Note', color: 'var(--text-faint)' },
};

function ItemRow({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  const meta = ITEM_TYPE_META[item.type];
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left transition-colors hover:border-[var(--border-strong)]"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color ?? meta.color }} />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          item.completed ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'
        )}
      >
        {item.title}
      </span>
      {item.time && (
        <span className="shrink-0 font-mono text-xs text-[var(--text-muted)]">{formatTime(item.time)}</span>
      )}
      <span className="hidden shrink-0 text-xs text-[var(--text-faint)] sm:inline">{meta.label}</span>
    </button>
  );
}

function MonthGrid({
  year,
  month,
  onSelectDay,
}: {
  year: number;
  month: number;
  onSelectDay: (date: string) => void;
}) {
  const { state } = useApp();
  const weeks = getMonthMatrix(year, month);

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day) => {
          const items = getCalendarItemsForDate(state, day.key);
          return (
            <button
              key={day.key}
              onClick={() => onSelectDay(day.key)}
              className={cn(
                'flex aspect-square flex-col items-center justify-start gap-1 rounded-[var(--radius-md)] py-1.5 text-xs transition-colors',
                !day.inCurrentMonth && 'opacity-30',
                day.isToday
                  ? 'bg-[rgba(var(--accent-rgb),0.12)] font-semibold text-[var(--accent)]'
                  : 'text-[var(--text)] hover:bg-[var(--surface-raised)]'
              )}
            >
              <span>{day.date.getDate()}</span>
              {items.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: item.color ?? ITEM_TYPE_META[item.type].color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekAgenda({
  cursorDate,
  onItemClick,
  onAddForDay,
}: {
  cursorDate: string;
  onItemClick: (item: CalendarItem) => void;
  onAddForDay: (date: string) => void;
}) {
  const { state } = useApp();
  const days = getWeekDays(cursorDate);

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const items = getCalendarItemsForDate(state, day.key);
        return (
          <div key={day.key}>
            <div className="mb-1.5 flex items-center justify-between">
              <h3
                className={cn(
                  'font-display text-sm font-semibold',
                  day.isToday ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                )}
              >
                {weekdayShort(day.date)}{' '}
                <span className="font-mono text-xs font-normal text-[var(--text-muted)]">{day.date.getDate()}</span>
              </h3>
              <button
                onClick={() => onAddForDay(day.key)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
              >
                + Add
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-[var(--text-faint)]">Nothing scheduled</p>
            ) : (
              <div className="space-y-1.5">
                {items.map((item) => (
                  <ItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({
  date,
  onItemClick,
  onAdd,
}: {
  date: string;
  onItemClick: (item: CalendarItem) => void;
  onAdd: () => void;
}) {
  const { state } = useApp();
  const items = getCalendarItemsForDate(state, date);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onAdd} icon={<Plus size={14} />}>
          Add for this day
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="📅" title="Nothing scheduled" description="Add a task or reminder for this day." />
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayPanelBody({
  date,
  onItemClick,
  onAddTask,
  onAddReminder,
}: {
  date: string;
  onItemClick: (item: CalendarItem) => void;
  onAddTask: () => void;
  onAddReminder: () => void;
}) {
  const { state } = useApp();
  const items = getCalendarItemsForDate(state, date);

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState icon="📅" title="Nothing scheduled" description="Add a task or reminder for this day." />
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onAddTask} icon={<Plus size={14} />}>
          Task
        </Button>
        <Button variant="secondary" size="sm" onClick={onAddReminder} icon={<Plus size={14} />}>
          Reminder
        </Button>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { state } = useApp();
  const [view, setView] = useState<CalendarViewMode>('month');
  const [cursorDate, setCursorDate] = useState(todayKey());
  const [panelDate, setPanelDate] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickReminderOpen, setQuickReminderOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState(todayKey());

  const today = todayKey();
  const cursor = fromDateKey(cursorDate);

  function goPrev() {
    if (view === 'month') setCursorDate(addMonths(cursorDate, -1));
    else if (view === 'week') setCursorDate(addDays(cursorDate, -7));
    else setCursorDate(addDays(cursorDate, -1));
  }
  function goNext() {
    if (view === 'month') setCursorDate(addMonths(cursorDate, 1));
    else if (view === 'week') setCursorDate(addDays(cursorDate, 7));
    else setCursorDate(addDays(cursorDate, 1));
  }
  function goToday() {
    setCursorDate(today);
  }

  function handleItemClick(item: CalendarItem) {
    setPanelDate(null);
    if (item.type === 'task') setEditTarget({ type: 'task', id: item.refId });
    else if (item.type === 'reminder') setEditTarget({ type: 'reminder', id: item.refId });
    else if (item.type === 'note') setEditTarget({ type: 'note', id: item.refId });
    else setEditTarget({ type: 'project', id: item.refId });
  }

  function openQuickTask(date: string) {
    setQuickAddDate(date);
    setPanelDate(null);
    setQuickTaskOpen(true);
  }
  function openQuickReminder(date: string) {
    setQuickAddDate(date);
    setPanelDate(null);
    setQuickReminderOpen(true);
  }

  const periodLabel =
    view === 'month'
      ? `${monthLong(cursor)} ${cursor.getFullYear()}`
      : view === 'week'
        ? `Week of ${formatFullDate(getWeekDays(cursorDate)[0].key)}`
        : formatFullDate(cursorDate);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton aria-label="Previous period" onClick={goPrev}>
            <ChevronLeft size={18} />
          </IconButton>
          <button
            onClick={goToday}
            className="rounded-[var(--radius-md)] px-2 py-1 font-display text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-raised)]"
          >
            {periodLabel}
          </button>
          <IconButton aria-label="Next period" onClick={goNext}>
            <ChevronRight size={18} />
          </IconButton>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-0.5">
          {(['month', 'week', 'day'] as CalendarViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-[calc(var(--radius-md)-2px)] px-3 py-1 text-xs font-medium capitalize transition-colors',
                view === v ? 'bg-[var(--surface-raised)] text-[var(--text)]' : 'text-[var(--text-muted)]'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <MonthGrid year={cursor.getFullYear()} month={cursor.getMonth()} onSelectDay={setPanelDate} />
      )}
      {view === 'week' && (
        <WeekAgenda cursorDate={cursorDate} onItemClick={handleItemClick} onAddForDay={setPanelDate} />
      )}
      {view === 'day' && (
        <DayAgenda date={cursorDate} onItemClick={handleItemClick} onAdd={() => setPanelDate(cursorDate)} />
      )}

      <Modal
        open={Boolean(panelDate)}
        onClose={() => setPanelDate(null)}
        title={panelDate ? formatFullDate(panelDate) : ''}
        size="sm"
      >
        {panelDate && (
          <DayPanelBody
            date={panelDate}
            onItemClick={handleItemClick}
            onAddTask={() => openQuickTask(panelDate)}
            onAddReminder={() => openQuickReminder(panelDate)}
          />
        )}
      </Modal>

      <TaskFormModal open={quickTaskOpen} onClose={() => setQuickTaskOpen(false)} defaultDueDate={quickAddDate} />
      <ReminderFormModal
        open={quickReminderOpen}
        onClose={() => setQuickReminderOpen(false)}
        defaultDate={quickAddDate}
      />

      <TaskFormModal
        open={editTarget !== null && editTarget.type === 'task'}
        onClose={() => setEditTarget(null)}
        task={editTarget && editTarget.type === 'task' ? state.tasks.find((t) => t.id === editTarget.id) : undefined}
      />
      <ReminderFormModal
        open={editTarget !== null && editTarget.type === 'reminder'}
        onClose={() => setEditTarget(null)}
        reminder={
          editTarget && editTarget.type === 'reminder'
            ? state.reminders.find((r) => r.id === editTarget.id)
            : undefined
        }
      />
      <NoteFormModal
        open={editTarget !== null && editTarget.type === 'note'}
        onClose={() => setEditTarget(null)}
        note={editTarget && editTarget.type === 'note' ? state.notes.find((n) => n.id === editTarget.id) : undefined}
      />
      <ProjectDetailModal
        project={
          editTarget && editTarget.type === 'project'
            ? (state.projects.find((p) => p.id === editTarget.id) ?? null)
            : null
        }
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}

