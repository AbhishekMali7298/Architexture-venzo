import type { PatternType } from '@textura/shared';

/**
 * Large-sheet presets intentionally shrink some pattern modules more than others.
 * Tune these per pattern so sheet previews stay legible without becoming oversized.
 */
export function getLargeSheetPatternScaleFactor(patternType: PatternType) {
  const scaleFactors: Partial<Record<PatternType, number>> = {
    venzowood: 0.15,
    rhombus_pattern: 0.15,
    venzowood_2: 0.25,
    venzowood_3: 0.25,
    chequer_pattern: 0.25,
    concave_pattern: 0.25,
    convex_pattern: 0.25,
    ripple_pattern: 0.4,
    grate_pattern_2: 0.2,
    boho_pattern: 1.0,
    chisel_pattern: 6.0,
    fibra_pattern: 0.5,
    matrix_pattern: 6.0,
    mesh_pattern: 0.2,
    raffia_pattern: 0.25,
    weave_pattern_2: 0.18,
  };

  return scaleFactors[patternType] ?? 0.1;
}
