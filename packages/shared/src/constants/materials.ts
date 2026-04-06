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
    id: 'graphite',
    name: 'Graphite',
    categoryId: 'stone',
    swatchColor: '#4a4a4a',
    thumbPath: '/materials/graphite.jpg',
    width: 400,
    height: 200,
    finish: 'honed',
    toneVariation: 15,
    featured: true,
  }),
  imageMaterial({
    id: 'green-marble',
    name: 'Green Marble',
    categoryId: 'stone',
    swatchColor: '#495652',
    thumbPath: '/materials/green-marble.jpg',
    width: 400,
    height: 400,
    finish: 'polished',
    toneVariation: 22,
    featured: true,
  }),
  imageMaterial({
    id: 'limestone',
    name: 'Limestone',
    categoryId: 'stone',
    swatchColor: '#d4cab9',
    thumbPath: '/materials/limestone.jpg',
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
    thumbPath: '/materials/travertine.jpg',
    width: 400,
    height: 200,
    finish: 'filled',
    toneVariation: 28,
    featured: true,
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

export function getMaterialBySource(source: MaterialSource): MaterialDefinition | undefined {
  if (source.type === 'library') {
    return getMaterialById(source.assetId);
  }

  if (source.type !== 'image' && source.type !== 'generated') {
    return undefined;
  }

  const assetPath = source.asset?.path;
  if (!assetPath) return undefined;

  return MATERIAL_LIBRARY.find((material) => {
    return material.albedo?.path === assetPath || material.thumbnail?.path === assetPath;
  });
}
