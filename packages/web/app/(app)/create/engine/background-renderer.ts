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
) {
  const panelWidth = 336;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);
  
  // Use visual content dimensions for scaling the preview so everything fits on screen.
  const visualWidth = Math.max(1, layout.contentWidth);
  const visualHeight = Math.max(1, layout.contentHeight);
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
  const oneColumnLayout = getPatternLayout(cloneConfigWithPatternSize(config, config.pattern.rows, 1));
  const twoColumnLayout = getPatternLayout(cloneConfigWithPatternSize(config, config.pattern.rows, 2));
  const oneRowLayout = getPatternLayout(cloneConfigWithPatternSize(config, 1, config.pattern.columns));
  const twoRowLayout = getPatternLayout(cloneConfigWithPatternSize(config, 2, config.pattern.columns));

  return {
    x: Math.max(1, twoColumnLayout.totalWidth - oneColumnLayout.totalWidth),
    y: Math.max(1, twoRowLayout.totalHeight - oneRowLayout.totalHeight),
  };
}

function shouldExtendBackgroundByModule(config: TextureConfig) {
  return config.pattern.type === 'venzowood_3';
}

function getFrameRepeatSize(config: TextureConfig, layout: ReturnType<typeof getPatternLayout>, scale: number) {
  // Use logical repeat dimensions from the layout engine.
  // totalWidth/totalHeight already account for joints between modules.
  return {
    width: Math.max(1, layout.totalWidth * scale),
    height: Math.max(1, layout.totalHeight * scale),
  };
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

  const embossOffset = Math.max(0.1, (reverse ? 0.8 : 0.5) * normalizedStrength * depth);
  const strokeWidth = Math.max(0.4, (reverse ? 2.0 : 1.6) * normalizedStrength * depth);
  const highlightAlpha = Math.min(0.85, 0.9 * normalizedStrength * intensity);
  const shadowAlpha = Math.min(reverse ? 0.65 : 0.5, (reverse ? 0.8 : 0.6) * normalizedStrength * intensity);
  const baseAlpha = Math.min(0.3, 0.4 * normalizedStrength * intensity);

  const drawOffsetStroke = (deltaX: number, deltaY: number, color: string, alpha: number, customWidth?: number) => {
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

  // Shadow layer
  drawOffsetStroke(reverse ? -embossOffset : embossOffset, reverse ? -embossOffset : embossOffset, '#000000', shadowAlpha);
  
  // Highlight layer
  drawOffsetStroke(reverse ? embossOffset : -embossOffset, reverse ? embossOffset : -embossOffset, '#ffffff', highlightAlpha);
  
  // Center face layer (slightly thinner to create bevel effect)
  drawOffsetStroke(0, 0, '#ffffff', baseAlpha, strokeWidth * 0.7);
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
  const bevelOffset = Math.max(0.4, grooveWidth * 0.72) * (0.7 + clampedStrength * 0.3) * (reverse ? 1.2 : 1.0);
  const bevelLineWidth = grooveWidth * (0.85 + clampedStrength * 0.45);
  const highlightAlpha = Math.min(0.62, 0.62 * clampedStrength * intensity);
  const shadowAlpha = Math.min(reverse ? 0.58 : 0.38, (reverse ? 0.6 : 0.38) * clampedStrength * intensity);

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
      imageDrawBox: embossOptions?.reverse === false ? jointImageDrawBox : {
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
  const bounds = getPreviewBounds(layout, canvasWidth, canvasHeight);
  const scale = Math.min(
    bounds.width / Math.max(layout.totalWidth, 1),
    bounds.height / Math.max(layout.totalHeight, 1),
  );
  const frameWidth = layout.totalWidth * scale;
  const frameHeight = layout.totalHeight * scale;
  const jointFill = getJointRenderableColor(
    config.joints.materialSource,
    undefined,
    config.joints.adjustments,
  );
  const jointImageDrawBox = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  const isVita = isVitaComponentPattern(config.pattern.type);

  ctx.fillStyle = '#eee7dc';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);


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
        (contentWidth + bleed * 2), 
        (contentHeight + bleed * 2)
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
  const normalizedStrength = Math.max(0, Math.min(1, strength));
  if (normalizedStrength <= 0) return;

  const intensity = (options?.intensity ?? 100) / 100;
  const depth = (options?.depth ?? 100) / 100;
  const reverse = options?.reverse ?? false;

  const clampedStrength = Math.sqrt(normalizedStrength);

  // grooveWidth is kept stable across different pattern dimensions (visual consistency)
  const grooveWidth = 1.4 * depth * (0.7 + clampedStrength * 0.3) * (reverse ? 1.4 : 1.0);
  const bevelOffset = Math.max(0.4, grooveWidth * 0.72) * (0.7 + clampedStrength * 0.3) * (reverse ? 1.2 : 1.0);
  const bevelLineWidth = grooveWidth * (0.85 + clampedStrength * 0.45);
  const faceAlpha = 0.08 * clampedStrength * intensity * (reverse ? 2.5 : 1.0);
  const grooveAlpha = Math.min(0.42, 0.42 * clampedStrength * intensity);
  const highlightAlpha = Math.min(0.62, 0.62 * clampedStrength * intensity);
  const shadowAlpha = Math.min(reverse ? 0.58 : 0.38, (reverse ? 0.6 : 0.38) * clampedStrength * intensity);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const tile of tiles) {
    const pts = tile.points.map((p) => ({
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale,
    }));

    // 1. Face shading
    tracePolygonPath(ctx, pts);
    if (reverse) {
      // Recessed look: darken the face slightly
      ctx.fillStyle = `rgba(0,0,0,${(faceAlpha * 0.5).toFixed(3)})`;
    } else {
      // Raised look: brighten the face slightly
      ctx.fillStyle = `rgba(255,255,255,${faceAlpha.toFixed(3)})`;
    }
    ctx.fill();

    // 2. Groove
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(0,0,0,${grooveAlpha.toFixed(3)})`;
    ctx.lineWidth = grooveWidth * 0.5;
    ctx.stroke();

    // 3. Highlight Bevel
    ctx.save();
    tracePolygonPath(ctx, pts);
    ctx.clip();
    ctx.save();
    ctx.translate(reverse ? -bevelOffset : bevelOffset, reverse ? -bevelOffset : bevelOffset);
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(255,255,255,${highlightAlpha.toFixed(3)})`;
    ctx.lineWidth = bevelLineWidth;
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // 4. Shadow Bevel
    ctx.save();
    tracePolygonPath(ctx, pts);
    ctx.clip();
    ctx.save();
    ctx.translate(reverse ? bevelOffset : -bevelOffset, reverse ? bevelOffset : -bevelOffset);
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
  const bounds = getPreviewBounds(layout, canvasWidth, canvasHeight);
  const scale = Math.min(
    bounds.width / Math.max(layout.totalWidth, 1),
    bounds.height / Math.max(layout.totalHeight, 1),
  );
  const frameWidth = layout.totalWidth * scale;
  const frameHeight = layout.totalHeight * scale;
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
        (contentWidth + bleed * 2), 
        (contentHeight + bleed * 2)
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
