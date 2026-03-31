import type { PatternCategory, PatternType, PatternConfig } from '../types/config';

export interface PatternDefinition {
  type: PatternType;
  category: PatternCategory;
  rowColMode: 'grid' | 'module';
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

const ALL_PATTERN_CATALOG: PatternDefinition[] = [
  {
    type: 'none',
    category: 'random',
    rowColMode: 'module',
    displayName: 'None',
    description: 'Single material field without a repeated layout',
    previewPath: '',
    defaults: { rows: 1, columns: 1, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: {
      rows: { min: 1, max: 1 },
      columns: { min: 1, max: 1 },
      angle: { min: 0, max: 0, step: 1 },
    },
    defaultUnitWidth: 1200,
    defaultUnitHeight: 1200,
  },
  {
    type: 'running_bond',
    category: 'brick_bond',
    rowColMode: 'grid',
    displayName: 'Common',
    description: 'Classic brickwork with each row offset by half',
    previewPath: 'M0,8h40M0,24h40M0,0h10v16H0M10,0h20v16M30,0h10v16 M0,16h20v16M20,16h20v16',
    previewAssetPath: 'patterns/running_bond.svg',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 50 }, columns: { min: 1, max: 50 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 215, defaultUnitHeight: 65,
  },
  {
    type: 'stack_bond',
    category: 'brick_bond',
    rowColMode: 'grid',
    displayName: 'Stack',
    description: 'Bricks stacked directly on top of each other',
    previewPath: 'M0,0h40M0,16h40M0,32h40M0,0v32M10,0v32M20,0v32M30,0v32M40,0v32',
    previewAssetPath: 'patterns/stack_bond.svg',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 50 }, columns: { min: 1, max: 50 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 215, defaultUnitHeight: 65,
  },
  {
    type: 'stretcher_bond',
    category: 'brick_bond',
    rowColMode: 'grid',
    displayName: 'Stretcher',
    description: 'All stretchers with variable offset',
    previewPath: 'M0,0h20v12H0zM20,0h20v12M0,12h10v12M10,12h20v12M30,12h10v12',
    previewAssetPath: 'patterns/stretcher_bond.svg',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 50 }, columns: { min: 1, max: 50 }, angle: { min: 0, max: 360, step: 1 }, stretchers: { min: 1, max: 10 } },
    defaultUnitWidth: 400, defaultUnitHeight: 400,
  },
  {
    type: 'flemish_bond',
    category: 'brick_bond',
    rowColMode: 'grid',
    displayName: 'Flemish',
    description: 'Alternating stretchers and headers in each course',
    previewPath: 'M0,0h12v10H0M12,0h20v10M32,0h8v10M0,10h8v10M8,10h20v10M28,10h12v10',
    previewAssetPath: 'patterns/flemish_bond.svg',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 50 }, columns: { min: 1, max: 50 }, angle: { min: 0, max: 360, step: 1 }, stretchers: { min: 1, max: 5 } },
    defaultUnitWidth: 215, defaultUnitHeight: 65,
  },
  {
    type: 'herringbone',
    category: 'paving',
    rowColMode: 'module',
    displayName: 'Herringbone',
    description: 'V-shaped zigzag pattern at 45° or 90°',
    previewPath: 'M0,20h20v20H0M20,0h20v20z',
    previewAssetPath: 'patterns/herringbone.svg',
    defaults: { rows: 8, columns: 8, angle: 45, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 50 }, columns: { min: 2, max: 50 }, angle: { min: 0, max: 90, step: 45 } },
    defaultUnitWidth: 200, defaultUnitHeight: 100,
  },
  {
    type: 'chevron',
    category: 'geometric',
    rowColMode: 'grid',
    displayName: 'Chevron',
    description: 'V-shaped pattern with angled cuts',
    previewPath: 'M0,20 L20,0 L20,10 L0,30z M20,0 L40,20 L40,30 L20,10z',
    previewAssetPath: 'patterns/chevron.svg',
    defaults: { rows: 6, columns: 4, angle: 45, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 50 }, columns: { min: 2, max: 50 }, angle: { min: 15, max: 75, step: 1 } },
    defaultUnitWidth: 400, defaultUnitHeight: 100,
  },
  {
    type: 'staggered',
    category: 'brick_bond',
    rowColMode: 'grid',
    displayName: 'Staggered',
    description: 'Staggered masonry layout',
    previewPath: '',
    previewAssetPath: 'patterns/staggered.svg',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 50 }, columns: { min: 1, max: 50 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 215, defaultUnitHeight: 65,
  },
  {
    type: 'ashlar',
    category: 'paving',
    rowColMode: 'module',
    displayName: 'Ashlar',
    description: 'Cut stone with varying sizes in a coursed pattern',
    previewPath: 'M0,0h25v14H0M25,0h15v14M0,14h15v14M15,14h25v14',
    previewAssetPath: 'patterns/ashlar.svg',
    defaults: { rows: 4, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 30 }, columns: { min: 1, max: 30 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 400, defaultUnitHeight: 200,
  },
  {
    type: 'cubic',
    category: 'geometric',
    rowColMode: 'module',
    displayName: 'Cubic',
    description: 'Isometric cube illusion using interlocking rhombus tiles',
    previewPath: '',
    previewAssetPath: 'patterns/cubic.svg',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 30 }, columns: { min: 2, max: 30 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 180, defaultUnitHeight: 180,
  },
  {
    type: 'hexagonal',
    category: 'geometric',
    rowColMode: 'module',
    displayName: 'Hexagonal',
    description: 'Honeycomb hexagonal tile pattern',
    previewPath: 'M20,2 L36,12 L36,28 L20,38 L4,28 L4,12z',
    previewAssetPath: 'patterns/hexagonal.svg',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 30 }, columns: { min: 2, max: 30 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 150, defaultUnitHeight: 150,
  },
  {
    type: 'basketweave',
    category: 'paving',
    rowColMode: 'module',
    displayName: 'Basketweave',
    description: 'Pairs of bricks alternating horizontal/vertical',
    previewPath: 'M0,0h20v8H0M0,8h8v20M8,28h20v8M28,8h8v20',
    previewAssetPath: 'patterns/basketweave.svg',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 2 },
    parameterRanges: { rows: { min: 2, max: 50 }, columns: { min: 2, max: 50 }, angle: { min: 0, max: 360, step: 1 }, weaves: { min: 1, max: 5 } },
    defaultUnitWidth: 200, defaultUnitHeight: 100,
  },
  {
    type: 'hopscotch',
    category: 'paving',
    rowColMode: 'module',
    displayName: 'Hopscotch',
    description: 'Mixed-size paving in hopscotch arrangement',
    previewPath: '',
    previewAssetPath: 'patterns/hopscotch.svg',
    defaults: { rows: 4, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 20 }, columns: { min: 2, max: 20 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 300, defaultUnitHeight: 300,
  },
  {
    type: 'diamond',
    category: 'geometric',
    rowColMode: 'module',
    displayName: 'Diamond',
    description: 'Diamond shape lattice',
    previewPath: '',
    previewAssetPath: 'patterns/diamond.svg',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 30 }, columns: { min: 2, max: 30 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 180, defaultUnitHeight: 180,
  },
  {
    type: 'intersecting_circle',
    category: 'geometric',
    rowColMode: 'module',
    displayName: 'Circular',
    description: 'Circle lattice with overlapping arcs',
    previewPath: '',
    previewAssetPath: 'patterns/intersecting_circle.svg',
    defaults: { rows: 6, columns: 6, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 30 }, columns: { min: 2, max: 30 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 180, defaultUnitHeight: 180,
  },
  {
    type: 'fishscale',
    category: 'roofing',
    rowColMode: 'module',
    displayName: 'Fishscale',
    description: 'Scaled shingle pattern with rounded edges',
    previewPath: '',
    previewAssetPath: 'patterns/fishscale.svg',
    defaults: { rows: 8, columns: 6, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 2, max: 40 }, columns: { min: 2, max: 40 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 180, defaultUnitHeight: 140,
  },
  {
    type: 'french',
    category: 'brick_bond',
    rowColMode: 'grid',
    displayName: 'French',
    description: 'French bond style masonry layout',
    previewPath: '',
    previewAssetPath: 'patterns/french.svg',
    defaults: { rows: 6, columns: 4, angle: 0, stretchers: 1, weaves: 1 },
    parameterRanges: { rows: { min: 1, max: 50 }, columns: { min: 1, max: 50 }, angle: { min: 0, max: 360, step: 1 } },
    defaultUnitWidth: 215, defaultUnitHeight: 65,
  }
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
  { id: 'geometric', displayName: 'Geometric' },
  { id: 'roofing', displayName: 'Roofing' },
];
