export interface MaterialDefinition {
  id: string;
  name: string;
  categoryId: string;
  swatchColor: string;
  thumbnail: {
    kind: 'swatch';
    color: string;
  };
  source: {
    kind: 'solid';
    color: string;
  };
  defaults: {
    width: number;
    height: number;
  };
  metadata?: {
    finish?: string;
    toneVariation?: number;
  };
}

/**
 * Material category definitions used by the Create editor.
 */

export interface MaterialCategory {
  id: string;
  displayName: string;
  icon: string;
  description: string;
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'stone', displayName: 'Stone', icon: '🪨', description: 'Natural and cut stone materials' },
  { id: 'brick', displayName: 'Brick', icon: '🧱', description: 'Clay and concrete bricks' },
  { id: 'wood', displayName: 'Wood', icon: '🪵', description: 'Timber, planks, and wood finishes' },
  { id: 'terrazzo', displayName: 'Terrazzo', icon: '⬡', description: 'Composite terrazzo materials' },
  { id: 'concrete', displayName: 'Concrete', icon: '🏗️', description: 'Concrete and cement finishes' },
  { id: 'metal', displayName: 'Metal', icon: '⚙️', description: 'Metal surfaces and panels' },
  { id: 'tile', displayName: 'Tile', icon: '🔲', description: 'Ceramic and porcelain tiles' },
  { id: 'fabric', displayName: 'Fabric', icon: '🧵', description: 'Textile and fabric materials' },
  { id: 'wallpaper', displayName: 'Wallpaper', icon: '🎨', description: 'Wallpaper and wall coverings' },
  { id: 'carpet', displayName: 'Carpet', icon: '🟫', description: 'Carpet and floor coverings' },
  { id: 'surfaces', displayName: 'Surfaces', icon: '📐', description: 'Engineered surfaces' },
  { id: 'finishes', displayName: 'Finishes', icon: '✨', description: 'Surface finishes and coatings' },
  { id: 'landscaping', displayName: 'Landscaping', icon: '🌿', description: 'Outdoor landscaping materials' },
  { id: 'insulation', displayName: 'Insulation', icon: '🧊', description: 'Insulation materials' },
  { id: 'organic', displayName: 'Organic', icon: '🍂', description: 'Natural organic materials' },
  { id: 'acoustic', displayName: 'Acoustic', icon: '🔇', description: 'Acoustic treatment materials' },
  { id: 'architecture', displayName: 'Architecture', icon: '🏛️', description: 'Architectural finishes' },
];

/**
 * Special material source types (not categories).
 */
export const SPECIAL_SOURCES = {
  SOLID_FILL: 'solid',
  UPLOAD: 'upload',
} as const;

