import type { MaterialAssetRef, MaterialSource } from '../types/config';

export type MaterialDefinitionSourceType = 'solid' | 'image' | 'upload' | 'generated';
export type MaterialMapType = 'thumbnail' | 'albedo' | 'bump' | 'normal' | 'roughness';

export interface MaterialDefinition {
  id: string;
  name: string;
  categoryId: string;
  sourceType: MaterialDefinitionSourceType;
  swatchColor: string;
  thumbnail: MaterialAssetRef | null;
  albedo: MaterialAssetRef | null;
  bump: MaterialAssetRef | null;
  normal: MaterialAssetRef | null;
  roughness: MaterialAssetRef | null;
  defaults: {
    width: number;
    height: number;
  };
  metadata?: {
    finish?: string;
    toneVariation?: number;
    featured?: boolean;
  };
  source: MaterialSource;
}

export interface MaterialCategory {
  id: string;
  displayName: string;
  icon: string;
  description: string;
}

function jpgAsset(path: string, size?: number): MaterialAssetRef {
  return {
    path,
    mimeType: 'image/jpeg',
    ...(size ? { width: size, height: size } : {}),
  };
}

function imageMaterial(options: {
  id: string;
  name: string;
  categoryId: string;
  swatchColor: string;
  thumbPath: string;
  albedoPath?: string;
  width: number;
  height: number;
  finish?: string;
  toneVariation?: number;
  featured?: boolean;
}): MaterialDefinition {
  const thumbnail = jpgAsset(options.thumbPath);
  const albedo = jpgAsset(options.albedoPath ?? options.thumbPath);
  const metadata =
    options.finish !== undefined || options.toneVariation !== undefined || options.featured !== undefined
      ? {
          ...(options.finish !== undefined ? { finish: options.finish } : {}),
          ...(options.toneVariation !== undefined ? { toneVariation: options.toneVariation } : {}),
          ...(options.featured !== undefined ? { featured: options.featured } : {}),
        }
      : null;

  return {
    id: options.id,
    name: options.name,
    categoryId: options.categoryId,
    sourceType: 'image',
    swatchColor: options.swatchColor,
    thumbnail,
    albedo,
    bump: null,
    normal: null,
    roughness: null,
    defaults: {
      width: options.width,
      height: options.height,
    },
    ...(metadata ? { metadata } : {}),
    source: {
      type: 'image',
      asset: albedo,
      fallbackColor: options.swatchColor,
    },
  };
}

/**
 * Material category definitions used by the Create editor.
 */
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
  GENERATED: 'generated',
} as const;

export const MATERIAL_LIBRARY: MaterialDefinition[] = [
  imageMaterial({
    id: 'granite',
    name: 'Granite',
    categoryId: 'stone',
    swatchColor: '#d8d9d4',
    thumbPath: 'materials/granite/granite thumb.jpg',
    albedoPath: 'materials/granite/granite-oriiginal.jpg',
    width: 400,
    height: 100,
    finish: 'split-face',
    toneVariation: 42,
    featured: true,
  }),
  imageMaterial({
    id: 'limestone',
    name: 'Limestone',
    categoryId: 'stone',
    swatchColor: '#d4cab9',
    thumbPath: 'materials/33/thumb_200.jpg',
    width: 400,
    height: 200,
    finish: 'honed',
    toneVariation: 24,
    featured: true,
  }),
  imageMaterial({
    id: 'travertine',
    name: 'Travertine',
    categoryId: 'stone',
    swatchColor: '#ddd4c1',
    thumbPath: 'materials/15/thumb_200.jpg',
    width: 400,
    height: 200,
    finish: 'filled',
    toneVariation: 28,
    featured: true,
  }),
  imageMaterial({
    id: 'white_marble',
    name: 'White Marble',
    categoryId: 'stone',
    swatchColor: '#e9e9ea',
    thumbPath: 'materials/82/thumb_200.jpg',
    width: 400,
    height: 400,
    finish: 'polished',
    toneVariation: 12,
    featured: true,
  }),
  imageMaterial({
    id: 'flagstone',
    name: 'Flagstone',
    categoryId: 'stone',
    swatchColor: '#6f7971',
    thumbPath: 'materials/97/thumb_200.jpg',
    width: 450,
    height: 450,
    finish: 'cleft',
    toneVariation: 18,
    featured: true,
  }),
  imageMaterial({
    id: 'reconstituted_stone',
    name: 'Reconstituted Stone',
    categoryId: 'stone',
    swatchColor: '#d7d3c8',
    thumbPath: 'materials/92/thumb_200.jpg',
    width: 400,
    height: 200,
    finish: 'cast',
    toneVariation: 16,
  }),
  imageMaterial({
    id: 'slate',
    name: 'Slate',
    categoryId: 'stone',
    swatchColor: '#5d6770',
    thumbPath: 'materials/101/thumb_200.jpg',
    width: 300,
    height: 300,
    finish: 'cleft',
    toneVariation: 30,
  }),
  imageMaterial({
    id: 'blonde_sandstone',
    name: 'Blonde Sandstone',
    categoryId: 'stone',
    swatchColor: '#d4b89f',
    thumbPath: 'materials/90/thumb_200.jpg',
    width: 450,
    height: 300,
    finish: 'sawn',
    toneVariation: 18,
  }),
  imageMaterial({
    id: 'basalt',
    name: 'Basalt',
    categoryId: 'stone',
    swatchColor: '#4b4b4c',
    thumbPath: 'materials/98/thumb_200.jpg',
    width: 300,
    height: 300,
    finish: 'flamed',
    toneVariation: 14,
  }),
  imageMaterial({
    id: 'green_marble',
    name: 'Green Marble',
    categoryId: 'stone',
    swatchColor: '#495652',
    thumbPath: 'materials/40/thumb_200.jpg',
    width: 400,
    height: 400,
    finish: 'polished',
    toneVariation: 22,
  }),
  imageMaterial({
    id: 'orange_onyx',
    name: 'Orange Onyx',
    categoryId: 'stone',
    swatchColor: '#d39c72',
    thumbPath: 'materials/93/thumb_200.jpg',
    width: 400,
    height: 400,
    finish: 'polished',
    toneVariation: 26,
  }),
  imageMaterial({
    id: 'pink_granite',
    name: 'Pink Granite',
    categoryId: 'stone',
    swatchColor: '#b68265',
    thumbPath: 'materials/2/thumb_200.jpg',
    width: 300,
    height: 300,
    finish: 'flamed',
    toneVariation: 20,
  }),
  imageMaterial({
    id: 'terracotta',
    name: 'Terracotta',
    categoryId: 'tile',
    swatchColor: '#a75d45',
    thumbPath: 'materials/48/thumb_200.jpg',
    width: 200,
    height: 200,
    finish: 'matte',
    toneVariation: 20,
  }),
];

export function getMaterialCategory(id: string): MaterialCategory | undefined {
  return MATERIAL_CATEGORIES.find((category) => category.id === id);
}

export function getMaterialsByCategory(categoryId: string): MaterialDefinition[] {
  return MATERIAL_LIBRARY.filter((material) => material.categoryId === categoryId);
}

export function getMaterialById(id: string): MaterialDefinition | undefined {
  return MATERIAL_LIBRARY.find((material) => material.id === id);
}
