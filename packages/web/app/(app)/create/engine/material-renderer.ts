import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getMaterialRenderableColor } from '../lib/material-assets';
import { getStackLayout } from '../lib/stack-pattern';
import { fillMaterialSurface } from './material-fill';

export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    backgroundFill?: string;
  },
): void {
  const material = config.materials[0];
  if (!material) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#c8c8c8');
  const layout = getStackLayout(config);
  const jointColor = config.joints.tint ?? '#ffffff';

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (options?.backgroundFill) {
    ctx.fillStyle = options.backgroundFill;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const scale = Math.min(
    canvasWidth / Math.max(layout.totalWidth, 1),
    canvasHeight / Math.max(layout.totalHeight, 1),
  );
  const drawWidth = layout.totalWidth * scale;
  const drawHeight = layout.totalHeight * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  ctx.fillStyle = jointColor;
  ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);

  for (const tile of layout.tiles) {
    fillMaterialSurface(ctx, {
      x: offsetX + tile.x * scale,
      y: offsetY + tile.y * scale,
      width: tile.width * scale,
      height: tile.height * scale,
      radius: 0,
      fallbackFill,
      image: options?.materialImage,
      tintColor: material.tint,
    });
  }
}

let renderTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleRender(
  canvas: HTMLCanvasElement,
  config: TextureConfig,
  options?: {
    materialImage?: CanvasImageSource | null;
    backgroundFill?: string;
  },
): void {
  if (renderTimer !== null) {
    clearTimeout(renderTimer);
  }

  renderTimer = setTimeout(() => {
    renderTimer = null;
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderToCanvas(ctx, config, canvas.width, canvas.height, options);
    });
  }, 16);
}
