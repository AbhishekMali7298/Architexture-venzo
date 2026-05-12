import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout, type PatternStroke, type PatternTile } from '../lib/pattern-layout';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';
import { fillMaterialSurface, tracePolygonPath } from './material-fill';
import {
  isVitaComponentPattern,
  usesMaterialBackgroundVitaPattern,
  usesSwappedVitaMaterialMapping,
} from '../lib/pattern-capabilities';

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

function getPatternRepeatPhases(config: TextureConfig, repeatWidth: number, repeatHeight: number) {
  if (config.pattern.type !== 'venzowood' && config.pattern.type !== 'rhombus_pattern') {
    return [{ x: 0, y: 0 }];
  }

  const moduleStepX = repeatWidth / Math.max(1, config.pattern.columns);
  const moduleStepY = repeatHeight / Math.max(1, config.pattern.rows);

  // Interleave by half of a single module step, not half of the whole selected
  // layout. That keeps odd/even row and column counts consistent.
  return [
    { x: 0, y: 0 },
    { x: moduleStepX / 2, y: moduleStepY / 2 },
  ];
}

function buildSheetPreviewOverlayCache(
  layout: ReturnType<typeof getPatternLayout>,
  scale: number,
  jointFill: string,
  emboss: { strength: number; intensity: number; depth: number; reverse: boolean } | undefined,
) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const contentWidth = Math.max(layout.totalWidth, layout.contentWidth) * scale;
  const contentHeight = Math.max(layout.totalHeight, layout.contentHeight) * scale;
  const bleed = emboss ? 20 : 4;
  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = Math.ceil((contentWidth + bleed * 2) * dpr);
  cacheCanvas.height = Math.ceil((contentHeight + bleed * 2) * dpr);

  const cacheCtx = cacheCanvas.getContext('2d');
  if (!cacheCtx) {
    return null;
  }

  cacheCtx.scale(dpr, dpr);
  cacheCtx.translate(bleed, bleed);



  if (emboss) {
    drawEmbossEffect(cacheCtx, 0, 0, scale, layout.tiles, emboss.strength, {
      intensity: emboss.intensity,
      depth: emboss.depth,
      reverse: emboss.reverse,
    });
    drawEmbossStrokeEffect(cacheCtx, 0, 0, scale, layout.strokes, emboss.strength, {
      intensity: emboss.intensity,
      depth: emboss.depth,
      reverse: emboss.reverse,
    });
    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes)) {
      drawPatternStrokes(cacheCtx, 0, 0, scale, layout.strokes);
    }
  } else {
    drawPatternStrokes(cacheCtx, 0, 0, scale, layout.strokes);
  }

  return {
    canvas: cacheCanvas,
    bleed,
    width: contentWidth,
    height: contentHeight,
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
  const useSwappedVitaMapping = usesSwappedVitaMaterialMapping(config.pattern.type);
  const useMaterialBackground = usesMaterialBackgroundVitaPattern(config.pattern.type);
  const useJointAsBackground = isVita && layout.tiles.length > 0 && !useMaterialBackground;

  fillMaterialSurface(ctx, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    radius: 0,
    fallbackFill: useJointAsBackground ? jointFill : fallbackFill,
    image: useJointAsBackground ? jointImage : materialImage,
    imageDrawBox: worldImageDrawBox,
  });


  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.clip();

  const repeatColumns = Math.ceil(bounds.width / repeatWidth) + 2;
  const repeatRows = Math.ceil(bounds.height / repeatHeight) + 2;
  const repeatPhases = getPatternRepeatPhases(config, repeatWidth, repeatHeight);
  const totalRepeats = repeatColumns * repeatRows;
  const geometryComplexity = layout.tiles.length + layout.strokes.length;
  const overlayCache =
    !isVita && (geometryComplexity > 20 || totalRepeats > 10)
      ? buildSheetPreviewOverlayCache(layout, scale, jointFill, emboss)
      : null;

  for (const phase of repeatPhases) {
    for (let row = -1; row < repeatRows; row++) {
      const offsetY = bounds.y + phase.y + row * repeatHeight;
      for (let column = -1; column < repeatColumns; column++) {
        const offsetX = bounds.x + phase.x + column * repeatWidth;

        if (overlayCache) {
          ctx.drawImage(
            overlayCache.canvas,
            offsetX - overlayCache.bleed,
            offsetY - overlayCache.bleed,
            overlayCache.width + overlayCache.bleed * 2,
            overlayCache.height + overlayCache.bleed * 2,
          );
          continue;
        }

        if (layout.tiles.length > 0) {
          if (useSwappedVitaMapping) {
            fillClosedPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes, {
              fallbackFill,
              image: materialImage,
              imageDrawBox: worldImageDrawBox,
            });
          }

          for (const [tileIndex, tile] of layout.tiles.entries()) {
            const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
            fillMaterialSurface(ctx, {
              x: offsetX + shape.bounds.x * scale,
              y: offsetY + shape.bounds.y * scale,
              width: shape.bounds.width * scale,
              height: shape.bounds.height * scale,
              radius: 0,
              fallbackFill: useSwappedVitaMapping ? jointFill : fallbackFill,
              image: useSwappedVitaMapping ? jointImage : materialImage,
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

        if (useMaterialBackground && layout.strokes.length > 0) {
          drawMaterialBackgroundVitaGrooves(
            ctx,
            offsetX,
            offsetY,
            scale,
            layout.strokes,
            jointFill,
            jointImage,
            jointImageDrawBox,
            emboss?.depth ?? 100,
          );
        }

        if (emboss) {
          drawEmbossEffect(ctx, offsetX, offsetY, scale, layout.tiles, emboss.strength, {
            intensity: emboss.intensity,
            depth: emboss.depth,
            reverse: emboss.reverse,
          });
          drawEmbossStrokeEffect(ctx, offsetX, offsetY, scale, layout.strokes, emboss.strength, {
            intensity: emboss.intensity,
            depth: emboss.depth,
            reverse: emboss.reverse,
          });

          // For engraved Vita patterns (no tiles), fill the strokes with joint material
          if (isVita && layout.tiles.length === 0) {
            drawVitaStrokeJoints(
              ctx,
              offsetX,
              offsetY,
              scale,
              layout.strokes,
              jointFill,
              jointImage,
              jointImageDrawBox,
              emboss?.depth ?? 100
            );
          }
          if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes)) {
            drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
          }
        } else {
          drawPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes);
        }
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

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';

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

export function fillClosedPatternStrokes(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  strokes: ReadonlyArray<PatternStroke>,
  options: {
    fallbackFill: string;
    image?: CanvasImageSource | null;
    imageDrawBox?: { x: number; y: number; width: number; height: number };
  },
) {
  for (const stroke of strokes) {
    if (!stroke.closed || stroke.points.length < 3) continue;

    const scaledPoints = stroke.points.map((point) => ({
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
    }));

    const xs = scaledPoints.map((point) => point.x);
    const ys = scaledPoints.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    fillMaterialSurface(ctx, {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      radius: 0,
      fallbackFill: options.fallbackFill,
      image: options.image,
      clipPath: scaledPoints,
      imageDrawBox: options.imageDrawBox,
    });
  }
}

export function shouldDrawEmbossStrokeOutline(
  tiles: ReadonlyArray<PatternTile>,
  strokes: ReadonlyArray<PatternStroke>,
) {
  return tiles.length === 0 && strokes.length > 0;
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
  const normalizedStrength = Math.max(0, Math.min(1, strength));
  if (!strokes.length || normalizedStrength <= 0) return;

  const intensity = (options?.intensity ?? 100) / 100;
  const depth = (options?.depth ?? 100) / 100;
  const reverse = options?.reverse ?? false;

  const embossOffset = Math.max(0.1, (reverse ? 1.6 : 0.6) * normalizedStrength * depth);
  const strokeWidth = Math.max(0.4, (reverse ? 2.8 : 1.8) * normalizedStrength * depth);
  const highlightAlpha = Math.min(0.85, (reverse ? 0.95 : 0.9) * normalizedStrength * intensity);
  const shadowAlpha = Math.min(
    reverse ? 0.85 : 0.5,
    (reverse ? 0.92 : 0.6) * normalizedStrength * intensity,
  );
  const baseAlpha = Math.min(0.35, 0.45 * normalizedStrength * intensity);

  const drawOffsetStroke = (
    deltaX: number,
    deltaY: number,
    color: string,
    alpha: number,
    customWidth?: number,
  ) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = customWidth ?? strokeWidth;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;

    for (const stroke of strokes) {
      const firstPoint = stroke.points[0];
      if (!firstPoint) continue;

      ctx.beginPath();
      ctx.moveTo(offsetX + firstPoint.x * scale + deltaX, offsetY + firstPoint.y * scale + deltaY);

      for (const point of stroke.points.slice(1)) {
        ctx.lineTo(offsetX + point.x * scale + deltaX, offsetY + point.y * scale + deltaY);
      }

      if (stroke.closed) {
        ctx.closePath();
      }

      ctx.stroke();
    }

    ctx.restore();
  };

  if (reverse) {
    // Multi-pass shadows for deep grooves
    for (let i = 1; i <= 3; i++) {
      drawOffsetStroke(
        embossOffset * (0.3 + i * 0.4),
        embossOffset * (0.3 + i * 0.4),
        `rgba(28,15,10,${(shadowAlpha * (0.5 / i)).toFixed(3)})`,
        1,
        strokeWidth * (1.0 + i * 0.5),
      );
    }
  }

  // 1. Groove Base
  drawOffsetStroke(0, 0, reverse ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)', baseAlpha);

  // 2. Highlight
  drawOffsetStroke(
    reverse ? -embossOffset : embossOffset,
    reverse ? -embossOffset : embossOffset,
    '#ffffff',
    highlightAlpha,
  );

  // 3. Shadow
  drawOffsetStroke(
    reverse ? embossOffset : -embossOffset,
    reverse ? embossOffset : -embossOffset,
    '#000000',
    shadowAlpha,
  );

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
  const grooveWidth = 1.4 * depth * (0.7 + clampedStrength * 0.3) * (reverse ? 1.4 : 1.0);
  const bevelOffset =
    Math.max(0.4, grooveWidth * 0.72) * (0.7 + clampedStrength * 0.3) * (reverse ? 1.2 : 1.0);
  const bevelLineWidth = grooveWidth * (0.85 + clampedStrength * 0.45);
  const highlightAlpha = Math.min(0.62, 0.62 * clampedStrength * intensity);
  const shadowAlpha = Math.min(
    reverse ? 0.58 : 0.38,
    (reverse ? 0.6 : 0.38) * clampedStrength * intensity,
  );

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
  const useSwappedVitaMapping = usesSwappedVitaMaterialMapping(config.pattern.type);
  const useMaterialBackground = usesMaterialBackgroundVitaPattern(config.pattern.type);

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
      fallbackFill: useMaterialBackground ? fallbackFill : jointFill,
      image: useMaterialBackground ? options?.materialImage : options?.jointImage,
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
      if (useSwappedVitaMapping) {
        fillClosedPatternStrokes(ctx, bounds.x, bounds.y, scale, layout.strokes, {
          fallbackFill,
          image: options?.materialImage,
          imageDrawBox: worldImageDrawBox,
        });
      }

      for (const [tileIndex, tile] of layout.tiles.entries()) {
        const shape = getTileRenderShape(tile, material, config.seed, tileIndex);

        fillMaterialSurface(ctx, {
          x: bounds.x + shape.bounds.x * scale,
          y: bounds.y + shape.bounds.y * scale,
          width: shape.bounds.width * scale,
          height: shape.bounds.height * scale,
          radius: 0,
          fallbackFill: useSwappedVitaMapping ? jointFill : fallbackFill,
          image: useSwappedVitaMapping ? options?.jointImage : options?.materialImage,
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
      if (useMaterialBackground && layout.strokes.length > 0) {
        drawMaterialBackgroundVitaGrooves(
          ctx,
          bounds.x,
          bounds.y,
          scale,
          layout.strokes,
          jointFill,
          options?.jointImage,
          jointImageDrawBox,
          100,
        );
      }
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
    if (useMaterialBackground && layout.strokes.length > 0) {
      drawMaterialBackgroundVitaGrooves(
        cacheCtx,
        0,
        0,
        scale,
        layout.strokes,
        jointFill,
        options?.jointImage,
        jointImageDrawBox,
        100,
      );
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
  const repeatPhases = getPatternRepeatPhases(config, frameRepeat.width, frameRepeat.height);

  for (const phase of repeatPhases) {
    for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
      const offsetY = bounds.y + phase.y + yIndex * frameRepeat.height;
      for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
        const offsetX = bounds.x + phase.x + xIndex * frameRepeat.width;

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
  const normalizedStrength = Math.max(0, Math.min(1, strength));
  if (normalizedStrength <= 0) return;

  const intensity = (options?.intensity ?? 100) / 100;
  const depth = (options?.depth ?? 100) / 100;
  const reverse = options?.reverse ?? false;

  const clampedStrength = Math.sqrt(normalizedStrength);
  const referenceScale = 0.75;
  const scaleFactor = scale / referenceScale;
  const adaptiveScale = Math.min(1.8, Math.pow(scaleFactor, 0.7));

  // Visual constants for the "Carved" look
  const grooveWidth = 1.4 * adaptiveScale * depth * (0.7 + clampedStrength * 0.3) * (reverse ? 1.4 : 1.0);
  const bevelOffset =
    Math.max(0.4 * adaptiveScale, grooveWidth * 0.72) * (0.7 + clampedStrength * 0.3) * (reverse ? 1.25 : 1.0);
  const bevelLineWidth = grooveWidth * (reverse ? 1.2 : 0.8 + clampedStrength * 0.4);

  const densityAlphaCorrection = Math.min(1.0, 0.55 + scaleFactor * 0.45);
  const faceAlpha = 0.12 * clampedStrength * intensity * (reverse ? 2.8 : 1.0) * densityAlphaCorrection;
  const grooveAlpha = Math.min(0.55, 0.55 * clampedStrength * intensity) * densityAlphaCorrection;
  const highlightAlpha = Math.min(reverse ? 0.65 : 0.62, 0.62 * clampedStrength * intensity) * densityAlphaCorrection;
  const shadowAlpha = Math.min(
    reverse ? 0.82 : 0.38,
    (reverse ? 0.9 : 0.38) * clampedStrength * intensity,
  ) * densityAlphaCorrection;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const tile of tiles) {
    const pts = tile.points.map((p) => ({
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale,
    }));

    // 1. Face shading (only for raised emboss)
    if (!reverse) {
      ctx.save();
      tracePolygonPath(ctx, pts);
      ctx.fillStyle = `rgba(255,255,255,${faceAlpha.toFixed(3)})`;
      ctx.fill();
      ctx.restore();
    }

    // 2. Ambient & Deep Inner Shadow (Deboss/Carved)
    if (reverse) {
      // Multiple passes to build a soft but deep recession
      for (let i = 1; i <= 4; i++) {
        ctx.save();
        tracePolygonPath(ctx, pts);
        ctx.clip();
        ctx.save();
        // Shift shadow into the top-left inner corner
        const layerOffset = bevelOffset * (0.2 + i * 0.2);
        ctx.translate(layerOffset, layerOffset);
        tracePolygonPath(ctx, pts);
        // Use a dark brownish tint for shadows to look more like wood grain depth
        ctx.strokeStyle = `rgba(28,15,10,${(shadowAlpha * (0.4 / i)).toFixed(3)})`;
        ctx.lineWidth = bevelLineWidth * (0.8 + i * 0.6);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      }
    }

    // 3. Groove/Carving Edge (The dark "cut" line)
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(0,0,0,${(reverse ? grooveAlpha * 1.2 : grooveAlpha).toFixed(3)})`;
    ctx.lineWidth = grooveWidth * (reverse ? 0.6 : 0.5);
    ctx.stroke();

    // 4. Highlight Bevel (Light hitting the rim/ledge)
    ctx.save();
    tracePolygonPath(ctx, pts);
    ctx.clip();
    ctx.save();
    // In deboss, light hits the bottom-right inner ledge
    const hOffset = reverse ? -bevelOffset * 0.8 : bevelOffset;
    ctx.translate(hOffset, hOffset);
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(255,255,255,${(reverse ? highlightAlpha * 0.95 : highlightAlpha).toFixed(3)})`;
    ctx.lineWidth = bevelLineWidth;
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // 5. Shadow Bevel (Top-left wall shadow)
    ctx.save();
    tracePolygonPath(ctx, pts);
    ctx.clip();
    ctx.save();
    const sOffset = reverse ? bevelOffset : -bevelOffset;
    ctx.translate(sOffset, sOffset);
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
    ctx.lineWidth = bevelLineWidth;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  ctx.restore();
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
  const useSwappedVitaMapping = usesSwappedVitaMaterialMapping(config.pattern.type);
  const useMaterialBackground = usesMaterialBackgroundVitaPattern(config.pattern.type);

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
        fallbackFill: useMaterialBackground ? fallbackFill : jointFill,
        image: useMaterialBackground ? options?.materialImage : options?.jointImage,
      });

      // Vita Pattern 3 intentionally inverts the usual Vita mapping so the inset faces use the
      // joint source while the surrounding frame/grid uses the main material source.
      if (useSwappedVitaMapping) {
        fillClosedPatternStrokes(ctx, bounds.x, bounds.y, scale, layout.strokes, {
          fallbackFill,
          image: options?.materialImage,
          imageDrawBox: worldImageDrawBox,
        });
      }

      for (const [tileIndex, tile] of layout.tiles.entries()) {
        const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
        fillMaterialSurface(ctx, {
          x: bounds.x + shape.bounds.x * scale,
          y: bounds.y + shape.bounds.y * scale,
          width: shape.bounds.width * scale,
          height: shape.bounds.height * scale,
          radius: 0,
          fallbackFill: useSwappedVitaMapping ? jointFill : fallbackFill,
          image: useSwappedVitaMapping ? options?.jointImage : options?.materialImage,
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
      if (useMaterialBackground && layout.strokes.length > 0) {
        drawMaterialBackgroundVitaGrooves(
          ctx,
          bounds.x,
          bounds.y,
          scale,
          layout.strokes,
          jointFill,
          options?.jointImage,
          jointImageDrawBox,
          embossDepth,
        );
      }
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

    drawEmbossEffect(ctx, bounds.x, bounds.y, scale, layout.tiles, embossStrength, {
      intensity: embossIntensity,
      depth: embossDepth,
      reverse: isVita,
    });
    drawEmbossStrokeEffect(ctx, bounds.x, bounds.y, scale, layout.strokes, embossStrength, {
      intensity: embossIntensity,
      depth: embossDepth,
      reverse: isVita,
    });
    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes)) {
      drawPatternStrokes(ctx, bounds.x, bounds.y, scale, layout.strokes);
    }

    return { x: bounds.x, y: bounds.y, width: frameWidth, height: frameHeight };
  }

  // Tiled background mode
  // 1. Fill base layer
  const useJointAsBackground = isVita && layout.tiles.length > 0 && !useMaterialBackground;

  if (useJointAsBackground) {
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
    drawEmbossEffect(cacheCtx, 0, 0, scale, layout.tiles, embossStrength, {
      intensity: embossIntensity,
      depth: embossDepth,
      reverse: isVita,
    });
    drawEmbossStrokeEffect(cacheCtx, 0, 0, scale, layout.strokes, embossStrength, {
      intensity: embossIntensity,
      depth: embossDepth,
      reverse: isVita,
    });
    if (useMaterialBackground && layout.strokes.length > 0) {
      drawMaterialBackgroundVitaGrooves(
        cacheCtx,
        0,
        0,
        scale,
        layout.strokes,
        jointFill,
        options?.jointImage,
        jointImageDrawBox,
        embossDepth,
      );
    }

    // For engraved Vita patterns, fill strokes with joint material in the cache
    if (isVita && layout.tiles.length === 0) {
      drawVitaStrokeJoints(
        cacheCtx,
        0,
        0,
        scale,
        layout.strokes,
        jointFill,
        options?.jointImage,
        jointImageDrawBox,
        embossDepth
      );
    }

    if (shouldDrawEmbossStrokeOutline(layout.tiles, layout.strokes)) {
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
  const repeatPhases = getPatternRepeatPhases(config, frameRepeat.width, frameRepeat.height);

  for (const phase of repeatPhases) {
    for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
      const offsetY = bounds.y + phase.y + yIndex * frameRepeat.height;
      for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
        const offsetX = bounds.x + phase.x + xIndex * frameRepeat.width;

        // Draw material tiles directly to main ctx to ensure global material coordination
        if (isVita && layout.tiles.length > 0) {
          if (useSwappedVitaMapping) {
            fillClosedPatternStrokes(ctx, offsetX, offsetY, scale, layout.strokes, {
              fallbackFill,
              image: options?.materialImage,
              imageDrawBox: worldImageDrawBox,
            });
          }

          for (const [tileIndex, tile] of layout.tiles.entries()) {
            const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
            fillMaterialSurface(ctx, {
              x: offsetX + shape.bounds.x * scale,
              y: offsetY + shape.bounds.y * scale,
              width: shape.bounds.width * scale,
              height: shape.bounds.height * scale,
              radius: 0,
              fallbackFill: useSwappedVitaMapping ? jointFill : fallbackFill,
              image: useSwappedVitaMapping ? options?.jointImage : options?.materialImage,
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

export function drawVitaStrokeJoints(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  strokes: ReadonlyArray<PatternStroke>,
  fallbackFill: string,
  image?: CanvasImageSource | null,
  imageDrawBox?: { x: number; y: number; width: number; height: number },
  depth = 100
) {
  if (!strokes.length) return;

  const normalizedDepth = depth / 100;
  // Visual width of the joint line, proportional to depth
  const strokeWidth = 3.5 * normalizedDepth * scale;

  for (const stroke of strokes) {
    fillMaterialSurface(ctx, {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      radius: 0,
      fallbackFill,
      image,
      imageDrawBox,
      isStroke: true,
      strokeWidth,
      isClosed: stroke.closed,
      clipPath: stroke.points.map((p) => ({
        x: offsetX + p.x * scale,
        y: offsetY + p.y * scale,
      })),
    });
  }
}

function drawMaterialBackgroundVitaGrooves(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  strokes: ReadonlyArray<PatternStroke>,
  fallbackFill: string,
  image?: CanvasImageSource | null,
  imageDrawBox?: { x: number; y: number; width: number; height: number },
  depth = 100,
) {
  drawVitaStrokeJoints(
    ctx,
    offsetX,
    offsetY,
    scale,
    strokes,
    fallbackFill,
    image,
    imageDrawBox,
    Math.max(60, depth),
  );
}
