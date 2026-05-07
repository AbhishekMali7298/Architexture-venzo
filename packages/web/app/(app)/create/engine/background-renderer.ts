import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout, type PatternStroke, type PatternTile } from '../lib/pattern-layout';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';
import { fillMaterialSurface, tracePolygonPath } from './material-fill';
import { isVitaComponentPattern } from '../lib/pattern-capabilities';

function getPreviewBounds(
  layout: ReturnType<typeof getPatternLayout>,
  canvasWidth: number,
  canvasHeight: number,
  frame?: { width: number; height: number } | null,
) {
  const panelWidth = 336;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);

  const visualWidth = Math.max(1, frame?.width ?? layout.contentWidth);
  const visualHeight = Math.max(1, frame?.height ?? layout.contentHeight);
  const scale = Math.min(availableWidth / visualWidth, availableHeight / visualHeight);
  const width = Math.max(1, visualWidth * scale);
  const height = Math.max(1, visualHeight * scale);

  return {
    x: availableX + (availableWidth - width) / 2,
    y: availableY + (availableHeight - height) / 2,
    width,
    height,
  };
}

function cloneConfigWithPatternSize(config: TextureConfig, rows: number, columns: number) {
  const nextConfig = JSON.parse(JSON.stringify(config)) as TextureConfig;
  nextConfig.pattern.rows = Math.max(1, Math.round(rows));
  nextConfig.pattern.columns = Math.max(1, Math.round(columns));
  return nextConfig;
}

function getModuleRepeatStep(config: TextureConfig) {
  const oneColumnLayout = getPatternLayout(
    cloneConfigWithPatternSize(config, config.pattern.rows, 1),
  );
  const twoColumnLayout = getPatternLayout(
    cloneConfigWithPatternSize(config, config.pattern.rows, 2),
  );
  const oneRowLayout = getPatternLayout(
    cloneConfigWithPatternSize(config, 1, config.pattern.columns),
  );
  const twoRowLayout = getPatternLayout(
    cloneConfigWithPatternSize(config, 2, config.pattern.columns),
  );

  return {
    x: Math.max(1, twoColumnLayout.totalWidth - oneColumnLayout.totalWidth),
    y: Math.max(1, twoRowLayout.totalHeight - oneRowLayout.totalHeight),
  };
}

function shouldExtendBackgroundByModule(config: TextureConfig) {
  return config.pattern.type === 'venzowood_3';
}

function getFrameRepeatSize(
  config: TextureConfig,
  layout: ReturnType<typeof getPatternLayout>,
  scale: number,
) {
  // Use logical repeat dimensions from the layout engine.
  // totalWidth/totalHeight already account for joints between modules.
  return {
    width: Math.max(1, layout.totalWidth * scale),
    height: Math.max(1, layout.totalHeight * scale),
  };
}

function renderSheetPreview(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  options: {
    layout: ReturnType<typeof getPatternLayout>;
    bounds: { x: number; y: number; width: number; height: number };
    scale: number;
    material: TextureConfig['materials'][number];
    fallbackFill: string;
    jointFill: string;
    isVita: boolean;
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
    emboss?: { strength: number; intensity: number; depth: number; reverse: boolean };
  },
) {
  const {
    layout,
    bounds,
    scale,
    material,
    fallbackFill,
    jointFill,
    isVita,
    materialImage,
    jointImage,
    emboss,
  } = options;
  const repeatWidth = Math.max(1, layout.totalWidth * scale);
  const repeatHeight = Math.max(1, layout.totalHeight * scale);
  const baseWidth = (layout.totalWidth / Math.max(1, config.pattern.columns)) * scale;
  const baseHeight = (layout.totalHeight / Math.max(1, config.pattern.rows)) * scale;
  const worldImageDrawBox = {
    x: bounds.x,
    y: bounds.y,
    width: baseWidth,
    height: baseHeight,
  };
  const jointImageDrawBox = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
  const showJointBase = isVita || layout.tiles.length > 0;

  fillMaterialSurface(ctx, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    radius: 0,
    fallbackFill: showJointBase ? jointFill : fallbackFill,
    image: isVita ? jointImage : null,
    imageDrawBox: worldImageDrawBox,
  });

  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.clip();

  const repeatColumns = Math.ceil(bounds.width / repeatWidth) + 2;
  const repeatRows = Math.ceil(bounds.height / repeatHeight) + 2;

  for (let row = -1; row < repeatRows; row++) {
    const offsetY = bounds.y + row * repeatHeight;
    for (let column = -1; column < repeatColumns; column++) {
      const offsetX = bounds.x + column * repeatWidth;

      if (layout.tiles.length > 0) {
        for (const [tileIndex, tile] of layout.tiles.entries()) {
          const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
          fillMaterialSurface(ctx, {
            x: offsetX + shape.bounds.x * scale,
            y: offsetY + shape.bounds.y * scale,
            width: shape.bounds.width * scale,
            height: shape.bounds.height * scale,
            radius: 0,
            fallbackFill,
            image: materialImage,
            clipPath: shape.points.map((point) => ({
              x: offsetX + point.x * scale,
              y: offsetY + point.y * scale,
            })),
            imageDrawBox: worldImageDrawBox,
          });
        }
      }

      if (config.pattern.type === 'venzowood_4') {
        drawVenzowood4Holes(
          ctx,
          config,
          offsetX,
          offsetY,
          scale,
          layout,
          jointFill,
          jointImage,
          jointImageDrawBox,
          emboss
            ? {
                strength: emboss.strength,
                intensity: emboss.intensity,
                depth: emboss.depth,
                reverse: emboss.reverse,
              }
            : undefined,
        );
      }

      if (emboss) {
        renderElevationEffect(
          ctx,
          offsetX,
          offsetY,
          scale,
          layout.tiles,
          layout.strokes,
          emboss.strength,
          {
            intensity: emboss.intensity,
            depth: emboss.depth,
            reverse: emboss.reverse,
          },
        );
        if (
          shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes) &&
          (!emboss || emboss.strength <= 0)
        ) {
          drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
        }
      } else {
        drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
      }
    }
  }

  ctx.restore();
}

