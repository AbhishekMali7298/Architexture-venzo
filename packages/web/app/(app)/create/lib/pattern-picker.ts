import {
  PATTERN_CATALOG,
  PATTERN_CATEGORIES,
  getPatternByType,
  type PatternCategory,
  type PatternDefinition,
  type PatternType,
} from '@textura/shared';

const UPLOADED_PATTERN_TYPES = new Set<PatternType>([
  'none',
  'stack_bond',
  'stretcher_bond',
  'herringbone',
  'flemish_bond',
  'running_bond',
  'chevron',
  'staggered',
  'ashlar',
  'cubic',
  'hexagonal',
  'basketweave',
  'hopscotch',
  'diamond',
  'intersecting_circle',
  'fishscale',
  'french',
]);

const PATTERN_CATEGORY_LABELS = new Map<PatternCategory, string>(
  PATTERN_CATEGORIES.map((category) => [category.id, category.displayName]),
);

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
}

export function getAvailablePatterns(): PatternDefinition[] {
  const nonePattern = getPatternByType('none');
  const uploadedPatterns = PATTERN_CATALOG.filter((pattern) => UPLOADED_PATTERN_TYPES.has(pattern.type));

  return nonePattern ? [nonePattern, ...uploadedPatterns] : uploadedPatterns;
}

export function patternMatchesSearch(pattern: PatternDefinition, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchText = normalizeSearchText([
    pattern.displayName,
    pattern.description,
    pattern.type,
    pattern.category,
    PATTERN_CATEGORY_LABELS.get(pattern.category) ?? pattern.category,
  ].join(' '));

  return searchText.includes(normalizedQuery);
}
