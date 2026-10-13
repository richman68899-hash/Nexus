import type { SoundName } from '../types';

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedContext) {
    sharedContext = new AudioCtx();
  }
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume();
  }
  return sharedContext;
}

function playTone(
  ctx: AudioContext,
  opts: { frequency: number; start: number; duration: number; type?: OscillatorType; peakGain?: number }
): void {
  const { frequency, start, duration, type = 'sine', peakGain = 0.2 } = opts;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(Math.max(peakGain, 0.0001), ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

type Preset = (ctx: AudioContext, volume: number) => void;

const PRESETS: Record<Exclude<SoundName, 'none'>, Preset> = {
  chime: (ctx, v) => {
    playTone(ctx, { frequency: 660, start: 0, duration: 0.16, peakGain: 0.22 * v });
    playTone(ctx, { frequency: 990, start: 0.09, duration: 0.22, peakGain: 0.18 * v });
  },
  pop: (ctx, v) => {
    playTone(ctx, { frequency: 440, start: 0, duration: 0.09, type: 'triangle', peakGain: 0.25 * v });
  },
  bell: (ctx, v) => {
    playTone(ctx, { frequency: 880, start: 0, duration: 0.5, peakGain: 0.16 * v });
    playTone(ctx, { frequency: 1760, start: 0, duration: 0.35, peakGain: 0.06 * v });
  },
  sparkle: (ctx, v) => {
    [988, 1319, 1568].forEach((freq, i) => {
      playTone(ctx, { frequency: freq, start: i * 0.06, duration: 0.18, peakGain: 0.14 * v });
    });
  },
};

/** Play a short, generated, copyright-free tone. Never throws — sound is a nice-to-have, never critical. */
export function playSound(name: SoundName, volume: number): void {
  if (name === 'none' || volume <= 0) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    PRESETS[name](ctx, Math.max(0, Math.min(1, volume)));
  } catch {
    // Ignore — audio can fail for all sorts of environment reasons.
  }
}