export function drawPatternStrokes(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  strokes: ReadonlyArray<PatternStroke>,
) {
  if (!strokes.length) return;

  const densityFactor = Math.max(0.2, Math.min(1.6, scale / 0.75));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, 0.9 * densityFactor);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'; // Reduced opacity to avoid obscuring emboss

  for (const stroke of strokes) {
    const firstPoint = stroke.points[0];
    if (!firstPoint) continue;

    ctx.beginPath();
    ctx.moveTo(offsetX + firstPoint.x * scale, offsetY + firstPoint.y * scale);

    for (const point of stroke.points.slice(1)) {
      ctx.lineTo(offsetX + point.x * scale, offsetY + point.y * scale);
    }

    if (stroke.closed) {
      ctx.closePath();
    }

    ctx.stroke();
  }

  ctx.restore();
}

export function shouldDrawEmbossStrokeOutline(
  tiles: ReadonlyArray<PatternTile>,
  strokes: ReadonlyArray<PatternStroke>,
) {
  return tiles.length === 0 && strokes.length > 0;
}

type ElevationOptions = {
  intensity?: number;
  depth?: number;
  reverse?: boolean;
};

type ElevationMetrics = {
  normalizedStrength: number;
  resolutionScale: number;
  primaryOffset: number;
  secondaryOffset: number;
  outerOffset: number;
  strokeWidth: number;
  highlightAlpha: number;
  shadowAlpha: number;
  faceAlpha: number;
  secondaryAlpha: number;
  contactAlpha: number;
  pad: number;
  reverse: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createOffscreenCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

function getContextPixelScale(ctx: CanvasRenderingContext2D) {
  const transform = ctx.getTransform();
  const scaleX = Math.hypot(transform.a, transform.b) || 1;
  const scaleY = Math.hypot(transform.c, transform.d) || 1;
  return Math.max(1, scaleX, scaleY);
}

function getElevationBounds(
  offsetX: number,
  offsetY: number,
  scale: number,
  tiles: ReadonlyArray<PatternTile>,
  strokes: ReadonlyArray<PatternStroke>,
) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const tile of tiles) {
    minX = Math.min(minX, offsetX + tile.bounds.x * scale);
    minY = Math.min(minY, offsetY + tile.bounds.y * scale);
    maxX = Math.max(maxX, offsetX + (tile.bounds.x + tile.bounds.width) * scale);
    maxY = Math.max(maxY, offsetY + (tile.bounds.y + tile.bounds.height) * scale);
  }

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, offsetX + point.x * scale);
      minY = Math.min(minY, offsetY + point.y * scale);
      maxX = Math.max(maxX, offsetX + point.x * scale);
      maxY = Math.max(maxY, offsetY + point.y * scale);
    }
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function getElevationMetrics(
  ctx: CanvasRenderingContext2D,
  scale: number,
  strength = 1,
  geometryCount: number,
  options?: ElevationOptions,
): ElevationMetrics {
  const normalizedStrength = clamp(strength, 0, 1);
  const intensity = clamp((options?.intensity ?? 100) / 100, 0, 1.25);
  const depth = clamp((options?.depth ?? 100) / 100, 0, 1.25);
  const reverse = options?.reverse ?? false;
  const reliefStrength = Math.pow(normalizedStrength, 0.72);
  const densityFactor = clamp(scale / 0.9, 0.32, 1.7);
  const complexityFactor = clamp(1 / Math.sqrt(Math.max(1, geometryCount / 56)), 0.42, 1);
  const detailFactor = densityFactor * complexityFactor;
  const shapeReliefBoost = clamp(1.2 - complexityFactor * 0.28, 0.92, 1.16);
  const pixelScale = getContextPixelScale(ctx);
  const oversampleBase = geometryCount > 180 ? 2.8 : geometryCount > 72 ? 2.35 : 1.9;
  const smallScaleBoost = scale < 0.7 ? 1.2 : 1;
  const resolutionScale = clamp(pixelScale * oversampleBase * smallScaleBoost, 2, 6);
  const primaryOffset = clamp(
    (0.42 + depth * 0.86 + reliefStrength * 0.3) * detailFactor * shapeReliefBoost,
    0.42,
    2.35,
  );
  const secondaryOffset = clamp(primaryOffset * 0.64, 0.22, 1.28);
  const outerOffset = clamp(primaryOffset * 1.08, 0.34, 2.1);
  const strokeWidth = clamp(
    (0.58 + depth * 0.24 + intensity * 0.16 + reliefStrength * 0.08) *
      densityFactor *
      clamp(complexityFactor * 1.14, 0.7, 1.08),
    0.7,
    2.15,
  );
  const alphaFactor = reliefStrength * (0.82 + intensity * 0.58 + depth * 0.26);

  return {
    normalizedStrength,
    resolutionScale,
    primaryOffset,
    secondaryOffset,
    outerOffset,
    strokeWidth,
    // Bias the renderer toward stronger relief while keeping edge bands tight.
    highlightAlpha: Math.min(reverse ? 0.28 : 0.82, (reverse ? 0.28 : 0.82) * alphaFactor),
    shadowAlpha: Math.min(reverse ? 0.72 : 0.48, (reverse ? 0.72 : 0.48) * alphaFactor),
    faceAlpha: Math.min(reverse ? 0.08 : 0.065, (reverse ? 0.08 : 0.065) * alphaFactor),
    secondaryAlpha: Math.min(reverse ? 0.38 : 0.5, (reverse ? 0.38 : 0.5) * alphaFactor),
    contactAlpha: Math.min(reverse ? 0.18 : 0.14, (reverse ? 0.18 : 0.14) * alphaFactor),
    pad: Math.ceil((outerOffset + primaryOffset + strokeWidth * 2 + 3) * resolutionScale),
    reverse,
  };
}

