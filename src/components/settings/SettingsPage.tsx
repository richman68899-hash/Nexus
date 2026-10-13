import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { AlertTriangle, Download, Upload } from 'lucide-react';
import type { SoundName } from '../../types';
import { useApp } from '../../store/AppContext';
import { ACCENT_PRESETS } from '../../lib/constants';
import { generateDefaultLevelThresholds } from '../../lib/xpEngine';
import {
  getNotificationPermission,
  getNotificationSupport,
  requestNotificationPermission,
} from '../../lib/notifications';
import { cn } from '../../lib/utils';
import { Button, Card } from '../ui/Primitives';
import { Checkbox, Field, Select, TextInput } from '../ui/FormControls';
import { AccentPicker } from '../ui/Pickers';
import { ConfirmDialog } from '../ui/Modal';

const SOUND_OPTIONS: { value: SoundName; label: string }[] = [
  { value: 'chime', label: 'Chime' },
  { value: 'pop', label: 'Pop' },
  { value: 'bell', label: 'Bell' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'none', label: 'Off' },
];

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 font-display text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function NotificationsSection() {
  const { state, updateSettings } = useApp();
  const supported = getNotificationSupport();
  const permission = getNotificationPermission();

  async function handleEnable() {
    const result = await requestNotificationPermission();
    if (result === 'granted') updateSettings({ notificationsEnabled: true });
  }

  return (
    <div className="space-y-3">
      <Checkbox
        checked={state.settings.notificationsEnabled}
        onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
        label="Enable reminders"
        disabled={!supported}
      />
      {!supported && (
        <p className="text-xs text-[var(--text-muted)]">Notifications aren&rsquo;t supported in this browser.</p>
      )}
      {supported && permission !== 'granted' && (
        <div>
          <Button variant="secondary" size="sm" onClick={handleEnable}>
            Allow browser notifications
          </Button>
          {permission === 'denied' && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Notifications are blocked — enable them in your browser&rsquo;s site settings to receive alerts here.
            </p>
          )}
        </div>
      )}
      {supported && permission === 'granted' && (
        <p className="text-xs text-[var(--success)]">Browser notifications are enabled.</p>
      )}
      <p className="text-xs text-[var(--text-faint)]">Reminders are checked while Nexus is open in a browser tab.</p>
    </div>
  );
}

function XpValuesEditor() {
  const { state, updateSettings } = useApp();
  const xp = state.settings.xpValues;

  function update(key: keyof typeof xp, value: number) {
    updateSettings({ xpValues: { ...xp, [key]: value } });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Normal task">
        <TextInput type="number" min={0} value={xp.normal} onChange={(e) => update('normal', Number(e.target.value) || 0)} />
      </Field>
      <Field label="Important task">
        <TextInput
          type="number"
          min={0}
          value={xp.important}
          onChange={(e) => update('important', Number(e.target.value) || 0)}
        />
      </Field>
      <Field label="Milestone">
        <TextInput
          type="number"
          min={0}
          value={xp.milestone}
          onChange={(e) => update('milestone', Number(e.target.value) || 0)}
        />
      </Field>
      <Field label="Project completion">
        <TextInput
          type="number"
          min={0}
          value={xp.projectCompletion}
          onChange={(e) => update('projectCompletion', Number(e.target.value) || 0)}
        />
      </Field>
    </div>
  );
}

