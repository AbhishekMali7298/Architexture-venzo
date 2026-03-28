import type { PatternCategory, PatternType, PatternConfig } from '../types/config';

export interface PatternDefinition {
  type: PatternType;
  category: PatternCategory;
  displayName: string;
  description: string;
  previewPath: string;
  previewAssetPath?: string;
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
  {
    type: 'none',
    category: 'random',
    displayName: 'None',
    description: 'Single material field without a repeated layout',
    previewPath: '',
    previewAssetPath: 'patterns/none.svg',
    defaults: { rows: 1, columns: 1, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 1 },
      columns: { min: 1, max: 1 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 1200,
    defaultUnitHeight: 1200,
  },
  // ===== Brick Bond =====
  {
    type: 'running_bond',
    category: 'brick_bond',
    displayName: 'Running Bond',
    description: 'Classic brickwork with each row offset by half',
    previewPath: 'M0,8h40M0,24h40M0,0h10v16H0M10,0h20v16M30,0h10v16 M0,16h20v16M20,16h20v16',
    previewAssetPath: 'patterns/staggered.svg',
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
    previewPath: 'M0,0h40M0,16h40M0,32h40M0,0v32M10,0v32M20,0v32M30,0v32M40,0v32',
    previewAssetPath: 'patterns/stack.svg',
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
    previewPath: 'M0,0h12v10H0M12,0h20v10M32,0h8v10M0,10h8v10M8,10h20v10M28,10h12v10',
    previewAssetPath: 'patterns/flemish.svg',
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
    previewPath: 'M0,0h40M0,10h40M0,20h40M0,30h40M0,0v10M20,0v10M0,10v10M10,10v10M20,10v10M30,10v10',
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
    previewPath: 'M0,0h20v12H0zM20,0h20v12M0,12h10v12M10,12h20v12M30,12h10v12',
    previewAssetPath: 'patterns/stretcher.svg',
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
    previewPath: 'M0,0h8v40H0zM8,0h8v40M16,0h8v40M24,0h8v40M32,0h8v40',
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
    previewPath: 'M0,20h20v20H0M20,0h20v20z',
    previewAssetPath: 'patterns/herringbone.svg',
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
    previewPath: 'M0,0h20v8H0M0,8h8v20M8,28h20v8M28,8h8v20',
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
    previewPath: 'M5,5 Q20,2 35,5 Q38,20 35,35 Q20,38 5,35 Q2,20 5,5z',
    previewAssetPath: 'patterns/roundedRubble.svg',
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
    previewPath: 'M0,0h25v14H0M25,0h15v14M0,14h15v14M15,14h25v14',
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
    previewPath: 'M20,2 L36,12 L36,28 L20,38 L4,28 L4,12z',
    previewAssetPath: 'patterns/hexagonal.svg',
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
    previewPath: 'M0,20 L20,0 L20,10 L0,30z M20,0 L40,20 L40,30 L20,10z',
    previewAssetPath: 'patterns/triangleChevron.svg',
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
    previewPath: 'M0,0h20v20H0M20,0h8v8M20,8h20v20M28,0h12v8',
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
    previewPath: 'M0,0h15v15H0M15,0h25v15M0,15h25v15M25,15h15v25M0,30h25v10M15,15h10v15',
    previewAssetPath: 'patterns/windmill.svg',
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
    previewPath: 'M0,0h20v10H0zM20,0h20v10M10,10h20v10M0,10h10v10M30,10h10v10',
    previewAssetPath: 'patterns/staggered.svg',
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
    previewPath: 'M0,0h15v15H0M15,0h15v15M0,15h15v15M15,15h15v15',
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
    previewPath: 'M20,0 L40,20 L20,40 L0,20z M10,0 L30,20 M0,10 L20,30',
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
    previewPath: 'M10,10h20v20H10M0,0h10v10M30,0h10v10M0,30h10v10M30,30h10v10',
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
    previewPath: 'M0,15 L18,0 L40,8 L32,28 L15,40 L0,25z M18,0 L40,8 M0,15 L15,40',
    previewAssetPath: 'patterns/rubble.svg',
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
