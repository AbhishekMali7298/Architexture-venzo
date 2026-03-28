'use client';

import { textureConfigSchema, type TextureConfig } from '@textura/shared';

const STORAGE_KEY = 'textura.create.project.v1';

export interface StoredCreateProject {
  config: TextureConfig;
  savedAt: string;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function saveProjectToStorage(config: TextureConfig): StoredCreateProject | null {
  if (!canUseStorage()) return null;

  const payload: StoredCreateProject = {
    config: JSON.parse(JSON.stringify(config)) as TextureConfig,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function loadProjectFromStorage(): StoredCreateProject | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCreateProject>;
    const result = textureConfigSchema.safeParse(parsed.config);

    if (!result.success || typeof parsed.savedAt !== 'string') {
      return null;
    }

    return {
      config: result.data,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown save time';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
