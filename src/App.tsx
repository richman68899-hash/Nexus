import { useEffect, useState } from 'react';
import type { Task, ViewName } from './types';
import { useApp } from './store/AppContext';
import { hexToRgbString } from './lib/utils';
import { AppShell } from './components/layout/AppShell';
import type { QuickCreateType } from './components/layout/AppShell';
import { CompletionToast } from './components/ui/Toast';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { TasksPage } from './components/tasks/TasksPage';
import { CalendarPage } from './components/calendar/CalendarPage';
import { NotesPage } from './components/notes/NotesPage';
import { ProgressPage } from './components/progress/ProgressPage';
import { RewardsPage } from './components/rewards/RewardsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { GlobalSearch } from './components/search/GlobalSearch';
import { FocusMode } from './components/focus/FocusMode';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { NoteFormModal } from './components/notes/NoteFormModal';
import { ReminderFormModal } from './components/calendar/ReminderFormModal';
import { RewardFormModal } from './components/rewards/RewardFormModal';

export default function App() {
  const { state, toastEvent, dismissToast, updateSettings } = useApp();
  const [activeView, setActiveView] = useState<ViewName>(state.settings.lastView ?? 'dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [quickCreate, setQuickCreate] = useState<QuickCreateType | null>(null);

  // Theme, accent color, and the animations toggle are all applied here, in
  // exactly one place, as plain CSS custom properties / attributes that the
  // rest of the app reads from — see index.css.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme;
    root.style.setProperty('--accent', state.settings.accentColor);
    root.style.setProperty('--accent-rgb', hexToRgbString(state.settings.accentColor));
    root.classList.toggle('no-motion', !state.settings.animationsEnabled);
  }, [state.settings.theme, state.settings.accentColor, state.settings.animationsEnabled]);

  function handleNavigate(view: ViewName) {
    setActiveView(view);
    updateSettings({ lastView: view });
  }

  function renderPage() {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage onStartFocus={setFocusTask} />;
      case 'projects':
        return <ProjectsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'notes':
        return <NotesPage />;
      case 'progress':
        return <ProgressPage />;
      case 'rewards':
        return <RewardsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  }

  return (
    <>
      <AppShell
        activeView={activeView}
        onNavigate={handleNavigate}
        onQuickCreate={setQuickCreate}
        onOpenSearch={() => setSearchOpen(true)}
      >
        {renderPage()}
      </AppShell>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <CompletionToast event={toastEvent} onDismiss={dismissToast} animationsEnabled={state.settings.animationsEnabled} />

      {focusTask && <FocusMode task={focusTask} onClose={() => setFocusTask(null)} />}

      <TaskFormModal open={quickCreate === 'task'} onClose={() => setQuickCreate(null)} />
      <ProjectFormModal open={quickCreate === 'project'} onClose={() => setQuickCreate(null)} />
      <NoteFormModal open={quickCreate === 'note'} onClose={() => setQuickCreate(null)} />
      <ReminderFormModal open={quickCreate === 'reminder'} onClose={() => setQuickCreate(null)} />
      <RewardFormModal open={quickCreate === 'reward'} onClose={() => setQuickCreate(null)} />
    </>
  );
}

