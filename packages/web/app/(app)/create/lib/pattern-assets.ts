import type { PatternDefinition } from '@textura/shared';

export function getPatternPreviewUrl(pattern: PatternDefinition | null | undefined): string | null {
  if (!pattern?.previewAssetPath) return null;
  return `/api/assets/${pattern.previewAssetPath}`;
}
