import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout } from '../lib/pattern-layout';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';
import { fillMaterialSurface } from './material-fill';
import {
  drawPatternStrokes,
  renderElevationEffect,
  shouldDrawEmbossStrokeOutline,
} from './background-renderer';
import { isVitaComponentPattern, supportsEmbossPattern } from '../lib/pattern-capabilities';

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
    embossIntensity?: number;
    embossDepth?: number;
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
  const isVita = isVitaComponentPattern(config.pattern.type);

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
    fallbackFill: isVita ? jointFill : fallbackFill,
    image: isVita ? options?.jointImage : options?.materialImage,
    imageDrawBox: worldImageDrawBox,
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
      clipPath: shape.points.map((point) => ({
        x: offsetX + point.x * scale,
        y: offsetY + point.y * scale,
      })),
      imageDrawBox: worldImageDrawBox,
    });
  }

  const shouldRenderEmboss = options?.embossMode && supportsEmbossPattern(config.pattern.type);
  if (shouldRenderEmboss) {
    const strength = (options?.embossStrength ?? 100) / 100;
    renderElevationEffect(ctx, offsetX, offsetY, scale, layout.tiles, layout.strokes, strength, {
      intensity: options?.embossIntensity ?? 100,
      depth: options?.embossDepth ?? 100,
      reverse: isVita,
    });
    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes) && strength <= 0) {
      drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
    }
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
