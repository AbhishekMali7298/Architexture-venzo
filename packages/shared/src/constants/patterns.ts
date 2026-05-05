import type { PatternCategory, PatternType, PatternConfig } from '../types/config';

export interface PatternDefinition {
  dimType?: 'single' | 'multi';
  type: PatternType;
  category: PatternCategory;
  rowColMode: 'grid' | 'module';
  rowMultiple: number;
  columnMultiple: number;
  displayName: string;
  widthLabel?: string;
  heightLabel?: string;
  description: string;
  previewPath: string;
  previewAssetPath?: string;
  defaults: {
    rows: number;
    columns: number;
    angle: number;
    stretchers: number;
    weaves: number;
    embossStrength?: number;
    embossIntensity?: number;
    embossDepth?: number;
  };
  parameterRanges: {
    rows: { min: number; max: number };
    columns: { min: number; max: number };
    angle: { min: number; max: number; step: number };
    stretchers?: { min: number; max: number };
    weaves?: { min: number; max: number };
  };
  defaultUnitWidth: number;
  defaultUnitHeight: number;
}

const ALL_PATTERN_CATALOG: PatternDefinition[] = [
  {
    type: 'venzowood',
    dimType: 'single',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Venzowood',
    widthLabel: 'Module Size',
    description: 'Decorative diamond parquet module with long inlay strips',
    previewPath: '',
    previewAssetPath: 'patterns/impress/venzowood.svg',
    defaults: { rows: 3, columns: 3, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 45, step: 1 },
    },
    defaultUnitWidth: 860,
    defaultUnitHeight: 860,
  },
  {
    type: 'venzowood_2',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Venzowood 2',
    widthLabel: 'Module Size',
    description: 'Decorative mixed-size rounded rectangular wood module',
    previewPath: '',
    previewAssetPath: 'patterns/impress/venzowood_2.svg',
    defaults: { rows: 2, columns: 2, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 860,
    defaultUnitHeight: 860,
  },
  {
    type: 'venzowood_3',
    dimType: 'single',
    category: 'organic',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Venzowood 3',
    widthLabel: 'Module Size',
    description: 'Organic freeform wood and stone module',
    previewPath: '',
    previewAssetPath: 'patterns/impress/venzowood_3.svg',
    defaults: { rows: 2, columns: 2, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 860,
    defaultUnitHeight: 860,
  },
  {
    type: 'chequer_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Chequer Pattern',
    description: 'Four-panel chequer module with elongated rectangular blocks',
    previewPath: '',
    previewAssetPath: 'patterns/impress/chequer_pattern.svg',
    defaults: { rows: 2, columns: 2, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 400,
  },
  {
    type: 'concave_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Concave Pattern',
    description: 'Slim vertical slat module with concave channel spacing',
    previewPath: '',
    previewAssetPath: 'patterns/impress/concave_pattern.svg',
    defaults: {
      rows: 1,
      columns: 1,
      angle: 0,
      stretchers: 1,
      weaves: 1,
      embossDepth: 100,
    },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 118.11,
    defaultUnitHeight: 1968.5,
  },
  {
    type: 'convex_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Convex Pattern',
    description: 'Wide vertical slat module with convex channel spacing',
    previewPath: '',
    previewAssetPath: 'patterns/impress/convex_pattern.svg',
    defaults: {
      rows: 1,
      columns: 1,
      angle: 0,
      stretchers: 1,
      weaves: 1,
      embossDepth: 100,
    },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 196.85,
    defaultUnitHeight: 1968.5,
  },
  {
    type: 'rhombus_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Rhombus Pattern',
    description: 'Layered rhombus motif with central diamond detailing',
    previewPath: '',
    previewAssetPath: 'patterns/impress/rhombus_pattern.svg',
    defaults: { rows: 1, columns: 1, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 417.83,
    defaultUnitHeight: 417.83,
  },
  {
    type: 'ripple_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Ripple Pattern',
    description: 'Fine vertical ripple module with repeated narrow grooves',
    previewPath: '',
    previewAssetPath: 'patterns/impress/ripple_pattern.svg',
    defaults: {
      rows: 1,
      columns: 1,
      angle: 0,
      stretchers: 1,
      weaves: 1,
      embossDepth: 0,
    },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 39.37,
    defaultUnitHeight: 2000,
  },
  {
    type: 'weave_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Weave Pattern',
    description: 'Rounded vertical weave module with alternating strap rhythm',
    previewPath: '',
    previewAssetPath: 'patterns/impress/weave_pattern.svg',
    defaults: { rows: 1, columns: 1, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 60.06,
    defaultUnitHeight: 330.32,
  },
  {
    type: 'venzowood_4',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Venzowood 4',
    widthLabel: 'Panel Width',
    heightLabel: 'Panel Height',
    description: 'Tall decorative wood panel module with circular inlays',
    previewPath: '',
    previewAssetPath: 'patterns/vita-components/venzowood_4.svg',
    defaults: { rows: 2, columns: 2, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 350,
    defaultUnitHeight: 980,
  },
  {
    type: 'venzowood_5',
    dimType: 'single',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Venzowood 5',
    widthLabel: 'Module Size',
    description: 'Decorative floral and star wood inlay module',
    previewPath: '',
    previewAssetPath: 'patterns/vita-components/venzowood_5.svg',
    defaults: { rows: 2, columns: 2, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 860,
    defaultUnitHeight: 860,
  },
  {
    type: 'grate_pattern',
    dimType: 'multi',
    category: 'geometric',
    rowColMode: 'module',
    rowMultiple: 1,
    columnMultiple: 1,
    displayName: 'Grate',
    description: 'Industrial grate module with repeating oval vent slots',
    previewPath: '',
    previewAssetPath: 'patterns/impress/grate_pattern.svg',
    defaults: {
      rows: 1,
      columns: 1,
      angle: 0,
      stretchers: 1,
      weaves: 1,
      embossDepth: 100,
    },
    parameterRanges: {
      rows: { min: 1, max: 20 },
      columns: { min: 1, max: 20 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 339.51,
    defaultUnitHeight: 1713.38,
  },
];

export const PATTERN_CATALOG: PatternDefinition[] = ALL_PATTERN_CATALOG.filter(
  (pattern) => pattern.type !== 'none',
);

/**
 * Get all patterns for a specific category.
 */
export function getPatternsByCategory(category: PatternCategory): PatternDefinition[] {
  return PATTERN_CATALOG.filter((p) => p.category === category);
}

/**
 * Get a pattern definition by its type.
 */
export function getPatternByType(type: PatternType): PatternDefinition | undefined {
  return ALL_PATTERN_CATALOG.find((p) => p.type === type);
}

/**
 * Get default pattern config for a given pattern type.
 */
export function getDefaultPatternConfig(type: PatternType): PatternConfig | undefined {
  const def = getPatternByType(type);
  if (!def) return undefined;
  return {
    type: def.type,
    category: def.category,
    orientation: 'horizontal',
    ...def.defaults,
    rows: 1,
    columns: 1,
  };
}

/**
 * All available pattern categories with display names.
 */
export const PATTERN_CATEGORIES: { id: PatternCategory; displayName: string }[] = [
  { id: 'brick_bond', displayName: 'Brick Bond' },
  { id: 'paving', displayName: 'Paving' },
  { id: 'geometric', displayName: 'Geometric' },
  { id: 'organic', displayName: 'Organic' },
  { id: 'roofing', displayName: 'Roofing' },
];
