import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout } from '../lib/pattern-layout';
import { fillMaterialSurface } from './material-fill';

function getPreviewBounds(config: TextureConfig, canvasWidth: number, canvasHeight: number) {
  const panelWidth = 336;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);
  const layout = getPatternLayout(config);
  const outputWidth = Math.max(1, layout.totalWidth);
  const outputHeight = Math.max(1, layout.totalHeight);
  const scale = Math.min(availableWidth / outputWidth, availableHeight / outputHeight);
  const width = Math.max(1, outputWidth * scale);
  const height = Math.max(1, outputHeight * scale);

  return {
    x: availableX + (availableWidth - width) / 2,
    y: availableY + (availableHeight - height) / 2,
    width,
    height,
  };
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
  },
) {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#c8c8c8');
  const bounds = getPreviewBounds(config, canvasWidth, canvasHeight);
  const layout = getPatternLayout(config);
  const scale = Math.min(
    bounds.width / Math.max(layout.totalWidth, 1),
    bounds.height / Math.max(layout.totalHeight, 1),
  );
  const frameWidth = layout.totalWidth * scale;
  const frameHeight = layout.totalHeight * scale;
  const jointColor = config.joints.tint ?? '#ffffff';

  ctx.fillStyle = '#eee7dc';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = jointColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const tilesLeft = Math.ceil(bounds.x / Math.max(frameWidth, 1)) + 1;
  const tilesRight = Math.ceil((canvasWidth - bounds.x) / Math.max(frameWidth, 1)) + 1;
  const tilesAbove = Math.ceil(bounds.y / Math.max(frameHeight, 1)) + 1;
  const tilesBelow = Math.ceil((canvasHeight - bounds.y) / Math.max(frameHeight, 1)) + 1;

  for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
    const offsetY = bounds.y + yIndex * frameHeight;
    for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
      const offsetX = bounds.x + xIndex * frameWidth;
      for (const [tileIndex, tile] of layout.tiles.entries()) {
        const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
        fillMaterialSurface(ctx, {
          x: offsetX + shape.bounds.x * scale,
          y: offsetY + shape.bounds.y * scale,
          width: shape.bounds.width * scale,
          height: shape.bounds.height * scale,
          radius: 0,
          fallbackFill,
          image: options?.materialImage,
          tintColor: material.tint,
          clipPath: shape.points.map((point) => ({
            x: offsetX + point.x * scale,
            y: offsetY + point.y * scale,
          })),
          imageDrawBox: {
            x: offsetX + shape.bounds.x * scale,
            y: offsetY + shape.bounds.y * scale,
            width: shape.bounds.width * scale,
            height: shape.bounds.height * scale,
          },
        });
      }
    }
  }

  return {
    x: bounds.x,
    y: bounds.y,
    width: frameWidth,
    height: frameHeight,
  };
}

export function drawDottedBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const transform = ctx.getTransform();
  const scaleX = Math.hypot(transform.a, transform.b) || 1;
  const scaleY = Math.hypot(transform.c, transform.d) || 1;
  const snapX = (value: number) => (Math.round(value * scaleX) + 0.5) / scaleX;
  const snapY = (value: number) => (Math.round(value * scaleY) + 0.5) / scaleY;

  ctx.save();
  ctx.lineWidth = 3;
  ctx.setLineDash([0, 7]);
  ctx.strokeStyle = 'rgba(20,20,20,0.88)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const inset = ctx.lineWidth * 0.5;
  const rx = snapX(x + inset);
  const ry = snapY(y + inset);
  const rw = Math.max(0, Math.round(width - ctx.lineWidth));
  const rh = Math.max(0, Math.round(height - ctx.lineWidth));
  ctx.rect(rx, ry, rw, rh);
  ctx.stroke();
  ctx.restore();
}
