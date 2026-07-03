import type { PatternType } from '@textura/shared';

/**
 * Large-sheet presets intentionally shrink some pattern modules more than others.
 * Chequer needs the same quarter-scale treatment as the other module-sized SVG patterns.
 */
export function getLargeSheetPatternScaleFactor(patternType: PatternType) {
  if (
    patternType === 'venzowood_2' ||
    patternType === 'venzowood_3' ||
    patternType === 'ripple_pattern' ||
    patternType === 'chequer_pattern'
  ) {
    return 0.25;
  }

  return 0.1;
}
