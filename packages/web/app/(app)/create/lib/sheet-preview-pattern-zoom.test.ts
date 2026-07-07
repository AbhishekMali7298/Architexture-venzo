import { describe, expect, it } from 'vitest';
import { getCanvasSheetPreviewPatternZoom } from './sheet-preview-pattern-zoom';

describe('getCanvasSheetPreviewPatternZoom', () => {
  it('zooms raffia only on the large sheet canvas presets', () => {
    expect(getCanvasSheetPreviewPatternZoom('raffia_pattern', '4x8')).toBe(2);
    expect(getCanvasSheetPreviewPatternZoom('raffia_pattern', '4x10')).toBe(2);
  });

  it('leaves other patterns and presets unchanged', () => {
    expect(getCanvasSheetPreviewPatternZoom('raffia_pattern', 'none')).toBe(1);
    expect(getCanvasSheetPreviewPatternZoom('mesh_pattern', '4x8')).toBe(1);
  });
});
