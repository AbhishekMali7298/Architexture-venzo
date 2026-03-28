import type { PatternCategory, PatternType, PatternConfig } from '../types/config';

export interface PatternDefinition {
  type: PatternType;
  category: PatternCategory;
  displayName: string;
  description: string;
  defaults: {
    rows: number;
    columns: number;
    angle: number;
    stretchers: number;
    weaves: number;
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

export const PATTERN_CATALOG: PatternDefinition[] = [
  // ===== Brick Bond =====
  {
    type: 'running_bond',
    category: 'brick_bond',
    displayName: 'Running Bond',
    description: 'Classic brickwork with each row offset by half',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 215,
    defaultUnitHeight: 65,
  },
  {
    type: 'stack_bond',
    category: 'brick_bond',
    displayName: 'Stack Bond',
    description: 'Bricks stacked directly on top of each other',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 215,
    defaultUnitHeight: 65,
  },
  {
    type: 'flemish_bond',
    category: 'brick_bond',
    displayName: 'Flemish Bond',
    description: 'Alternating stretchers and headers in each course',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
      stretchers: { min: 1, max: 5 },
    },
    defaultUnitWidth: 215,
    defaultUnitHeight: 65,
  },
  {
    type: 'english_bond',
    category: 'brick_bond',
    displayName: 'English Bond',
    description: 'Alternating courses of stretchers and headers',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 215,
    defaultUnitHeight: 65,
  },
  {
    type: 'stretcher_bond',
    category: 'brick_bond',
    displayName: 'Stretcher Bond',
    description: 'All stretchers with variable offset',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
      stretchers: { min: 1, max: 10 },
    },
    defaultUnitWidth: 215,
    defaultUnitHeight: 65,
  },
  {
    type: 'soldier_course',
    category: 'brick_bond',
    displayName: 'Soldier Course',
    description: 'Bricks standing vertically',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 65,
    defaultUnitHeight: 215,
  },

  // ===== Paving =====
  {
    type: 'herringbone',
    category: 'paving',
    displayName: 'Herringbone',
    description: 'V-shaped zigzag pattern at 45° or 90°',
    defaults: { rows: 8, columns: 8, angle: 45, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 50 },
      columns: { min: 2, max: 50 },
      angle: { min: 0, max: 90, step: 45 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 100,
  },
  {
    type: 'basketweave',
    category: 'paving',
    displayName: 'Basketweave',
    description: 'Pairs of bricks alternating horizontal/vertical',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 2 },
    parameterRanges: {
      rows: { min: 2, max: 50 },
      columns: { min: 2, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
      weaves: { min: 1, max: 5 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 100,
  },
  {
    type: 'cobblestone',
    category: 'paving',
    displayName: 'Cobblestone',
    description: 'Irregular rounded stone paving',
    defaults: { rows: 8, columns: 8, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 50 },
      columns: { min: 2, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 100,
    defaultUnitHeight: 100,
  },
  {
    type: 'ashlar',
    category: 'paving',
    displayName: 'Ashlar',
    description: 'Cut stone with varying sizes in a coursed pattern',
    defaults: { rows: 4, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 30 },
      columns: { min: 1, max: 30 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 400,
    defaultUnitHeight: 200,
  },

  // ===== Geometric =====
  {
    type: 'hexagonal',
    category: 'geometric',
    displayName: 'Hexagonal',
    description: 'Honeycomb hexagonal tile pattern',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 30 },
      columns: { min: 2, max: 30 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 150,
    defaultUnitHeight: 150,
  },
  {
    type: 'chevron',
    category: 'geometric',
    displayName: 'Chevron',
    description: 'V-shaped pattern with angled cuts',
    defaults: { rows: 6, columns: 4, angle: 45, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 50 },
      columns: { min: 2, max: 50 },
      angle: { min: 15, max: 75, step: 1 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 50,
  },
  {
    type: 'pinwheel',
    category: 'geometric',
    displayName: 'Pinwheel',
    description: 'Four rectangles around a central square',
    defaults: { rows: 4, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 20 },
      columns: { min: 2, max: 20 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 100,
  },
  {
    type: 'windmill',
    category: 'geometric',
    displayName: 'Windmill',
    description: 'Four tiles arranged around a center in windmill formation',
    defaults: { rows: 4, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 20 },
      columns: { min: 2, max: 20 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 100,
  },
  {
    type: 'subway',
    category: 'geometric',
    displayName: 'Subway Tile',
    description: 'Classic subway tile with half offset',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 50 },
      columns: { min: 1, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 200,
    defaultUnitHeight: 100,
  },

  // ===== Parquetry =====
  {
    type: 'parquet_straight',
    category: 'parquetry',
    displayName: 'Parquet Straight',
    description: 'Straight-laid wood parquet flooring',
    defaults: { rows: 8, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 50 },
      columns: { min: 2, max: 50 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 600,
    defaultUnitHeight: 70,
  },
  {
    type: 'parquet_diagonal',
    category: 'parquetry',
    displayName: 'Parquet Diagonal',
    description: 'Diagonally laid wood parquet flooring',
    defaults: { rows: 8, columns: 4, angle: 45, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 50 },
      columns: { min: 2, max: 50 },
      angle: { min: 0, max: 90, step: 1 },
    },
    defaultUnitWidth: 600,
    defaultUnitHeight: 70,
  },
  {
    type: 'versailles',
    category: 'parquetry',
    displayName: 'Versailles',
    description: 'Classic Versailles parquet pattern',
    defaults: { rows: 3, columns: 3, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 10 },
      columns: { min: 1, max: 10 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 980,
    defaultUnitHeight: 980,
  },

  // ===== Organic / Random =====
  {
    type: 'crazy_paving',
    category: 'random',
    displayName: 'Crazy Paving',
    description: 'Irregular, random-shaped stones',
    defaults: { rows: 5, columns: 5, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 2, max: 30 },
      columns: { min: 2, max: 30 },
      angle: { min: 0, max: 360, step: 1 },
    },
    defaultUnitWidth: 300,
    defaultUnitHeight: 300,
  },
];

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
  return PATTERN_CATALOG.find((p) => p.type === type);
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
    ...def.defaults,
  };
}

/**
 * All available pattern categories with display names.
 */
export const PATTERN_CATEGORIES: { id: PatternCategory; displayName: string }[] = [
  { id: 'brick_bond', displayName: 'Brick Bond' },
  { id: 'paving', displayName: 'Paving' },
  { id: 'parquetry', displayName: 'Parquetry' },
  { id: 'geometric', displayName: 'Geometric' },
  { id: 'organic', displayName: 'Organic' },
  { id: 'random', displayName: 'Random' },
  { id: 'roofing', displayName: 'Roofing' },
];