function renderPatternMask(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  scale: number,
  tiles: ReadonlyArray<PatternTile>,
  strokes: ReadonlyArray<PatternStroke>,
  strokeWidth: number,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = strokeWidth;

  for (const tile of tiles) {
    tracePolygonPath(
      ctx,
      tile.points.map((point) => ({
        x: originX + point.x * scale,
        y: originY + point.y * scale,
      })),
    );
    ctx.fill();
  }

  for (const stroke of strokes) {
    const firstPoint = stroke.points[0];
    if (!firstPoint) continue;

    ctx.beginPath();
    ctx.moveTo(originX + firstPoint.x * scale, originY + firstPoint.y * scale);
    for (const point of stroke.points.slice(1)) {
      ctx.lineTo(originX + point.x * scale, originY + point.y * scale);
    }

    if (stroke.closed) {
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  ctx.restore();
}

function buildDirectionalBand(
  maskCanvas: HTMLCanvasElement,
  deltaX: number,
  deltaY: number,
  mode: 'inner' | 'outer',
) {
  const bandCanvas = createOffscreenCanvas(maskCanvas.width, maskCanvas.height);
  const bandCtx = bandCanvas.getContext('2d');
  if (!bandCtx) return null;
  bandCtx.imageSmoothingEnabled = false;

  if (mode === 'inner') {
    bandCtx.drawImage(maskCanvas, 0, 0);
    bandCtx.globalCompositeOperation = 'destination-out';
    bandCtx.drawImage(maskCanvas, deltaX, deltaY);
  } else {
    bandCtx.drawImage(maskCanvas, deltaX, deltaY);
    bandCtx.globalCompositeOperation = 'destination-out';
    bandCtx.drawImage(maskCanvas, 0, 0);
  }

  return bandCanvas;
}

function tintMask(maskCanvas: HTMLCanvasElement, color: string) {
  const tintedCanvas = createOffscreenCanvas(maskCanvas.width, maskCanvas.height);
  const tintedCtx = tintedCanvas.getContext('2d');
  if (!tintedCtx) return null;

  tintedCtx.drawImage(maskCanvas, 0, 0);
  tintedCtx.globalCompositeOperation = 'source-in';
  tintedCtx.fillStyle = color;
  tintedCtx.fillRect(0, 0, tintedCanvas.width, tintedCanvas.height);

  return tintedCanvas;
}

function drawTintedMask(
  ctx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  alpha: number,
) {
  if (!maskCanvas || alpha <= 0) return;

  const tintedMask = tintMask(maskCanvas, color);
  if (!tintedMask) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(tintedMask, x, y, width, height);
  ctx.restore();
}

/**
 * Builds a high-resolution geometry mask, then extracts narrow directional edge bands
 * from that mask. The result stays sharp because it avoids blur-driven bevel styling
 * and preserves tiny SVG details through oversampled mask rendering.
 */
export function renderElevationEffect(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  tiles: ReadonlyArray<PatternTile>,
  strokes: ReadonlyArray<PatternStroke>,
  strength = 1,
  options?: ElevationOptions,
) {
  const geometryCount = tiles.length + strokes.length;
  const metrics = getElevationMetrics(ctx, scale, strength, geometryCount, options);
  if (metrics.normalizedStrength <= 0 || geometryCount === 0) return;

  const bounds = getElevationBounds(offsetX, offsetY, scale, tiles, strokes);
  if (!bounds) return;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const logicalMaskWidth = width + (metrics.pad * 2) / metrics.resolutionScale;
  const logicalMaskHeight = height + (metrics.pad * 2) / metrics.resolutionScale;
  const logicalPad = metrics.pad / metrics.resolutionScale;
  const maskCanvas = createOffscreenCanvas(
    logicalMaskWidth * metrics.resolutionScale,
    logicalMaskHeight * metrics.resolutionScale,
  );
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return;
  maskCtx.setTransform(metrics.resolutionScale, 0, 0, metrics.resolutionScale, 0, 0);
  maskCtx.imageSmoothingEnabled = false;

  renderPatternMask(
    maskCtx,
    logicalPad - bounds.minX,
    logicalPad - bounds.minY,
    scale,
    tiles,
    strokes,
    metrics.strokeWidth,
  );

  const primaryDelta = Math.max(1, Math.round(metrics.primaryOffset * metrics.resolutionScale));
  const secondaryDelta = Math.max(1, Math.round(metrics.secondaryOffset * metrics.resolutionScale));
  const outerDelta = Math.max(1, Math.round(metrics.outerOffset * metrics.resolutionScale));

  const innerTopLeft = buildDirectionalBand(maskCanvas, primaryDelta, primaryDelta, 'inner');
  const innerBottomRight = buildDirectionalBand(maskCanvas, -primaryDelta, -primaryDelta, 'inner');
  const microTopLeft = buildDirectionalBand(maskCanvas, secondaryDelta, secondaryDelta, 'inner');
  const microBottomRight = buildDirectionalBand(
    maskCanvas,
    -secondaryDelta,
    -secondaryDelta,
    'inner',
  );
  const outerTopLeft = buildDirectionalBand(maskCanvas, -outerDelta, -outerDelta, 'outer');
  const outerBottomRight = buildDirectionalBand(maskCanvas, outerDelta, outerDelta, 'outer');
  const drawX = bounds.minX - logicalPad;
  const drawY = bounds.minY - logicalPad;

  drawTintedMask(
    ctx,
    maskCanvas,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    metrics.reverse ? '#000000' : '#ffffff',
    metrics.faceAlpha,
  );

  drawTintedMask(
    ctx,
    metrics.reverse ? innerTopLeft : innerBottomRight,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    '#2f2416',
    metrics.shadowAlpha,
  );
  drawTintedMask(
    ctx,
    metrics.reverse ? innerBottomRight : innerTopLeft,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    '#fff8ef',
    metrics.highlightAlpha,
  );

  drawTintedMask(
    ctx,
    metrics.reverse ? microTopLeft : microBottomRight,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    '#2f2416',
    metrics.secondaryAlpha,
  );
  drawTintedMask(
    ctx,
    metrics.reverse ? microBottomRight : microTopLeft,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    '#fff8ef',
    metrics.secondaryAlpha,
  );

  drawTintedMask(
    ctx,
    metrics.reverse ? outerTopLeft : outerBottomRight,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    '#2f2416',
    metrics.contactAlpha,
  );
  drawTintedMask(
    ctx,
    metrics.reverse ? outerBottomRight : outerTopLeft,
    drawX,
    drawY,
    logicalMaskWidth,
    logicalMaskHeight,
    '#fff8ef',
    metrics.contactAlpha * 0.78,
  );
}

export function drawEmbossStrokeEffect(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  strokes: ReadonlyArray<PatternStroke>,
  strength = 1,
  options?: { intensity?: number; depth?: number; reverse?: boolean },
) {
  renderElevationEffect(ctx, offsetX, offsetY, scale, [], strokes, strength, options);
}

function polygonArea(points: ReadonlyArray<{ x: number; y: number }>) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index++) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) * 0.5;
}

