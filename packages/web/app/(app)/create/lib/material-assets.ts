import type {
  ImageAdjustments,
  MaterialAssetRef,
  MaterialConfig,
  MaterialDefinition,
  MaterialSource,
} from '@textura/shared';

export interface MaterialAssetSet {
  thumbnail: MaterialAssetRef | null;
  render: MaterialAssetRef | null;
  original: MaterialAssetRef | null;
}

export function getAssetUrl(asset: MaterialAssetRef | null | undefined): string | null {
  if (!asset?.path) return null;
  // Paths starting with '/' are direct public folder paths (Next.js serves /public/* at root)
  if (asset.path.startsWith('/')) return asset.path;
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

export function getMaterialThumbnailUrl(
  material: MaterialDefinition | null | undefined,
): string | null {
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

export function getMaterialSourceRenderableAsset(source: MaterialSource): MaterialAssetRef | null {
  if (source.type === 'image' || source.type === 'generated') {
    return source.asset ?? null;
  }

  return null;
}

export function getMaterialSourceRenderableImageUrl(source: MaterialSource): string | null {
  return getAssetUrl(getMaterialSourceRenderableAsset(source));
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

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean,
    16,
  );
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b]
    .map((value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return [0, 0, lightness];
  }

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return [hue * 60, saturation, lightness];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  let rgb: [number, number, number] = [0, 0, 0];

  if (segment >= 0 && segment < 1) rgb = [chroma, x, 0];
  else if (segment < 2) rgb = [x, chroma, 0];
  else if (segment < 3) rgb = [0, chroma, x];
  else if (segment < 4) rgb = [0, x, chroma];
  else if (segment < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  const match = l - chroma / 2;
  return rgb.map((value) => (value + match) * 255) as [number, number, number];
}

export function mixHexColors(baseHex: string, tintHex: string, strength: number) {
  const base = hexToRgb(baseHex);
  const tint = hexToRgb(tintHex);
  const mix = Math.max(0, Math.min(1, strength));
  return rgbToHex([
    base[0] + (tint[0] - base[0]) * mix,
    base[1] + (tint[1] - base[1]) * mix,
    base[2] + (tint[2] - base[2]) * mix,
  ]);
}

export function applyImageAdjustmentsToColor(hex: string, adjustments: ImageAdjustments) {
  let [r, g, b] = hexToRgb(hex);

  if (adjustments.invertColors) {
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
  }

  const brightnessDelta = (adjustments.brightness / 100) * 255;
  r += brightnessDelta;
  g += brightnessDelta;
  b += brightnessDelta;

  const contrastFactor =
    (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
  r = contrastFactor * (r - 128) + 128;
  g = contrastFactor * (g - 128) + 128;
  b = contrastFactor * (b - 128) + 128;

  const [initialHue, initialSaturation, lightness] = hexToHsl(rgbToHex([r, g, b]));
  let h = initialHue;
  let s = initialSaturation;
  h += adjustments.hue;
  s = Math.max(0, Math.min(1, s * (1 + adjustments.saturation / 100)));

  return rgbToHex(hslToRgb(h, s, lightness));
}

export function getJointRenderableColor(
  source: MaterialSource,
  tint: string | null | undefined,
  adjustments?: ImageAdjustments,
) {
  if (source.type === 'solid') {
    const baseColor = source.color.toUpperCase();
    const normalizedTint = tint?.toUpperCase() ?? null;
    const solidColor = normalizedTint ?? baseColor;
    return adjustments ? applyImageAdjustmentsToColor(solidColor, adjustments) : solidColor;
  }

  const baseColor = getMaterialRenderableColor(source, '#d4cfc6');
  const normalizedTint = tint?.toUpperCase() ?? null;
  const tintedColor = normalizedTint
    ? mixHexColors(baseColor, normalizedTint, normalizedTint === '#FFFFFF' ? 0.28 : 0.82)
    : baseColor;

  return adjustments ? applyImageAdjustmentsToColor(tintedColor, adjustments) : tintedColor;
}
