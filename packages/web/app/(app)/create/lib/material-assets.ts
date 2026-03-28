import type { MaterialAssetRef, MaterialDefinition, MaterialSource } from '@textura/shared';

export function getAssetUrl(asset: MaterialAssetRef | null | undefined): string | null {
  if (!asset?.path) return null;
  return `/api/assets/${asset.path}`;
}

export function getMaterialThumbnailUrl(material: MaterialDefinition | null | undefined): string | null {
  return getAssetUrl(material?.thumbnail);
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
