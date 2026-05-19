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

export const VITA_COMPONENT_PATTERN_TYPES: PatternType[] = [
  'venzowood_4',
  'venzowood_5',
  'vita_pattern_3',
  'vita_pattern_4',
  'vita_pattern_5',
  'vita_pattern_6',
  'vita_pattern_7',
  'vita_pattern_8',
  'vita_pattern_9',
  'vita_pattern_10',
  'vita_pattern_11',
  'vita_pattern_12',
  'vita_pattern_13',
  'vita_pattern_14',
  'vita_pattern_15',
  'vita_pattern_16',
  'vita_pattern_17',
  'vita_pattern_18',
  'vita_pattern_20',
  'vita_pattern_21',
  'vita_pattern_22',
  'vita_pattern_23',
  'vita_pattern_24',
  'vita_pattern_25',
  'vita_pattern_26',
  'vita_pattern_27',
  'vita_pattern_28',
  'vita_pattern_29',
  'vita_pattern_30',
  'vita_pattern_31',
  'vita_pattern_32',
  'vita_pattern_33',
  'vita_pattern_34',
  'vita_pattern_35',
  'vita_pattern_36',
  'vita_pattern_37',
  'vita_pattern_38',
  'vita_pattern_39',
  'vita_pattern_40',
  'vita_pattern_41',
  'vita_pattern_42',
];

const VITA_COMPONENT_PATTERNS = new Set<PatternType>(VITA_COMPONENT_PATTERN_TYPES);
const IMPRESS_PATTERN_SET = new Set<PatternType>(IMPRESS_PATTERN_TYPES);

export function isImpressPattern(patternType: PatternType) {
  return IMPRESS_PATTERN_SET.has(patternType);
}

export function isVitaComponentPattern(patternType: PatternType) {
  return VITA_COMPONENT_PATTERNS.has(patternType);
}

export function usesSwappedVitaMaterialMapping(patternType: PatternType) {
  return patternType === 'vita_pattern_3';
}

export function usesMaterialBackgroundVitaPattern(patternType: PatternType) {
  return patternType === 'vita_pattern_17';
}

export function supportsEmbossPattern(patternType: PatternType) {
  return isImpressPattern(patternType) || isVitaComponentPattern(patternType);
}
