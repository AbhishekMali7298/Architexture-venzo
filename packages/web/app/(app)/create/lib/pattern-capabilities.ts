import type { PatternType } from '@textura/shared';

export const IMPRESS_PATTERN_TYPES: PatternType[] = [
  'venzowood',
  'venzowood_2',
  'venzowood_3',
  'chequer_pattern',
  'concave_pattern',
  'convex_pattern',
  'rhombus_pattern',
  'ripple_pattern',
  'grate_pattern_2',
  'boho_pattern',
  'chisel_pattern',
  'fibra_pattern',
  'matrix_pattern',
  'mesh_pattern',
  'raffia_pattern',
  'weave_pattern_2',
];

const VITA_COMPONENT_PATTERNS = new Set<PatternType>(['venzowood_4', 'venzowood_5']);
const IMPRESS_PATTERN_SET = new Set<PatternType>(IMPRESS_PATTERN_TYPES);

export function isImpressPattern(patternType: PatternType) {
  return IMPRESS_PATTERN_SET.has(patternType);
}

export function isVitaComponentPattern(patternType: PatternType) {
  return VITA_COMPONENT_PATTERNS.has(patternType);
}

export function supportsEmbossPattern(patternType: PatternType) {
  return isImpressPattern(patternType) || isVitaComponentPattern(patternType);
}
