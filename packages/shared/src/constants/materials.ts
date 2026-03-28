/**
 * Material category definitions matching the 17+ categories
 * observed on Architextures.org.
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

/**
 * Get a material category by its ID.
 */
export function getMaterialCategory(id: string): MaterialCategory | undefined {
  return MATERIAL_CATEGORIES.find((c) => c.id === id);
}
