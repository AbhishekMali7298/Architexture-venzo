import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout } from '../lib/pattern-layout';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';
import { fillMaterialSurface } from './material-fill';
import {
  drawEmbossEffect,
  drawEmbossStrokeEffect,
  drawPatternStrokes,
  shouldDrawEmbossStrokeOutline,
} from './background-renderer';
import { supportsEmbossPattern } from '../lib/pattern-capabilities';

function getPatternRepeatPhases(config: TextureConfig, repeatWidth: number, repeatHeight: number) {
  if (config.pattern.type !== 'venzowood') {
    return [{ x: 0, y: 0 }];
  }

  return [
    { x: 0, y: 0 },
    { x: repeatWidth / 2, y: repeatHeight / 2 },
  ];
}

export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
    backgroundFill?: string;
    embossMode?: boolean;
    embossStrength?: number;
    svgPatternModule?: SvgPatternModule | null;
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
  const layout = getPatternLayout(config, options?.svgPatternModule ?? null);
  const jointFill = getJointRenderableColor(
    config.joints.materialSource,
    undefined,
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

  const baseWidth = (layout.totalWidth / Math.max(1, config.pattern.columns)) * scale;
  const baseHeight = (layout.totalHeight / Math.max(1, config.pattern.rows)) * scale;
  const worldImageDrawBox = {
    x: offsetX,
    y: offsetY,
    width: baseWidth,
    height: baseHeight,
  };

  fillMaterialSurface(ctx, {
    x: offsetX,
    y: offsetY,
    width: drawWidth,
    height: drawHeight,
    radius: 0,
    fallbackFill: jointFill,
    image: options?.jointImage,
    imageDrawBox: worldImageDrawBox,
  });

  const shouldRenderEmboss = options?.embossMode && supportsEmbossPattern(config.pattern.type);
  const strength = (options?.embossStrength ?? 100) / 100;
  const repeatPhases = getPatternRepeatPhases(config, drawWidth, drawHeight);

  if (repeatPhases.length > 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(offsetX, offsetY, drawWidth, drawHeight);
    ctx.clip();

    for (const phase of repeatPhases) {
      for (let row = -1; row <= 1; row++) {
        const instanceOffsetY = offsetY + phase.y + row * drawHeight;
        for (let column = -1; column <= 1; column++) {
          const instanceOffsetX = offsetX + phase.x + column * drawWidth;

          for (const [tileIndex, tile] of layout.tiles.entries()) {
            const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
            fillMaterialSurface(ctx, {
              x: instanceOffsetX + shape.bounds.x * scale,
              y: instanceOffsetY + shape.bounds.y * scale,
              width: shape.bounds.width * scale,
              height: shape.bounds.height * scale,
              radius: 0,
              fallbackFill,
              image: options?.materialImage,
              clipPath: shape.points.map((point) => ({
                x: instanceOffsetX + point.x * scale,
                y: instanceOffsetY + point.y * scale,
              })),
              imageDrawBox: worldImageDrawBox,
            });
          }

          if (shouldRenderEmboss) {
            drawEmbossEffect(ctx, instanceOffsetX, instanceOffsetY, scale, layout.tiles, strength);
            drawEmbossStrokeEffect(
              ctx,
              instanceOffsetX,
              instanceOffsetY,
              scale,
              layout.strokes,
              strength,
            );
            if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes)) {
              drawPatternStrokes(ctx, instanceOffsetX, instanceOffsetY, scale, layout.strokes);
            }
          } else {
            drawPatternStrokes(ctx, instanceOffsetX, instanceOffsetY, scale, layout.strokes);
          }
        }
      }
    }

    ctx.restore();
    return;
  }

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
      clipPath: shape.points.map((point) => ({
        x: offsetX + point.x * scale,
        y: offsetY + point.y * scale,
      })),
      imageDrawBox: worldImageDrawBox,
    });
  }

  if (shouldRenderEmboss) {
    drawEmbossEffect(ctx, offsetX, offsetY, scale, layout.tiles, strength);
    drawEmbossStrokeEffect(ctx, offsetX, offsetY, scale, layout.strokes, strength);
    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes)) {
      drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
    }
  } else {
    drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
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