function drawVenzowood4Holes(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  offsetX: number,
  offsetY: number,
  scale: number,
  layout: ReturnType<typeof getPatternLayout>,
  jointFill: string,
  jointImage?: CanvasImageSource | null,
  jointImageDrawBox?: { x: number; y: number; width: number; height: number },
  embossOptions?: { strength?: number; intensity?: number; depth?: number; reverse?: boolean },
) {
  if (config.pattern.type !== 'venzowood_4') return;
  if (!layout.strokes.length || !layout.tiles.length) return;

  let maxTileArea = 0;
  for (const tile of layout.tiles) {
    const area = tile.width * tile.height;
    if (area > maxTileArea) maxTileArea = area;
  }
  if (maxTileArea <= 0) return;

  const holeCandidates = layout.strokes.filter((stroke) => {
    if (!stroke.closed || stroke.points.length < 3) return false;
    const area = polygonArea(stroke.points);
    return area > 0 && area < maxTileArea * 0.2;
  });

  if (!holeCandidates.length) return;

  const strength = embossOptions?.strength ?? 0;
  const intensity = (embossOptions?.intensity ?? 100) / 100;
  const depth = (embossOptions?.depth ?? 100) / 100;
  const reverse = embossOptions?.reverse ?? false;

  const normalizedStrength = Math.max(0, Math.min(1, strength));
  const clampedStrength = Math.sqrt(normalizedStrength);
  const densityFactor = Math.max(0.2, Math.min(1.6, scale / 0.75));
  const strengthFactor = 0.7 + clampedStrength * 0.3;
  const alphaFactor = (0.8 + densityFactor * 0.2) * clampedStrength * intensity;

  const grooveWidth = 1.4 * depth * strengthFactor * densityFactor * (reverse ? 1.4 : 1.0);
  const bevelOffset =
    Math.max(0.3 * densityFactor, grooveWidth * 0.72) * strengthFactor * (reverse ? 1.2 : 1.0);
  const bevelLineWidth = grooveWidth * (0.85 + clampedStrength * 0.45);
  const highlightAlpha = Math.min(0.75, 0.75 * alphaFactor);
  const shadowAlpha = Math.min(reverse ? 0.65 : 0.45, (reverse ? 0.65 : 0.45) * alphaFactor);

  for (const hole of holeCandidates) {
    const points = hole.points.map((point) => ({
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
    }));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    fillMaterialSurface(ctx, {
      x: minX,
      y: minY,
      width,
      height,
      radius: 0,
      fallbackFill: jointFill,
      image: jointImage,
      clipPath: points,
      imageDrawBox:
        embossOptions?.reverse === false
          ? jointImageDrawBox
          : {
              x: offsetX,
              y: offsetY,
              width: (layout.totalWidth / Math.max(1, config.pattern.columns)) * scale,
              height: (layout.totalHeight / Math.max(1, config.pattern.rows)) * scale,
            },
    });

    if (normalizedStrength > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // For a hole, the bevel is INVERTED relative to the surface.
      // If surface has Shadow at Top-Left (Reverse/Deboss), Hole has Highlight at Top-Left.
      // If surface has Highlight at Top-Left (Normal/Emboss), Hole has Shadow at Top-Left.

      // 1. Hole Highlight Bevel
      ctx.save();
      tracePolygonPath(ctx, points);
      ctx.clip();
      ctx.save();
      // Reverse? Use positive offset for highlight (Top-Left) : Use negative offset for highlight (Bottom-Right)
      const hOffset = reverse ? bevelOffset : -bevelOffset;
      ctx.translate(hOffset, hOffset);
      tracePolygonPath(ctx, points);
      ctx.strokeStyle = `rgba(255,255,255,${highlightAlpha.toFixed(3)})`;
      ctx.lineWidth = bevelLineWidth;
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      // 2. Hole Shadow Bevel
      ctx.save();
      tracePolygonPath(ctx, points);
      ctx.clip();
      ctx.save();
      // Reverse? Use negative offset for shadow (Bottom-Right) : Use positive offset for shadow (Top-Left)
      const sOffset = reverse ? -bevelOffset : bevelOffset;
      ctx.translate(sOffset, sOffset);
      tracePolygonPath(ctx, points);
      ctx.strokeStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
      ctx.lineWidth = bevelLineWidth;
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      ctx.restore();
    }
  }
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
    tileBackground?: boolean;
    svgPatternModule?: SvgPatternModule | null;
    sheetPreview?: { width: number; height: number } | null;
  },
) {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(
    material.source,
    definition?.swatchColor ?? '#c8c8c8',
  );
  const layout = getPatternLayout(config, options?.svgPatternModule ?? null);
  const previewFrame = options?.sheetPreview ?? null;
  const bounds = getPreviewBounds(layout, canvasWidth, canvasHeight, previewFrame);
  const scale = previewFrame
    ? Math.min(
        bounds.width / Math.max(previewFrame.width, 1),
        bounds.height / Math.max(previewFrame.height, 1),
      )
    : Math.min(
        bounds.width / Math.max(layout.totalWidth, 1),
        bounds.height / Math.max(layout.totalHeight, 1),
      );
  const frameWidth = previewFrame ? previewFrame.width * scale : layout.totalWidth * scale;
  const frameHeight = previewFrame ? previewFrame.height * scale : layout.totalHeight * scale;
  const jointFill = getJointRenderableColor(
    config.joints.materialSource,
    undefined,
    config.joints.adjustments,
  );
  const jointImageDrawBox = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  const isVita = isVitaComponentPattern(config.pattern.type);

  ctx.fillStyle = '#eee7dc';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (previewFrame) {
    renderSheetPreview(ctx, config, {
      layout,
      bounds,
      scale,
      material,
      fallbackFill,
      jointFill,
      isVita,
      materialImage: options?.materialImage,
      jointImage: options?.jointImage,
    });

    return {
      x: bounds.x,
      y: bounds.y,
      width: frameWidth,
      height: frameHeight,
    };
  }

  const baseWidth = (layout.totalWidth / Math.max(1, config.pattern.columns)) * scale;
  const baseHeight = (layout.totalHeight / Math.max(1, config.pattern.rows)) * scale;
  const worldImageDrawBox = {
    x: bounds.x,
    y: bounds.y,
    width: baseWidth,
    height: baseHeight,
  };

  if (isVita) {
    fillMaterialSurface(ctx, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      radius: 0,
      fallbackFill: jointFill,
      image: options?.jointImage,
      imageDrawBox: worldImageDrawBox,
    });
  } else {
    fillMaterialSurface(ctx, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      radius: 0,
      fallbackFill,
      image: options?.materialImage,
      imageDrawBox: worldImageDrawBox,
    });
  }

  if (options?.tileBackground === false) {
    if (isVita && layout.tiles.length > 0) {
      for (const [tileIndex, tile] of layout.tiles.entries()) {
        const shape = getTileRenderShape(tile, material, config.seed, tileIndex);

        fillMaterialSurface(ctx, {
          x: bounds.x + shape.bounds.x * scale,
          y: bounds.y + shape.bounds.y * scale,
          width: shape.bounds.width * scale,
          height: shape.bounds.height * scale,
          radius: 0,
          fallbackFill,
          image: options?.materialImage,
          clipPath: shape.points.map((point) => ({
            x: bounds.x + point.x * scale,
            y: bounds.y + point.y * scale,
          })),
          imageDrawBox: worldImageDrawBox,
        });
      }
      drawVenzowood4Holes(
        ctx,
        config,
        bounds.x,
        bounds.y,
        scale,
        layout,
        jointFill,
        options?.jointImage,
        jointImageDrawBox,
      );
    } else {
      fillMaterialSurface(ctx, {
        x: bounds.x,
        y: bounds.y,
        width: frameWidth,
        height: frameHeight,
        radius: 0,
        fallbackFill,
        image: options?.materialImage,
      });
    }
    drawPatternStrokes(ctx, bounds.x, bounds.y, scale, layout.strokes);

    return {
      x: bounds.x,
      y: bounds.y,
      width: frameWidth,
      height: frameHeight,
    };
  }

  // PERFORMANCE OPTIMIZATION: Cache a single module to an offscreen canvas
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const frameRepeat = getFrameRepeatSize(config, layout, scale);

  // Calculate actual content size (some patterns like Venzowood 3 have overhanging elements)
  const contentWidth = layout.contentWidth * scale;
  const contentHeight = layout.contentHeight * scale;
  const bleed = 20;

  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = Math.ceil((contentWidth + bleed * 2) * dpr);
  cacheCanvas.height = Math.ceil((contentHeight + bleed * 2) * dpr);
  const cacheCtx = cacheCanvas.getContext('2d');

  if (cacheCtx) {
    cacheCtx.scale(dpr, dpr);
    cacheCtx.translate(bleed, bleed);

    // Draw only strokes/holes into the cache (no materials)
    drawVenzowood4Holes(
      cacheCtx,
      config,
      0,
      0,
      scale,
      layout,
      jointFill,
      options?.jointImage,
      jointImageDrawBox,
    );
    drawPatternStrokes(cacheCtx, 0, 0, scale, layout.strokes);
  }

  const patternBox = {
    x: bounds.x,
    y: bounds.y,
    width: frameWidth,
    height: frameHeight,
  };

  const tilesLeft = Math.ceil(bounds.x / frameRepeat.width) + 1;
  const tilesRight = Math.ceil((canvasWidth - bounds.x) / frameRepeat.width) + 1;
  const tilesAbove = Math.ceil(bounds.y / frameRepeat.height) + 1;
  const tilesBelow = Math.ceil((canvasHeight - bounds.y) / frameRepeat.height) + 1;

  for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
    const offsetY = bounds.y + yIndex * frameRepeat.height;
    for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
      const offsetX = bounds.x + xIndex * frameRepeat.width;

      // Draw material tiles directly to main ctx to ensure global material coordination
      if (isVita && layout.tiles.length > 0) {
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
      }

      ctx.drawImage(
        cacheCanvas,
        offsetX - bleed,
        offsetY - bleed,
        contentWidth + bleed * 2,
        contentHeight + bleed * 2,
      );
    }
  }

  return {
    x: bounds.x,
    y: bounds.y,
    width: frameWidth,
    height: frameHeight,
  };
}

