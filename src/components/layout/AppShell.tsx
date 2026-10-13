import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BellRing,
  CalendarDays,
  Flame,
  FolderKanban,
  Gift,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plus,
  Search,
  Settings,
  StickyNote,
  Zap,
} from 'lucide-react';
import type { ViewName } from '../../types';
import { VIEW_LABELS } from '../../types';
import { cn } from '../../lib/utils';
import { useApp } from '../../store/AppContext';
import { getLevelProgress, getTotalXp } from '../../lib/xpEngine';
import { getCurrentStreak, getDailyActivityMap } from '../../lib/selectors';
import { Button, IconButton } from '../ui/Primitives';

export type QuickCreateType = 'task' | 'project' | 'note' | 'reminder' | 'reward';

const NAV_ITEMS: { view: ViewName; icon: LucideIcon }[] = [
  { view: 'dashboard', icon: LayoutDashboard },
  { view: 'projects', icon: FolderKanban },
  { view: 'tasks', icon: ListChecks },
  { view: 'calendar', icon: CalendarDays },
  { view: 'notes', icon: StickyNote },
  { view: 'progress', icon: BarChart3 },
  { view: 'rewards', icon: Gift },
  { view: 'settings', icon: Settings },
];

const PRIMARY_MOBILE: ViewName[] = ['dashboard', 'projects', 'tasks', 'calendar'];

const QUICK_CREATE_ITEMS: { type: QuickCreateType; label: string; icon: LucideIcon }[] = [
  { type: 'task', label: 'New Task', icon: ListChecks },
  { type: 'project', label: 'New Project', icon: FolderKanban },
  { type: 'note', label: 'New Note', icon: StickyNote },
  { type: 'reminder', label: 'New Reminder', icon: BellRing },
  { type: 'reward', label: 'New Reward', icon: Gift },
];

function Sidebar({ activeView, onNavigate }: { activeView: ViewName; onNavigate: (v: ViewName) => void }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-xl">🛰️</span>
        <span className="font-display text-lg font-semibold tracking-tight text-[var(--text)]">Nexus</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ view, icon: Icon }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={cn(
                'flex w-full items-center gap-3 rounded-[var(--radius-md)] border-l-2 px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'border-l-[var(--accent)] bg-[rgba(var(--accent-rgb),0.1)] font-medium text-[var(--text)]'
                  : 'border-l-transparent text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]'
              )}
            >
              <Icon size={17} />
              {VIEW_LABELS[view]}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function BottomNav({ activeView, onNavigate }: { activeView: ViewName; onNavigate: (v: ViewName) => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = NAV_ITEMS.filter((i) => PRIMARY_MOBILE.includes(i.view));
  const moreItems = NAV_ITEMS.filter((i) => !PRIMARY_MOBILE.includes(i.view));
  const moreActive = moreItems.some((i) => i.view === activeView);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border)] bg-[var(--surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {primaryItems.map(({ view, icon: Icon }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]',
                active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              )}
            >
              <Icon size={19} />
              {VIEW_LABELS[view]}
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          aria-label="More sections"
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]',
            moreActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
          )}
        >
          <Menu size={19} />
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 animate-nx-toast-in rounded-t-[var(--radius-lg)] border-t border-[var(--border)] bg-[var(--surface)] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--border-strong)]" />
            {moreItems.map(({ view, icon: Icon }) => (
              <button
                key={view}
                onClick={() => {
                  onNavigate(view);
                  setMoreOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm',
                  activeView === view ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                )}
              >
                <Icon size={18} />
                {VIEW_LABELS[view]}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function TopBar({
  activeView,
  onOpenSearch,
  onQuickCreate,
}: {
  activeView: ViewName;
  onOpenSearch: () => void;
  onQuickCreate: (type: QuickCreateType) => void;
}) {
  const { state } = useApp();
  const levelProgress = getLevelProgress(getTotalXp(state), state.settings.levelThresholds);
  const streak = getCurrentStreak(getDailyActivityMap(state));
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur sm:px-6">
      <h1 className="font-display text-lg font-semibold text-[var(--text)]">{VIEW_LABELS[activeView]}</h1>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs sm:flex">
          <span className="flex items-center gap-1 text-[var(--warning)]">
            <Flame size={13} />
            {streak}
          </span>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span className="flex items-center gap-1 text-[var(--accent)]">
            <Zap size={13} />
            {levelProgress.totalXp} XP
          </span>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span className="text-[var(--text)]">Lv. {levelProgress.level}</span>
        </div>
        <IconButton aria-label="Search" onClick={onOpenSearch}>
          <Search size={18} />
        </IconButton>
        <div className="relative">
          <Button size="sm" onClick={() => setNewMenuOpen((v) => !v)} icon={<Plus size={15} />}>
            New
          </Button>
          {newMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] py-1 shadow-[var(--shadow-modal)]">
                {QUICK_CREATE_ITEMS.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setNewMenuOpen(false);
                      onQuickCreate(type);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                  >
                    <Icon size={15} className="text-[var(--text-muted)]" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

interface AppShellProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  onQuickCreate: (type: QuickCreateType) => void;
  onOpenSearch: () => void;
  children: ReactNode;
}

export function AppShell({ activeView, onNavigate, onQuickCreate, onOpenSearch, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar activeView={activeView} onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar activeView={activeView} onOpenSearch={onOpenSearch} onQuickCreate={onQuickCreate} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8">{children}</main>
      </div>
      <BottomNav activeView={activeView} onNavigate={onNavigate} />
    </div>
  );
}

