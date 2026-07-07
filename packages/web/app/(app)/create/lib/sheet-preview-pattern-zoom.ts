import type { PatternType } from '@textura/shared';
import type { SheetPreviewPreset } from './production-metrics';

export function getCanvasSheetPreviewPatternZoom(
  patternType: PatternType,
  preset: SheetPreviewPreset,
) {
  if ((preset === '4x8' || preset === '4x10') && patternType === 'raffia_pattern') {
    return 2;
  }

  return 1;
}
