import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getMaterialRenderableColor } from '../lib/material-assets';
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

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (options?.backgroundFill) {
    ctx.fillStyle = options.backgroundFill;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  fillMaterialSurface(ctx, {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    radius: 0,
    fallbackFill,
    image: options?.materialImage,
    tintColor: material.tint,
  });
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
