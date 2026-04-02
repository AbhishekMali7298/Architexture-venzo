import type { PatternType } from '@textura/shared';

const ORIENTATION_TOGGLE_PATTERN_TYPES = new Set<PatternType>(['stack_bond']);

export function supportsPatternOrientationToggle(type: PatternType) {
  return ORIENTATION_TOGGLE_PATTERN_TYPES.has(type);
}

export function normalizePatternOrientationAngle(angle: number) {
  const normalized = ((angle % 180) + 180) % 180;
  return Math.abs(normalized - 90) < 0.001 ? 90 : 0;
}

export function isVerticalPatternOrientation(angle: number) {
  return normalizePatternOrientationAngle(angle) === 90;
}

export function togglePatternOrientationAngle(angle: number) {
  return isVerticalPatternOrientation(angle) ? 0 : 90;
}
