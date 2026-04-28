import type { PatternType } from '@textura/shared';

const VITA_COMPONENT_PATTERNS = new Set<PatternType>(['venzowood_4', 'venzowood_5']);

export function isVitaComponentPattern(patternType: PatternType) {
  return VITA_COMPONENT_PATTERNS.has(patternType);
}

export function supportsEmbossPattern(patternType: PatternType) {
  return !isVitaComponentPattern(patternType);
}