export const MATERIAL_LIBRARY: MaterialDefinition[] = [
  {
    id: 'granite',
    name: 'Granite',
    categoryId: 'stone',
    swatchColor: '#a0a0a0',
    thumbnail: { kind: 'swatch', color: '#a0a0a0' },
    source: { kind: 'solid', color: '#a0a0a0' },
    defaults: { width: 300, height: 300 },
    metadata: { finish: 'split-face', toneVariation: 42 },
  },
  {
    id: 'limestone',
    name: 'Limestone',
    categoryId: 'stone',
    swatchColor: '#c8c0b0',
    thumbnail: { kind: 'swatch', color: '#c8c0b0' },
    source: { kind: 'solid', color: '#c8c0b0' },
    defaults: { width: 400, height: 200 },
    metadata: { finish: 'honed', toneVariation: 24 },
  },
  {
    id: 'travertine',
    name: 'Travertine',
    categoryId: 'stone',
    swatchColor: '#d4c8a0',
    thumbnail: { kind: 'swatch', color: '#d4c8a0' },
    source: { kind: 'solid', color: '#d4c8a0' },
    defaults: { width: 400, height: 200 },
    metadata: { finish: 'filled', toneVariation: 28 },
  },
  {
    id: 'slate',
    name: 'Slate',
    categoryId: 'stone',
    swatchColor: '#606870',
    thumbnail: { kind: 'swatch', color: '#606870' },
    source: { kind: 'solid', color: '#606870' },
    defaults: { width: 300, height: 300 },
    metadata: { finish: 'cleft', toneVariation: 36 },
  },
  {
    id: 'red_brick',
    name: 'Red Brick',
    categoryId: 'brick',
    swatchColor: '#b06048',
    thumbnail: { kind: 'swatch', color: '#b06048' },
    source: { kind: 'solid', color: '#b06048' },
    defaults: { width: 215, height: 65 },
    metadata: { finish: 'wirecut', toneVariation: 34 },
  },
  {
    id: 'yellow_brick',
    name: 'Yellow Brick',
    categoryId: 'brick',
    swatchColor: '#d4b870',
    thumbnail: { kind: 'swatch', color: '#d4b870' },
    source: { kind: 'solid', color: '#d4b870' },
    defaults: { width: 215, height: 65 },
    metadata: { finish: 'stock', toneVariation: 31 },
  },
  {
    id: 'concrete_block',
    name: 'Concrete Block',
    categoryId: 'concrete',
    swatchColor: '#909090',
    thumbnail: { kind: 'swatch', color: '#909090' },
    source: { kind: 'solid', color: '#909090' },
    defaults: { width: 400, height: 200 },
    metadata: { finish: 'ground-face', toneVariation: 18 },
  },
  {
    id: 'oak',
    name: 'Oak',
    categoryId: 'wood',
    swatchColor: '#c09060',
    thumbnail: { kind: 'swatch', color: '#c09060' },
    source: { kind: 'solid', color: '#c09060' },
    defaults: { width: 600, height: 70 },
    metadata: { finish: 'oiled', toneVariation: 30 },
  },
  {
    id: 'walnut',
    name: 'Walnut',
    categoryId: 'wood',
    swatchColor: '#704830',
    thumbnail: { kind: 'swatch', color: '#704830' },
    source: { kind: 'solid', color: '#704830' },
    defaults: { width: 600, height: 70 },
    metadata: { finish: 'satin', toneVariation: 26 },
  },
  {
    id: 'pine',
    name: 'Pine',
    categoryId: 'wood',
    swatchColor: '#d4b070',
    thumbnail: { kind: 'swatch', color: '#d4b070' },
    source: { kind: 'solid', color: '#d4b070' },
    defaults: { width: 600, height: 95 },
    metadata: { finish: 'brushed', toneVariation: 22 },
  },
  {
    id: 'white_ceramic',
    name: 'White Ceramic',
    categoryId: 'tile',
    swatchColor: '#f0f0f0',
    thumbnail: { kind: 'swatch', color: '#f0f0f0' },
    source: { kind: 'solid', color: '#f0f0f0' },
    defaults: { width: 200, height: 100 },
    metadata: { finish: 'gloss', toneVariation: 8 },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    categoryId: 'tile',
    swatchColor: '#c87848',
    thumbnail: { kind: 'swatch', color: '#c87848' },
    source: { kind: 'solid', color: '#c87848' },
    defaults: { width: 200, height: 200 },
    metadata: { finish: 'matte', toneVariation: 20 },
  },
  {
    id: 'cement_tile',
    name: 'Cement Tile',
    categoryId: 'tile',
    swatchColor: '#b0b0b0',
    thumbnail: { kind: 'swatch', color: '#b0b0b0' },
    source: { kind: 'solid', color: '#b0b0b0' },
    defaults: { width: 200, height: 200 },
    metadata: { finish: 'matt-sealed', toneVariation: 16 },
  },
];

/**
 * Get a material category by its ID.
 */
export function getMaterialCategory(id: string): MaterialCategory | undefined {
  return MATERIAL_CATEGORIES.find((c) => c.id === id);
}

export function getMaterialsByCategory(categoryId: string): MaterialDefinition[] {
  return MATERIAL_LIBRARY.filter((material) => material.categoryId === categoryId);
}

export function getMaterialById(id: string): MaterialDefinition | undefined {
  return MATERIAL_LIBRARY.find((material) => material.id === id);
}
