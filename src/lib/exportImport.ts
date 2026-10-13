import type { AppState } from '../types';
import { mergeWithDefaults } from './persistence';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Triggers a browser download of every project, task, note, reward and stat as one JSON file. */
export function exportStateAsJson(state: AppState): void {
  const payload = {
    app: 'nexus',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `nexus-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  state?: AppState;
  error?: string;
}

/** Reads a File the user picked, validates it, and merges it over safe defaults. Never throws. */
export function readImportFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const looksLikeJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    if (!looksLikeJson) {
      resolve({
        success: false,
        error: "That doesn't look like a JSON file. Choose the .json file Nexus exported.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const parsed: unknown = JSON.parse(text);
        const raw = isPlainObject(parsed) && 'data' in parsed ? parsed.data : parsed;
        resolve({ success: true, state: mergeWithDefaults(raw) });
      } catch {
        resolve({
          success: false,
          error: 'This file is not valid JSON, or is corrupted. Nothing was changed.',
        });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'The file could not be read. Nothing was changed.' });
    };
    reader.readAsText(file);
  });
}

