import { describe, expect, it } from 'vitest';
import { getLargeSheetPatternScaleFactor } from './large-sheet-scale-factor';

describe('getLargeSheetPatternScaleFactor', () => {
  it('keeps hero rhombus modules readable on large sheets', () => {
    expect(getLargeSheetPatternScaleFactor('venzowood')).toBe(0.15);
    expect(getLargeSheetPatternScaleFactor('rhombus_pattern')).toBe(0.15);
  });

  it('enlarges previously tiny impress patterns and reins in oversized ones', () => {
  expect(getLargeSheetPatternScaleFactor('boho_pattern')).toBe(1.0);
    expect(getLargeSheetPatternScaleFactor('matrix_pattern')).toBe(0.25);
    expect(getLargeSheetPatternScaleFactor('fibra_pattern')).toBe(0.5);
    expect(getLargeSheetPatternScaleFactor('chisel_pattern')).toBe(6.0);
  });
});
