import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from '../lib/handmade-edge';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { getPatternLayout, type PatternTile } from '../lib/pattern-layout';
import { fillMaterialSurface, tracePolygonPath } from './material-fill';
import { renderJointProfile } from './joint-profile-renderer';
import { getToneVariationShift } from './tone-variation';

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

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointImage?: CanvasImageSource | null;
    tileBackground?: boolean;
  },
) {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(
    material.source,
    definition?.swatchColor ?? '#c8c8c8',
  );
  const bounds = getPreviewBounds(config, canvasWidth, canvasHeight);
  const layout = getPatternLayout(config);
  const scale = Math.min(
    bounds.width / Math.max(layout.totalWidth, 1),
    bounds.height / Math.max(layout.totalHeight, 1),
  );
  const frameWidth = layout.totalWidth * scale;
  const frameHeight = layout.totalHeight * scale;
  const jointFill = getJointRenderableColor(
    config.joints.materialSource,
    config.joints.tint,
    config.joints.adjustments,
  );

  ctx.fillStyle = '#eee7dc';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  fillMaterialSurface(ctx, {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    radius: 0,
    fallbackFill: jointFill,
    image: options?.jointImage,
    tintColor: config.joints.tint,
  });

  if (options?.tileBackground === false) {
    renderJointProfile(ctx, config, bounds, scale, layout.tiles, 'under');

    for (const [tileIndex, tile] of layout.tiles.entries()) {
      const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
      const toneShift = getToneVariationShift(material.toneVariation, config.seed, tileIndex, 0, 0);

      fillMaterialSurface(ctx, {
        x: bounds.x + shape.bounds.x * scale,
        y: bounds.y + shape.bounds.y * scale,
        width: shape.bounds.width * scale,
        height: shape.bounds.height * scale,
        radius: 0,
        fallbackFill,
        image: options?.materialImage,
        tintColor: material.tint,
        clipPath: shape.points.map((point) => ({
          x: bounds.x + point.x * scale,
          y: bounds.y + point.y * scale,
        })),
        imageDrawBox: {
          x: bounds.x + shape.bounds.x * scale,
          y: bounds.y + shape.bounds.y * scale,
          width: shape.bounds.width * scale,
          height: shape.bounds.height * scale,
        },
        toneShift,
      });
    }

    renderJointProfile(ctx, config, bounds, scale, layout.tiles, 'over');

    return {
      x: bounds.x,
      y: bounds.y,
      width: frameWidth,
      height: frameHeight,
    };
  }

  if (shouldExtendBackgroundByModule(config)) {
    const repeatStep = getModuleRepeatStep(config);
    const stepWidth = Math.max(1, repeatStep.x * scale);
    const stepHeight = Math.max(1, repeatStep.y * scale);
    const columnsBefore = Math.ceil(bounds.x / stepWidth) + 1;
    const columnsAfter = Math.ceil((canvasWidth - bounds.x - frameWidth) / stepWidth) + 1;
    const rowsBefore = Math.ceil(bounds.y / stepHeight) + 1;
    const rowsAfter = Math.ceil((canvasHeight - bounds.y - frameHeight) / stepHeight) + 1;
    const extendedConfig = cloneConfigWithPatternSize(
      config,
      config.pattern.rows + rowsBefore + rowsAfter,
      config.pattern.columns + columnsBefore + columnsAfter,
    );
    const extendedLayout = getPatternLayout(extendedConfig);
    const offsetX = bounds.x - columnsBefore * repeatStep.x * scale;
    const offsetY = bounds.y - rowsBefore * repeatStep.y * scale;

    renderJointProfile(
      ctx,
      config,
      {
        x: offsetX,
        y: offsetY,
        width: extendedLayout.totalWidth * scale,
        height: extendedLayout.totalHeight * scale,
      },
      scale,
      extendedLayout.tiles,
      'under',
    );

    for (const [tileIndex, tile] of extendedLayout.tiles.entries()) {
      const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
      const toneShift = getToneVariationShift(material.toneVariation, config.seed, tileIndex);
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
        toneShift,
      });
    }

    renderJointProfile(
      ctx,
      config,
      {
        x: offsetX,
        y: offsetY,
        width: extendedLayout.totalWidth * scale,
        height: extendedLayout.totalHeight * scale,
      },
      scale,
      extendedLayout.tiles,
      'over',
    );

    return {
      x: bounds.x,
      y: bounds.y,
      width: frameWidth,
      height: frameHeight,
    };
  }

  const tilesLeft = Math.ceil(bounds.x / Math.max(frameWidth, 1)) + 1;
  const tilesRight = Math.ceil((canvasWidth - bounds.x) / Math.max(frameWidth, 1)) + 1;
  const tilesAbove = Math.ceil(bounds.y / Math.max(frameHeight, 1)) + 1;
  const tilesBelow = Math.ceil((canvasHeight - bounds.y) / Math.max(frameHeight, 1)) + 1;

  for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
    const offsetY = bounds.y + yIndex * frameHeight;
    for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
      const offsetX = bounds.x + xIndex * frameWidth;

      renderJointProfile(
        ctx,
        config,
        {
          x: offsetX,
          y: offsetY,
          width: frameWidth,
          height: frameHeight,
        },
        scale,
        layout.tiles,
        'under',
      );

      for (const [tileIndex, tile] of layout.tiles.entries()) {
        const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
        const toneShift = getToneVariationShift(
          material.toneVariation,
          config.seed,
          tileIndex,
          xIndex,
          yIndex,
        );
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
          toneShift,
        });
      }

      renderJointProfile(
        ctx,
        config,
        {
          x: offsetX,
          y: offsetY,
          width: frameWidth,
          height: frameHeight,
        },
        scale,
        layout.tiles,
        'over',
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

function drawEmbossEffect(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  tiles: ReadonlyArray<PatternTile>,
  strength = 1,
) {
  const clampedStrength = Math.max(0, Math.min(2, strength));
  if (clampedStrength <= 0) return;

  // grooveWidth scales with tile density — wider when tiles are larger on screen
  const grooveWidth = Math.max(2, Math.min(8, scale * 6)) * (0.65 + clampedStrength * 0.45);
  const bevelOffset = Math.max(1, grooveWidth * 0.8) * (0.75 + clampedStrength * 0.25);
  const bevelLineWidth = grooveWidth * (1 + clampedStrength * 0.6);
  const faceAlpha = 0.09 * clampedStrength;
  const grooveAlpha = Math.min(0.76, 0.38 * clampedStrength);
  const highlightAlpha = Math.min(1, 0.5 * clampedStrength);
  const shadowAlpha = Math.min(0.5, 0.25 * clampedStrength);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const tile of tiles) {
    const pts = tile.points.map((p) => ({
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale,
    }));

    // 1. Slightly brighten the raised face (the interior of each cell is elevated)
    tracePolygonPath(ctx, pts);
    ctx.fillStyle = `rgba(255,255,255,${faceAlpha.toFixed(3)})`;
    ctx.fill();

    // 2. Groove (dark pressed-in valley between cells — straddles the boundary)
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(0,0,0,${grooveAlpha.toFixed(3)})`;
    ctx.lineWidth = grooveWidth * 0.5;
    ctx.stroke();

    // 3. Top-left bevel HIGHLIGHT
    // translate(+bevelOffset, +bevelOffset) shifts the path DOWN-RIGHT;
    // clipped to the tile interior, only the TOP and LEFT strips remain visible.
    ctx.save();
    tracePolygonPath(ctx, pts);
    ctx.clip();
    ctx.save();
    ctx.translate(bevelOffset, bevelOffset);
    tracePolygonPath(ctx, pts);
    ctx.strokeStyle = `rgba(255,255,255,${highlightAlpha.toFixed(3)})`;
    ctx.lineWidth = bevelLineWidth;
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // 4. Bottom-right bevel SHADOW
    // translate(-bevelOffset, -bevelOffset) shifts the path UP-LEFT;
    // clipped to the tile interior, only the BOTTOM and RIGHT strips remain visible.
    ctx.save();
    tracePolygonPath(ctx, pts);
    ctx.clip();
    ctx.save();
    ctx.translate(-bevelOffset, -bevelOffset);
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
    tileBackground?: boolean;
    embossStrength?: number;
  },
) {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(
    material.source,
    definition?.swatchColor ?? '#c8c8c8',
  );
  const bounds = getPreviewBounds(config, canvasWidth, canvasHeight);
  const layout = getPatternLayout(config);
  const scale = Math.min(
    bounds.width / Math.max(layout.totalWidth, 1),
    bounds.height / Math.max(layout.totalHeight, 1),
  );
  const frameWidth = layout.totalWidth * scale;
  const frameHeight = layout.totalHeight * scale;
  const embossStrength = (options?.embossStrength ?? 100) / 100;

  if (options?.tileBackground === false) {
    // Preview-only mode: fill preview area with material, emboss on top
    ctx.fillStyle = '#eee7dc';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    fillMaterialSurface(ctx, {
      x: bounds.x,
      y: bounds.y,
      width: frameWidth,
      height: frameHeight,
      radius: 0,
      fallbackFill,
      image: options?.materialImage,
      tintColor: material.tint,
    });

    drawEmbossEffect(ctx, bounds.x, bounds.y, scale, layout.tiles, embossStrength);

    return { x: bounds.x, y: bounds.y, width: frameWidth, height: frameHeight };
  }

  // Tiled background mode: fill entire canvas with continuous material
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
    tintColor: material.tint,
  });

  if (shouldExtendBackgroundByModule(config)) {
    const repeatStep = getModuleRepeatStep(config);
    const stepWidth = Math.max(1, repeatStep.x * scale);
    const stepHeight = Math.max(1, repeatStep.y * scale);
    const columnsBefore = Math.ceil(bounds.x / stepWidth) + 1;
    const columnsAfter = Math.ceil((canvasWidth - bounds.x - frameWidth) / stepWidth) + 1;
    const rowsBefore = Math.ceil(bounds.y / stepHeight) + 1;
    const rowsAfter = Math.ceil((canvasHeight - bounds.y - frameHeight) / stepHeight) + 1;
    const extendedConfig = cloneConfigWithPatternSize(
      config,
      config.pattern.rows + rowsBefore + rowsAfter,
      config.pattern.columns + columnsBefore + columnsAfter,
    );
    const extendedLayout = getPatternLayout(extendedConfig);
    const offsetX = bounds.x - columnsBefore * repeatStep.x * scale;
    const offsetY = bounds.y - rowsBefore * repeatStep.y * scale;

    drawEmbossEffect(ctx, offsetX, offsetY, scale, extendedLayout.tiles, embossStrength);

    return { x: bounds.x, y: bounds.y, width: frameWidth, height: frameHeight };
  }

  // Tile emboss lines across the canvas
  const tilesLeft = Math.ceil(bounds.x / Math.max(frameWidth, 1)) + 1;
  const tilesRight = Math.ceil((canvasWidth - bounds.x) / Math.max(frameWidth, 1)) + 1;
  const tilesAbove = Math.ceil(bounds.y / Math.max(frameHeight, 1)) + 1;
  const tilesBelow = Math.ceil((canvasHeight - bounds.y) / Math.max(frameHeight, 1)) + 1;

  for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
    const offsetY = bounds.y + yIndex * frameHeight;
    for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
      const offsetX = bounds.x + xIndex * frameWidth;
      drawEmbossEffect(ctx, offsetX, offsetY, scale, layout.tiles, embossStrength);
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
