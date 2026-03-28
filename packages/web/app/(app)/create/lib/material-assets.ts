import type { MaterialAssetRef, MaterialConfig, MaterialDefinition, MaterialSource } from '@textura/shared';

export function getAssetUrl(asset: MaterialAssetRef | null | undefined): string | null {
  if (!asset?.path) return null;
  return `/api/assets/${asset.path}`;
}

export function getMaterialThumbnailUrl(material: MaterialDefinition | null | undefined): string | null {
  return getAssetUrl(material?.thumbnail);
}

export function getMaterialRenderableAsset(
  material: MaterialConfig,
  definition: MaterialDefinition | null | undefined,
): MaterialAssetRef | null {
  switch (material.source.type) {
    case 'image':
      return material.source.asset;
    case 'generated':
      return material.source.asset;
    case 'library':
      return definition?.albedo ?? definition?.thumbnail ?? null;
    default:
      return definition?.albedo ?? definition?.thumbnail ?? null;
  }
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
