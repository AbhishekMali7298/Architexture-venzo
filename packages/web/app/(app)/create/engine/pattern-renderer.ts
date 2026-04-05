import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternStroke, type PatternTile } from './pattern-layouts';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { fillMaterialSurface, tracePolygonPath, traceRoundedRectPath } from './material-fill';
import { computePatternRenderFrame, getTileRenderBox } from './render-geometry';
import { drawJointRelief } from './joint-relief';
import type { EdgeProfileData } from '../lib/edge-style-assets';

export interface RenderedJoint {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

export interface PatternLayout {
  tiles: PatternTile[];
  strokes: PatternStroke[];
  joints: RenderedJoint[];
  totalWidth: number;
  totalHeight: number;
  repeatWidth?: number;
  repeatHeight?: number;
  repeatOffsetX?: number;
  repeatOffsetY?: number;
}

// Mulberry32 — fast, seedable, good distribution
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tileSeed(masterSeed: number, tileX: number, tileY: number): number {
  // Hash tile position to a stable per-tile seed.
  const ix = Math.round(tileX * 100) | 0;
  const iy = Math.round(tileY * 100) | 0;
  return (masterSeed ^ (ix * 65537 + iy * 4099)) >>> 0;
}

export function computePatternLayout(config: TextureConfig): PatternLayout {
  const layout = getPatternLayout(config);
  return { ...layout, joints: [] };
}

export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointMaterialImage?: CanvasImageSource | null;
    edgeProfiles?: EdgeProfileData[] | null;
  },
): void {
  const frame = computePatternRenderFrame(config, canvasWidth, canvasHeight);
  const layout = { ...frame.layout, joints: [] };
  const { repeatWidth, repeatHeight, scale, offsetX, offsetY, drawOffsetX, drawOffsetY, verticalOrientation } = frame;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const jointColor = getJointRenderableColor(config.joints.materialSource, config.joints.tint, config.joints.adjustments);
  const effectiveJointColor = jointColor;
  fillMaterialSurface(ctx, {
    x: offsetX,
    y: offsetY,
    width: repeatWidth * scale,
    height: repeatHeight * scale,
    radius: 0,
    fallbackFill: effectiveJointColor,
    image: options?.jointMaterialImage,
    tintColor: config.joints.tint,
  });

  ctx.save();
  ctx.beginPath();
  ctx.rect(offsetX, offsetY, repeatWidth * scale, repeatHeight * scale);
  ctx.clip();
  ctx.translate(offsetX, offsetY);
  if (verticalOrientation) {
    ctx.translate(repeatWidth * scale, 0);
    ctx.rotate(Math.PI / 2);
  }

  const traceTilePath = (
    clipPath: ReadonlyArray<{ x: number; y: number }> | undefined,
    tileX: number,
    tileY: number,
    tileWidth: number,
    tileHeight: number,
    cornerRadius: number,
  ) => {
    if (clipPath?.length) {
      tracePolygonPath(ctx, clipPath);
      return;
    }

    if (cornerRadius > 0) {
      traceRoundedRectPath(ctx, tileX, tileY, tileWidth, tileHeight, cornerRadius);
      return;
    }

    ctx.beginPath();
    ctx.rect(tileX, tileY, tileWidth, tileHeight);
    ctx.closePath();
  };

  for (const tile of layout.tiles) {
    const material = config.materials[tile.materialIndex] ?? config.materials[0]!;
    const selectedMaterial = material.definitionId ? getMaterialById(material.definitionId) : null;
    const baseColor = getMaterialRenderableColor(material.source, selectedMaterial?.swatchColor ?? '#b0a090');
    const variation = material.toneVariation;
    const variationRatio = Math.max(0, Math.min(1, variation / 100));

    // Per-tile stable RNG — same config always produces the same output
    const tileRng = mulberry32(tileSeed(config.seed, tile.x, tile.y));
    // Keep tonal shifts subtle even at max so material appears naturally varied,
    // not patchy or globally darkened.
    const tileColor = adjustBrightness(baseColor, (tileRng() - 0.5) * variationRatio * 0.08);

    ctx.save();
    ctx.translate(drawOffsetX + tile.x * scale, drawOffsetY + tile.y * scale);
    if (tile.rotation !== 0) {
      ctx.translate((tile.width * scale) / 2, (tile.height * scale) / 2);
      ctx.rotate((tile.rotation * Math.PI) / 180);
      ctx.translate(-(tile.width * scale) / 2, -(tile.height * scale) / 2);
    }

    const { tileX, tileY, tileWidth, tileHeight, cornerRadius, clipPath } = getTileRenderBox(tile, config, scale, {
      edgeProfiles: options?.edgeProfiles,
    });

    // Use per-tile random crop so each tile shows a different region of the
    // source material image — prevents the stamped/tiled look.
    const randomCropFraction = options?.materialImage
      ? { x: tileRng(), y: tileRng() }
      : undefined;

    fillMaterialSurface(ctx, {
      x: tileX,
      y: tileY,
      width: tileWidth,
      height: tileHeight,
      radius: cornerRadius,
      fallbackFill: tileColor,
      image: options?.materialImage,
      tintColor: material.tint ?? undefined,
      clipPath,
      randomCropFraction,
    });

    if (options?.materialImage) {
      const variationDelta = (tileRng() - 0.5) * 2;
      const variationStrength = Math.min(0.08, variationRatio * (0.01 + Math.abs(variationDelta) * 0.06));
      if (variationStrength > 0.001) {
        ctx.save();
        traceTilePath(clipPath, tileX, tileY, tileWidth, tileHeight, cornerRadius);
        ctx.clip();
        ctx.fillStyle = variationDelta >= 0 ? '#ffffff' : '#000000';
        ctx.globalAlpha = variationStrength;
        ctx.fillRect(tileX, tileY, tileWidth, tileHeight);
        ctx.fillStyle = tileRng() > 0.5 ? '#ffffff' : '#000000';
        ctx.globalAlpha = Math.min(0.12, variationStrength * 0.7);
        ctx.fillRect(tileX, tileY, tileWidth, tileHeight);
        ctx.restore();
      }
    }

    if (material.edges.style !== 'none' && !tile.skipEdgeStroke) {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      traceTilePath(clipPath, tileX, tileY, tileWidth, tileHeight, cornerRadius);
      ctx.stroke();
    }

    drawJointRelief(ctx, {
      tracePath: () => traceTilePath(clipPath, tileX, tileY, tileWidth, tileHeight, cornerRadius),
      x: tileX,
      y: tileY,
      width: tileWidth,
      height: tileHeight,
      scale,
      shadowOpacity: config.joints.shadowOpacity,
      recess: config.joints.recess,
      concave: config.joints.concave,
    });

    if (variationRatio > 0.35) {
      ctx.globalAlpha = 0.01 + variationRatio * 0.02;
      for (let i = 0; i < 20; i++) {
        const nx = tileX + tileRng() * tileWidth;
        const ny = tileY + tileRng() * tileHeight;
        const size = 1 + tileRng() * 3;
        ctx.fillStyle = tileRng() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(nx, ny, size, size);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  if (layout.strokes.length > 0) {
    ctx.save();
    ctx.strokeStyle = effectiveJointColor;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const stroke of layout.strokes) {
      ctx.lineWidth = stroke.width
        ? Math.max(1, stroke.width * scale)
        : Math.max(1, ((config.joints.horizontalSize + config.joints.verticalSize) / 2) * scale);
      traceStrokePath(ctx, stroke, scale, drawOffsetX, drawOffsetY);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(100, 140, 240, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX - 2, offsetY - 2, repeatWidth * scale + 4, repeatHeight * scale + 4);
  ctx.setLineDash([]);
}

function traceStrokePath(
  ctx: CanvasRenderingContext2D,
  stroke: PatternStroke,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  if (!stroke.points.length) return;
  ctx.beginPath();
  ctx.moveTo(offsetX + stroke.points[0].x * scale, offsetY + stroke.points[0].y * scale);
  for (let index = 1; index < stroke.points.length; index++) {
    const point = stroke.points[index]!;
    ctx.lineTo(offsetX + point.x * scale, offsetY + point.y * scale);
  }
  if (stroke.closed) ctx.closePath();
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + Math.round(amount * 255)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + Math.round(amount * 255)));
  const b = Math.max(0, Math.min(255, (num & 0xff) + Math.round(amount * 255)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ─── Debounced render scheduler ───────────────────────────────────────────────
// Ensures canvas renders never block the UI thread. Call this instead of
// renderToCanvas() directly when wiring to reactive state changes.

let _renderTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleRender(
  canvas: HTMLCanvasElement,
  config: TextureConfig,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointMaterialImage?: CanvasImageSource | null;
    edgeProfiles?: import('../lib/edge-style-assets').EdgeProfileData[] | null;
  },
): void {
  if (_renderTimer !== null) clearTimeout(_renderTimer);
  _renderTimer = setTimeout(() => {
    _renderTimer = null;
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderToCanvas(ctx, config, canvas.width, canvas.height, options);
    });
  }, 16);
}