function LevelThresholdsEditor() {
  const { state, updateSettings } = useApp();
  const thresholds = state.settings.levelThresholds;
  const visibleCount = 8;

  function updateThreshold(index: number, value: number) {
    const next = [...thresholds];
    next[index] = value;
    updateSettings({ levelThresholds: next });
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {thresholds.slice(0, visibleCount).map((value, i) => (
          <div key={i}>
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Lv.{i + 1}</span>
            <TextInput
              type="number"
              min={0}
              value={value}
              disabled={i === 0}
              onChange={(e) => updateThreshold(i, Number(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Levels beyond {visibleCount} continue automatically from this pattern.
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => updateSettings({ levelThresholds: generateDefaultLevelThresholds() })}
      >
        Reset to defaults
      </Button>
    </div>
  );
}

function DataSection() {
  const { state, exportData, importData, loadDemoData, resetAllData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  const hasExistingData = state.projects.length > 0 || state.tasks.length > 0 || state.notes.length > 0;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importData(file);
    setImportMessage(
      result.success
        ? { type: 'success', text: 'Data imported successfully.' }
        : { type: 'error', text: result.error ?? 'Import failed.' }
    );
    e.target.value = '';
    setTimeout(() => setImportMessage(null), 4000);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportData}>
          Export data
        </Button>
        <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
          Import data
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {importMessage && (
        <p className={cn('text-sm', importMessage.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
          {importMessage.text}
        </p>
      )}

      <div className="border-t border-[var(--border)] pt-3">
        <p className="mb-2 text-sm text-[var(--text-muted)]">
          Populate the app with example projects and tasks — useful for a demo.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setConfirmDemo(true)}>
          Load demo data
        </Button>
      </div>

      <div className="border-t border-[var(--border)] pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--danger)]">
          <AlertTriangle size={14} /> Danger zone
        </p>
        <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
          Reset all data
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDemo}
        title="Load demo data?"
        description={hasExistingData ? 'This replaces your current data with example projects and tasks.' : undefined}
        confirmLabel="Load demo data"
        danger={hasExistingData}
        onConfirm={() => {
          loadDemoData();
          setConfirmDemo(false);
        }}
        onCancel={() => setConfirmDemo(false)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        description="This permanently deletes every project, task, note, and reward."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          resetAllData();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

export function SettingsPage() {
  const { state, updateSettings } = useApp();
  const sound = state.settings.sound;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionCard title="Appearance">
        <Field label="Accent color">
          <AccentPicker
            value={state.settings.accentColor}
            onChange={(hex) => updateSettings({ accentColor: hex })}
            presets={ACCENT_PRESETS}
          />
        </Field>
        <Field label="Theme">
          <div className="flex gap-2">
            <Button
              variant={state.settings.theme === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              Dark
            </Button>
            <Button
              variant={state.settings.theme === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => updateSettings({ theme: 'light' })}
            >
              Light
            </Button>
          </div>
        </Field>
        <Checkbox
          checked={state.settings.compactLayout}
          onChange={(e) => updateSettings({ compactLayout: e.target.checked })}
          label="Compact layout"
        />
      </SectionCard>

      <SectionCard title="Sounds & animation">
        <Checkbox
          checked={sound.enabled}
          onChange={(e) => updateSettings({ sound: { ...sound, enabled: e.target.checked } })}
          label="Enable sounds"
        />
        {sound.enabled && (
          <>
            <Field label="Volume">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sound.volume}
                onChange={(e) => updateSettings({ sound: { ...sound, volume: Number(e.target.value) } })}
                className="w-full accent-[var(--accent)]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Completion sound">
                <Select
                  value={sound.completionSound}
                  onChange={(e) => updateSettings({ sound: { ...sound, completionSound: e.target.value as SoundName } })}
                >
                  {SOUND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Milestone sound">
                <Select
                  value={sound.milestoneSound}
                  onChange={(e) => updateSettings({ sound: { ...sound, milestoneSound: e.target.value as SoundName } })}
                >
                  {SOUND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Reward sound">
                <Select
                  value={sound.rewardSound}
                  onChange={(e) => updateSettings({ sound: { ...sound, rewardSound: e.target.value as SoundName } })}
                >
                  {SOUND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Reminder sound">
                <Select
                  value={sound.reminderSound}
                  onChange={(e) => updateSettings({ sound: { ...sound, reminderSound: e.target.value as SoundName } })}
                >
                  {SOUND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        )}
        <Checkbox
          checked={state.settings.animationsEnabled}
          onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
          label="Enable completion animation"
        />
      </SectionCard>

      <SectionCard title="Notifications">
        <NotificationsSection />
      </SectionCard>

      <SectionCard title="Rewards">
        <div>
          <span className="mb-2 block text-sm font-medium text-[var(--text)]">XP values</span>
          <XpValuesEditor />
        </div>
        <div>
          <span className="mb-2 block text-sm font-medium text-[var(--text)]">Level progression</span>
          <LevelThresholdsEditor />
        </div>
      </SectionCard>

      <SectionCard title="Data">
        <DataSection />
      </SectionCard>
    </div>
  );
}

