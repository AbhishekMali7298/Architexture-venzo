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

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
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
  const rng = seededRandom(config.seed);
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
    const tileColor = adjustBrightness(baseColor, (rng() - 0.5) * variation * 0.4);

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
    fillMaterialSurface(ctx, {
      x: tileX,
      y: tileY,
      width: tileWidth,
      height: tileHeight,
      radius: cornerRadius,
      fallbackFill: tileColor,
      image: options?.materialImage,
      clipPath,
    });

    if (options?.materialImage) {
      const variationDelta = (rng() - 0.5) * variation * 1.2;
      const variationStrength = Math.min(0.16, 0.02 + Math.abs(variationDelta) / 140);
      if (variationStrength > 0.001) {
        ctx.save();
        traceTilePath(clipPath, tileX, tileY, tileWidth, tileHeight, cornerRadius);
        ctx.clip();
        ctx.fillStyle = variationDelta >= 0 ? '#ffffff' : '#000000';
        ctx.globalAlpha = variationStrength;
        ctx.fillRect(tileX, tileY, tileWidth, tileHeight);
        ctx.fillStyle = rng() > 0.5 ? '#ffffff' : '#000000';
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

    if (variation > 10) {
      ctx.globalAlpha = 0.03 + (variation / 100) * 0.05;
      for (let i = 0; i < 20; i++) {
        const nx = tileX + rng() * tileWidth;
        const ny = tileY + rng() * tileHeight;
        const size = 1 + rng() * 3;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
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

  const shadowOpacity = config.joints.shadowOpacity / 100;
  if (shadowOpacity > 0 && (config.joints.recess || config.joints.concave)) {
    ctx.strokeStyle = `rgba(0,0,0,${shadowOpacity * 0.4})`;
    ctx.lineWidth = Math.max(1, config.joints.horizontalSize * scale * 0.5);

    for (const tile of layout.tiles) {
      const tileX = drawOffsetX + tile.x * scale + (config.joints.verticalSize * scale) / 2;
      const tileY = drawOffsetY + tile.y * scale + (config.joints.horizontalSize * scale) / 2;
      const tileWidth = tile.width * scale - config.joints.verticalSize * scale;
      const tileHeight = tile.height * scale - config.joints.horizontalSize * scale;

      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileHeight + 1);
      ctx.lineTo(tileX + tileWidth, tileY + tileHeight + 1);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tileX + tileWidth + 1, tileY);
      ctx.lineTo(tileX + tileWidth + 1, tileY + tileHeight);
      ctx.stroke();
    }
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
