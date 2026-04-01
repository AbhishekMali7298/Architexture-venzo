import type { MaterialAssetRef, MaterialConfig, MaterialDefinition, MaterialSource } from '@textura/shared';

export interface MaterialAssetSet {
  thumbnail: MaterialAssetRef | null;
  render: MaterialAssetRef | null;
  original: MaterialAssetRef | null;
}

export function getAssetUrl(asset: MaterialAssetRef | null | undefined): string | null {
  if (!asset?.path) return null;
  return `/api/assets/${asset.path}`;
}

/**
 * Keep thumbnail, render, and original asset selection in one place so
 * preview UI, canvas rendering, and export all resolve the same material files.
 */
export function getMaterialAssetSet(
  material: MaterialConfig | null | undefined,
  definition: MaterialDefinition | null | undefined,
): MaterialAssetSet {
  if (!material) {
    return {
      thumbnail: definition?.thumbnail ?? null,
      render: definition?.albedo ?? definition?.thumbnail ?? null,
      original: definition?.albedo ?? definition?.thumbnail ?? null,
    };
  }

  switch (material.source.type) {
    case 'image':
      return {
        thumbnail: definition?.thumbnail ?? material.source.asset,
        render: material.source.asset,
        original: material.source.asset,
      };
    case 'generated':
      return {
        thumbnail: definition?.thumbnail ?? material.source.asset,
        render: material.source.asset ?? definition?.albedo ?? definition?.thumbnail ?? null,
        original: material.source.asset ?? definition?.albedo ?? definition?.thumbnail ?? null,
      };
    case 'library':
      return {
        thumbnail: definition?.thumbnail ?? definition?.albedo ?? null,
        render: definition?.albedo ?? definition?.thumbnail ?? null,
        original: definition?.albedo ?? definition?.thumbnail ?? null,
      };
    case 'upload':
      return {
        thumbnail: definition?.thumbnail ?? null,
        render: definition?.albedo ?? definition?.thumbnail ?? null,
        original: definition?.albedo ?? definition?.thumbnail ?? null,
      };
    default:
      return {
        thumbnail: definition?.thumbnail ?? null,
        render: definition?.albedo ?? definition?.thumbnail ?? null,
        original: definition?.albedo ?? definition?.thumbnail ?? null,
      };
  }
}

export function getMaterialThumbnailUrl(material: MaterialDefinition | null | undefined): string | null {
  return getAssetUrl(material?.thumbnail);
}

export function getMaterialRenderableAsset(
  material: MaterialConfig,
  definition: MaterialDefinition | null | undefined,
): MaterialAssetRef | null {
  return getMaterialAssetSet(material, definition).render;
}

export function getMaterialRenderableImageUrl(
  material: MaterialConfig,
  definition: MaterialDefinition | null | undefined,
): string | null {
  return getAssetUrl(getMaterialRenderableAsset(material, definition));
}

export function getMaterialRenderableColor(source: MaterialSource, fallback = '#b8b0a8'): string {
  switch (source.type) {
    case 'solid':
      return source.color;
    case 'image':
      return source.fallbackColor;
    case 'generated':
      return source.fallbackColor;
    default:
      return fallback;
  }
}
