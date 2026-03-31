import type { PatternDefinition } from '@textura/shared';

export function getPatternPreviewUrl(
  pattern: Pick<PatternDefinition, 'previewAssetPath'> | null | undefined,
): string | null {
  if (!pattern?.previewAssetPath) return null;
  const filename = pattern.previewAssetPath.split('/').pop();
  if (!filename) return null;
  return `/api/pattern-previews/${encodeURIComponent(filename)}?v=uploaded-svg-1`;
}