export function drawEmbossEffect(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  tiles: ReadonlyArray<PatternTile>,
  strength = 1,
  options?: { intensity?: number; depth?: number; reverse?: boolean },
) {
  renderElevationEffect(ctx, offsetX, offsetY, scale, tiles, [], strength, options);
}

export function renderEmbossBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
    tileBackground?: boolean;
    embossStrength?: number;
    embossIntensity?: number;
    embossDepth?: number;
    svgPatternModule?: SvgPatternModule | null;
    sheetPreview?: { width: number; height: number } | null;
  },
) {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(
    material.source,
    definition?.swatchColor ?? '#c8c8c8',
  );
  const layout = getPatternLayout(config, options?.svgPatternModule ?? null);
  const previewFrame = options?.sheetPreview ?? null;
  const bounds = getPreviewBounds(layout, canvasWidth, canvasHeight, previewFrame);
  const scale = previewFrame
    ? Math.min(
        bounds.width / Math.max(previewFrame.width, 1),
        bounds.height / Math.max(previewFrame.height, 1),
      )
    : Math.min(
        bounds.width / Math.max(layout.totalWidth, 1),
        bounds.height / Math.max(layout.totalHeight, 1),
      );
  const frameWidth = previewFrame ? previewFrame.width * scale : layout.totalWidth * scale;
  const frameHeight = previewFrame ? previewFrame.height * scale : layout.totalHeight * scale;
  const embossStrength = (options?.embossStrength ?? 100) / 100;
  const embossIntensity = options?.embossIntensity ?? 100;
  const embossDepth = options?.embossDepth ?? 100;

  const jointFill = getJointRenderableColor(
    config.joints.materialSource,
    undefined,
    config.joints.adjustments,
  );
  const jointImageDrawBox = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };

  const isVita = isVitaComponentPattern(config.pattern.type);

  if (previewFrame) {
    ctx.fillStyle = '#eee7dc';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    renderSheetPreview(ctx, config, {
      layout,
      bounds,
      scale,
      material,
      fallbackFill,
      jointFill,
      isVita,
      materialImage: options?.materialImage,
      jointImage: options?.jointImage,
      emboss: {
        strength: embossStrength,
        intensity: embossIntensity,
        depth: embossDepth,
        reverse: isVita,
      },
    });

    return { x: bounds.x, y: bounds.y, width: frameWidth, height: frameHeight };
  }

  const baseWidth = (layout.totalWidth / Math.max(1, config.pattern.columns)) * scale;
  const baseHeight = (layout.totalHeight / Math.max(1, config.pattern.rows)) * scale;
  const worldImageDrawBox = {
    x: bounds.x,
    y: bounds.y,
    width: baseWidth,
    height: baseHeight,
  };

  if (options?.tileBackground === false) {
    // Preview-only mode: fill preview area with background color
    ctx.fillStyle = '#eee7dc';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // If it's a Vita pattern with tiles, fill background with joint material first
    if (isVita && layout.tiles.length > 0) {
      fillMaterialSurface(ctx, {
        x: bounds.x,
        y: bounds.y,
        width: frameWidth,
        height: frameHeight,
        radius: 0,
        fallbackFill: jointFill,
        image: options?.jointImage,
      });

      // Then fill tiles with primary material
      for (const [tileIndex, tile] of layout.tiles.entries()) {
        const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
        fillMaterialSurface(ctx, {
          x: bounds.x + shape.bounds.x * scale,
          y: bounds.y + shape.bounds.y * scale,
          width: shape.bounds.width * scale,
          height: shape.bounds.height * scale,
          radius: 0,
          fallbackFill,
          image: options?.materialImage,
          clipPath: shape.points.map((point) => ({
            x: bounds.x + point.x * scale,
            y: bounds.y + point.y * scale,
          })),
          imageDrawBox: worldImageDrawBox,
        });
      }

      drawVenzowood4Holes(
        ctx,
        config,
        bounds.x,
        bounds.y,
        scale,
        layout,
        jointFill,
        options?.jointImage,
        jointImageDrawBox,
        {
          strength: embossStrength,
          intensity: embossIntensity,
          depth: embossDepth,
          reverse: isVita,
        },
      );
    } else {
      // Impress/Standard: fill whole area with continuous primary material
      fillMaterialSurface(ctx, {
        x: bounds.x,
        y: bounds.y,
        width: frameWidth,
        height: frameHeight,
        radius: 0,
        fallbackFill,
        image: options?.materialImage,
      });
    }

    renderElevationEffect(
      ctx,
      bounds.x,
      bounds.y,
      scale,
      layout.tiles,
      layout.strokes,
      embossStrength,
      {
        intensity: embossIntensity,
        depth: embossDepth,
        reverse: isVita,
      },
    );
    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes) && embossStrength <= 0) {
      drawPatternStrokes(ctx, bounds.x, bounds.y, scale, layout.strokes);
    }

    return { x: bounds.x, y: bounds.y, width: frameWidth, height: frameHeight };
  }

  // Tiled background mode
  // 1. Fill base layer
  if (isVita) {
    ctx.fillStyle = jointFill;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    fillMaterialSurface(ctx, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      radius: 0,
      fallbackFill: jointFill,
      image: options?.jointImage,
      imageDrawBox: worldImageDrawBox,
    });
  } else {
    ctx.fillStyle = fallbackFill;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    fillMaterialSurface(ctx, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      radius: 0,
      fallbackFill,
      image: options?.materialImage,
      imageDrawBox: worldImageDrawBox,
    });
  }

  // PERFORMANCE OPTIMIZATION: Cache a single module to an offscreen canvas
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const frameRepeat = getFrameRepeatSize(config, layout, scale);

  // Calculate actual content size
  const contentWidth = layout.contentWidth * scale;
  const contentHeight = layout.contentHeight * scale;
  const bleed = 20;

  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = Math.ceil((contentWidth + bleed * 2) * dpr);
  cacheCanvas.height = Math.ceil((contentHeight + bleed * 2) * dpr);
  const cacheCtx = cacheCanvas.getContext('2d');

  if (cacheCtx) {
    cacheCtx.scale(dpr, dpr);
    cacheCtx.translate(bleed, bleed);

    // Draw only strokes/holes into the cache (no materials)
    drawVenzowood4Holes(
      cacheCtx,
      config,
      0,
      0,
      scale,
      layout,
      jointFill,
      options?.jointImage,
      jointImageDrawBox,
      {
        strength: embossStrength,
        intensity: embossIntensity,
        depth: embossDepth,
        reverse: isVita,
      },
    );

    // Draw only the emboss effects into the cache
    renderElevationEffect(cacheCtx, 0, 0, scale, layout.tiles, layout.strokes, embossStrength, {
      intensity: embossIntensity,
      depth: embossDepth,
      reverse: isVita,
    });
    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes) && embossStrength <= 0) {
      drawPatternStrokes(cacheCtx, 0, 0, scale, layout.strokes);
    }
  }

  const patternBox = {
    x: bounds.x,
    y: bounds.y,
    width: frameWidth,
    height: frameHeight,
  };

  const tilesLeft = Math.ceil(bounds.x / frameRepeat.width) + 1;
  const tilesRight = Math.ceil((canvasWidth - bounds.x) / frameRepeat.width) + 1;
  const tilesAbove = Math.ceil(bounds.y / frameRepeat.height) + 1;
  const tilesBelow = Math.ceil((canvasHeight - bounds.y) / frameRepeat.height) + 1;

  for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
    const offsetY = bounds.y + yIndex * frameRepeat.height;
    for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
      const offsetX = bounds.x + xIndex * frameRepeat.width;

      // Draw material tiles directly to main ctx to ensure global material coordination
      if (isVita && layout.tiles.length > 0) {
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
      }

      ctx.drawImage(
        cacheCanvas,
        offsetX - bleed,
        offsetY - bleed,
        contentWidth + bleed * 2,
        contentHeight + bleed * 2,
      );
    }
  }

  return { x: bounds.x, y: bounds.y, width: frameWidth, height: frameHeight };
}

export function drawPreviewBorder(
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
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000000';
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
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
