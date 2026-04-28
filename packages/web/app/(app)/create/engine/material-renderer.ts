import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout } from '../lib/pattern-layout';
import { fillMaterialSurface } from './material-fill';

export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
    backgroundFill?: string;
  },
): void {
  const material = config.materials[0];
  if (!material) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(
    material.source,
    definition?.swatchColor ?? '#c8c8c8',
  );
  const layout = getPatternLayout(config);
  const jointFill = getJointRenderableColor(
    config.joints.materialSource,
    config.joints.tint,
    config.joints.adjustments,
  );

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

  fillMaterialSurface(ctx, {
    x: offsetX,
    y: offsetY,
    width: drawWidth,
    height: drawHeight,
    radius: 0,
    fallbackFill: jointFill,
    image: options?.jointImage,
    tintColor: config.joints.tint,
  });

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

let renderTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleRender(
  canvas: HTMLCanvasElement,
  config: TextureConfig,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
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
