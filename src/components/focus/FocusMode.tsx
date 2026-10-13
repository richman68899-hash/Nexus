import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import type { Task } from '../../types';
import { useApp } from '../../store/AppContext';
import { playSound } from '../../lib/soundEngine';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Primitives';
import { TextInput } from '../ui/FormControls';

interface FocusModeProps {
  task: Task | null;
  onClose: () => void;
}

const PRESETS = [15, 25, 45];
const CIRCUMFERENCE = 2 * Math.PI * 45;

export function FocusMode({ task, onClose }: FocusModeProps) {
  const { state, completeTask } = useApp();
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const taskId = task?.id;

  useEffect(() => {
    setSecondsLeft(durationMinutes * 60);
    setRunning(false);
    setFinished(false);
  }, [durationMinutes, taskId]);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          setFinished(true);
          if (state.settings.sound.enabled) playSound('bell', state.settings.sound.volume);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!task) return null;

  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - secondsLeft) / totalSeconds;
  const minutesDisplay = Math.floor(secondsLeft / 60);
  const secondsDisplay = secondsLeft % 60;
  const notStarted = !running && !finished && secondsLeft === durationMinutes * 60;

  function applyCustom() {
    const value = Math.max(1, Math.min(180, Math.round(Number(customMinutes) || 0)));
    if (value > 0) {
      setDurationMinutes(value);
      setCustomMinutes('');
    }
  }

  function handleComplete() {
    completeTask(task!.id);
    onClose();
  }

  function handleReset() {
    setSecondsLeft(durationMinutes * 60);
    setRunning(false);
    setFinished(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus mode"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[var(--bg)] px-6"
    >
      <button
        onClick={onClose}
        aria-label="Exit focus mode"
        className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <X size={22} />
      </button>

      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-faint)]">Focus mode</p>
        <h1 className="font-display text-2xl font-semibold text-[var(--text)]">{task.name}</h1>
        {task.description && <p className="mt-2 text-sm text-[var(--text-muted)]">{task.description}</p>}

        <div className="relative mx-auto my-8 flex h-52 w-52 items-center justify-center sm:h-56 sm:w-56">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <span className="font-mono text-4xl font-semibold text-[var(--text)]">
            {String(minutesDisplay).padStart(2, '0')}:{String(secondsDisplay).padStart(2, '0')}
          </span>
        </div>

        {finished ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--accent)]">Time&rsquo;s up. How did it go?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleComplete}>Mark task complete</Button>
              <Button variant="secondary" onClick={handleReset}>
                Keep going
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {notStarted && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setDurationMinutes(p)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      durationMinutes === p
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                    )}
                  >
                    {p}m
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <TextInput
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Custom"
                    className="w-20 py-1 text-xs"
                    aria-label="Custom minutes"
                  />
                  <Button size="sm" variant="secondary" onClick={applyCustom}>
                    Set
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={() => setRunning((r) => !r)}
                icon={running ? <Pause size={16} /> : <Play size={16} />}
              >
                {running ? 'Pause' : 'Start'}
              </Button>
              <Button variant="secondary" size="lg" onClick={handleReset} icon={<RotateCcw size={16} />}>
                Reset
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleComplete}>
              Mark complete now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

