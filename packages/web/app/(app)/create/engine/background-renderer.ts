import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getMaterialRenderableColor } from '../lib/material-assets';
import { fillMaterialSurface } from './material-fill';

function getPreviewBounds(config: TextureConfig, canvasWidth: number, canvasHeight: number) {
  const panelWidth = 336;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);
  const outputWidth = Math.max(1, config.output.widthPx);
  const outputHeight = Math.max(1, config.output.heightPx);
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

  ctx.fillStyle = '#eee7dc';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.shadowColor = 'rgba(41, 31, 20, 0.18)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  fillMaterialSurface(ctx, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    radius: 0,
    fallbackFill,
    image: options?.materialImage,
    tintColor: material.tint,
  });
  ctx.restore();

  return bounds;
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
