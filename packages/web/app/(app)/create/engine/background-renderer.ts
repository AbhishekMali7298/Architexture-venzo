import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternStroke, type PatternTile } from './pattern-layouts';
import { getJointRenderableColor, getMaterialRenderableColor, mixHexColors } from '../lib/material-assets';
import { resolvePatternRepeatFrame } from '../lib/pattern-repeat-semantics';
import { isVerticalPatternOrientation } from '../lib/pattern-orientation';
import { fillMaterialSurface, tracePolygonPath, traceRoundedRectPath } from './material-fill';
import { getTileRenderBox } from './render-geometry';
import { renderJointRelief } from './joint-relief';
import type { EdgeProfileData } from '../lib/edge-style-assets';

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function tileSeed(masterSeed: number, tileX: number, tileY: number): number {
  const ix = Math.round(tileX * 100) | 0;
  const iy = Math.round(tileY * 100) | 0;
  return (masterSeed ^ (ix * 65537 + iy * 4099)) >>> 0;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = parseInt(clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbAdjust([r, g, b]: [number, number, number], delta: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value + delta)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: PatternTile,
  config: TextureConfig,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  baseRgb: [number, number, number],
  toneVariation: number,
  scale: number,
  tintColor?: string | null,
  materialImage?: CanvasImageSource | null,
  edgeProfiles?: EdgeProfileData[] | null,
) {
  const tileRng = seededRng(tileSeed(config.seed, tile.x, tile.y));
  const variationRatio = Math.max(0, Math.min(1, toneVariation / 100));
  ctx.save();
  ctx.translate(x + (width * scale) / 2, y + (height * scale) / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-(width * scale) / 2, -(height * scale) / 2);

  // Keep tone variation subtle to avoid large dark/light tile patches.
  const delta = (tileRng() - 0.5) * variationRatio * 12;
  const { tileX: insetX, tileY: insetY, tileWidth: drawWidth, tileHeight: drawHeight, cornerRadius: radius, clipPath } =
    getTileRenderBox(tile, config, scale, { edgeProfiles });
  const edgeStyle = (config.materials[tile.materialIndex] ?? config.materials[0])?.edges.style ?? 'none';

  const traceTilePath = () => {
    if (clipPath?.length) {
      tracePolygonPath(ctx, clipPath);
      return;
    }

    if (radius > 0) {
      traceRoundedRectPath(ctx, insetX, insetY, drawWidth, drawHeight, radius);
      return;
    }

    ctx.beginPath();
    ctx.rect(insetX, insetY, drawWidth, drawHeight);
    ctx.closePath();
  };

  const tileFill = rgbAdjust(baseRgb, delta);
  fillMaterialSurface(ctx, {
    x: insetX,
    y: insetY,
    width: drawWidth,
    height: drawHeight,
    radius,
    fallbackFill: tileFill,
    image: materialImage,
    tintColor,
    clipPath,
    randomCropFraction: materialImage ? { x: tileRng(), y: tileRng() } : undefined,
  });

  if (edgeStyle !== 'none' && !tile.skipEdgeStroke) {
    ctx.save();
    ctx.globalAlpha = materialImage ? 0.03 : 0.07;
    ctx.fillStyle = '#fff';
    traceTilePath();
    ctx.clip();
    ctx.fillRect(insetX, insetY, drawWidth * 0.5, drawHeight * 0.2);
    ctx.fillRect(insetX, insetY, drawWidth * 0.2, drawHeight * 0.5);
    ctx.restore();
  }

  if (materialImage && toneVariation > 0) {
    ctx.save();
    traceTilePath();
    ctx.clip();
    const variationDelta = (tileRng() - 0.5) * 2;
    const strength = Math.min(0.08, variationRatio * (0.01 + Math.abs(variationDelta) * 0.06));
    if (strength > 0.005) {
      ctx.globalCompositeOperation = variationDelta > 0 ? 'screen' : 'multiply';
      ctx.fillStyle = variationDelta > 0
        ? `rgba(255,255,255,${strength.toFixed(3)})`
        : `rgba(0,0,0,${strength.toFixed(3)})`;
      ctx.fillRect(insetX, insetY, drawWidth, drawHeight);
    }
    ctx.restore();
  }

  if (!materialImage && variationRatio > 0.35) {
    ctx.save();
    ctx.globalAlpha = 0.01 + variationRatio * 0.02;
    for (let i = 0; i < 12; i++) {
      const nx = insetX + tileRng() * drawWidth;
      const ny = insetY + tileRng() * drawHeight;
      ctx.fillStyle = tileRng() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(nx, ny, 1.5 * scale, 1.5 * scale);
    }
    ctx.restore();
  }

  ctx.restore();
}

interface PreparedBackgroundScene {
  config: TextureConfig;
  layout: ReturnType<typeof getPatternLayout>;
  scale: number;
  tileSetWidth: number;
  tileSetHeight: number;
  previewWidth: number;
  previewHeight: number;
  layoutDrawOffsetX: number;
  layoutDrawOffsetY: number;
  previewX: number;
  previewY: number;
  verticalOrientation: boolean;
  jointH: number;
  jointV: number;
  baseRgb: [number, number, number];
  toneVariation: number;
  jointColor: string;
  tintColor?: string | null;
  outline?: ReadonlyArray<{ x: number; y: number }>;
}

function traceStrokePath(
  ctx: CanvasRenderingContext2D,
  stroke: PatternStroke,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  if (!stroke.points.length) return;
  ctx.beginPath();
  ctx.moveTo(offsetX + stroke.points[0].x * scale, offsetY + stroke.points[0].y * scale);
  for (let index = 1; index < stroke.points.length; index++) {
    const point = stroke.points[index]!;
    ctx.lineTo(offsetX + point.x * scale, offsetY + point.y * scale);
  }
  if (stroke.closed) ctx.closePath();
}

function prepareBackgroundScene(
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
): PreparedBackgroundScene | null {
  const previewDensity = 1.02;
  const material = config.materials[0]!;
  const selectedMaterial = material.definitionId ? getMaterialById(material.definitionId) : null;
  const sourceColor = getMaterialRenderableColor(material.source, selectedMaterial?.swatchColor ?? '#b8b0a8');
  const baseColor = material.tint ? mixHexColors(sourceColor, material.tint, 0.88) : sourceColor;
  const baseRgb = hexToRgb(baseColor);
  const toneVariation = material.toneVariation;
  const jointH = config.joints.horizontalSize;
  const jointV = config.joints.verticalSize;
  const jointColorBase = getJointRenderableColor(config.joints.materialSource, config.joints.tint, config.joints.adjustments);
  const jointColor = jointColorBase;

  const layout = getPatternLayout(config);
  if (!layout.tiles.length && !layout.strokes.length) return null;
  const repeatFrame = resolvePatternRepeatFrame(config, layout);
  const { repeatWidth, repeatHeight, repeatOffsetX, repeatOffsetY } = repeatFrame;
  const previewWidth = repeatWidth;
  const previewHeight = repeatHeight;

  // Keep in sync with .panel width in create-editor.module.css
  const panelWidth = 336;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);

  const scaleX = (availableWidth * 0.94) / Math.max(previewWidth, 1);
  const scaleY = (availableHeight * 0.94) / Math.max(previewHeight, 1);
  const scale = Math.max(0.01, Math.min(scaleX, scaleY) * previewDensity);
  const tileSetHeight = repeatHeight * scale;
  const tileSetWidth = repeatWidth * scale;
  const scaledPreviewWidth = previewWidth * scale;
  const scaledPreviewHeight = previewHeight * scale;
  const previewX = availableX + (availableWidth - scaledPreviewWidth) / 2;
  const previewY = availableY + (availableHeight - scaledPreviewHeight) / 2;

  return {
    config,
    layout,
    scale,
    tileSetWidth,
    tileSetHeight,
    previewWidth: scaledPreviewWidth,
    previewHeight: scaledPreviewHeight,
    layoutDrawOffsetX: -repeatOffsetX * scale,
    layoutDrawOffsetY: -repeatOffsetY * scale,
    previewX,
    previewY,
    verticalOrientation: isVerticalPatternOrientation(config.pattern.orientation),
    jointH,
    jointV,
    jointColor,
    baseRgb,
    toneVariation,
    tintColor: material.tint,
    outline: repeatFrame.previewOutline,
  };
}

function drawPreparedLayout(
  ctx: CanvasRenderingContext2D,
  scene: PreparedBackgroundScene,
  offsetX: number,
  offsetY: number,
  options?: { materialImage?: CanvasImageSource | null; edgeProfiles?: EdgeProfileData[] | null },
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(offsetX, offsetY, scene.tileSetWidth, scene.tileSetHeight);
  ctx.clip();
  ctx.translate(offsetX, offsetY);
  if (scene.verticalOrientation) {
    ctx.translate(scene.tileSetWidth, 0);
    ctx.rotate(Math.PI / 2);
  }
  const drawOffsetX = scene.layoutDrawOffsetX;
  const drawOffsetY = scene.layoutDrawOffsetY;

  for (const tile of scene.layout.tiles) {
    drawTile(
      ctx,
      tile,
      scene.config,
      drawOffsetX + tile.x * scene.scale,
      drawOffsetY + tile.y * scene.scale,
      tile.width,
      tile.height,
      tile.rotation,
      scene.baseRgb,
      scene.toneVariation,
      scene.scale,
      scene.tintColor,
      options?.materialImage,
      options?.edgeProfiles,
    );
  }

  renderJointRelief({
    ctx,
    config: scene.config,
    tiles: scene.layout.tiles,
    repeatWidth: scene.previewWidth / scene.scale,
    repeatHeight: scene.previewHeight / scene.scale,
    scale: scene.scale,
    drawOffsetX,
    drawOffsetY,
    edgeProfiles: options?.edgeProfiles,
  });

  if (scene.layout.strokes.length > 0) {
    ctx.save();
    ctx.strokeStyle = scene.jointColor;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const stroke of scene.layout.strokes) {
      ctx.lineWidth = stroke.width
        ? Math.max(1, stroke.width * scene.scale)
        : Math.max(1, ((scene.jointH + scene.jointV) / 2) * scene.scale);
      traceStrokePath(ctx, stroke, scene.scale, drawOffsetX, drawOffsetY);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function createRepeatTileSurface(
  scene: PreparedBackgroundScene,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointMaterialImage?: CanvasImageSource | null;
    edgeProfiles?: EdgeProfileData[] | null;
  },
) {
  if (typeof document === 'undefined') return null;

  const surface = document.createElement('canvas');
  surface.width = Math.max(1, Math.ceil(scene.tileSetWidth));
  surface.height = Math.max(1, Math.ceil(scene.tileSetHeight));

  const surfaceCtx = surface.getContext('2d');
  if (!surfaceCtx) return null;

  fillMaterialSurface(surfaceCtx, {
    x: 0,
    y: 0,
    width: surface.width,
    height: surface.height,
    radius: 0,
    fallbackFill: scene.jointColor,
    image: options?.jointMaterialImage,
    tintColor: scene.config.joints.tint,
  });

  drawPreparedLayout(surfaceCtx, scene, 0, 0, {
    materialImage: options?.materialImage,
    edgeProfiles: options?.edgeProfiles,
  });

  return surface;
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointMaterialImage?: CanvasImageSource | null;
    tileBackground?: boolean;
    edgeProfiles?: EdgeProfileData[] | null;
  },
): { x: number; y: number; width: number; height: number; outline?: ReadonlyArray<{ x: number; y: number }> } | null {
  const scene = prepareBackgroundScene(config, canvasWidth, canvasHeight);
  if (!scene) return null;

  // Keep preview origin stable across redraws to avoid sub-pixel drift artifacts
  // when switching between patterns with different repeat dimensions.
  const previewX = Math.round(scene.previewX);
  const previewY = Math.round(scene.previewY);

  if (config.pattern.type === 'none') {
    fillMaterialSurface(ctx, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      radius: 0,
      fallbackFill: rgbAdjust(scene.baseRgb, 0),
      image: options?.materialImage,
      tintColor: scene.tintColor,
    });

    return {
      x: previewX,
      y: previewY,
      width: Math.max(0, scene.previewWidth),
      height: Math.max(0, scene.previewHeight),
      outline: scene.outline,
    };
  }

  fillMaterialSurface(ctx, {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    radius: 0,
    fallbackFill: scene.jointColor,
    image: options?.jointMaterialImage,
    tintColor: config.joints.tint,
  });

  const repeatTileSurface = options?.tileBackground === false ? createRepeatTileSurface(scene, options) : null;

  if (repeatTileSurface && options?.tileBackground === false) {
    const tileWidth = Math.max(1, repeatTileSurface.width);
    const tileHeight = Math.max(1, repeatTileSurface.height);
    ctx.drawImage(repeatTileSurface, previewX, previewY, tileWidth, tileHeight);
  } else if (options?.tileBackground === false) {
    drawPreparedLayout(ctx, scene, previewX, previewY, options);
  } else {
    const stepX = Math.max(scene.tileSetWidth, 1);
    const stepY = Math.max(scene.tileSetHeight, 1);

    // Anchor one tile exactly at the preview frame origin so dashed-border phase
    // and background seam phase stay locked, then draw outward in all directions.
    const tilesLeft = Math.ceil(previewX / stepX) + 1;
    const tilesRight = Math.ceil((canvasWidth - previewX) / stepX) + 1;
    const tilesAbove = Math.ceil(previewY / stepY) + 1;
    const tilesBelow = Math.ceil((canvasHeight - previewY) / stepY) + 1;

    for (let yIndex = -tilesAbove; yIndex <= tilesBelow; yIndex++) {
      const y = previewY + yIndex * stepY;
      for (let xIndex = -tilesLeft; xIndex <= tilesRight; xIndex++) {
        const x = previewX + xIndex * stepX;
        drawPreparedLayout(ctx, scene, x, y, options);
      }
    }
  }

  return {
    x: previewX,
    y: previewY,
    width: repeatTileSurface ? Math.max(1, repeatTileSurface.width) : Math.max(0, scene.previewWidth),
    height: repeatTileSurface ? Math.max(1, repeatTileSurface.height) : Math.max(0, scene.previewHeight),
    outline: scene.outline,
  };
}

export function drawDottedBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  outline?: ReadonlyArray<{ x: number; y: number }>,
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

  if (outline && outline.length > 1) {
    ctx.moveTo(snapX(x + outline[0]!.x * width), snapY(y + outline[0]!.y * height));
    for (let index = 1; index < outline.length; index++) {
      const point = outline[index]!;
      ctx.lineTo(snapX(x + point.x * width), snapY(y + point.y * height));
    }
    ctx.closePath();
  } else {
    const inset = ctx.lineWidth * 0.5;
    const rx = snapX(x + inset);
    const ry = snapY(y + inset);
    const rw = Math.max(0, Math.round(width - ctx.lineWidth));
    const rh = Math.max(0, Math.round(height - ctx.lineWidth));
    ctx.rect(rx, ry, rw, rh);
  }

  ctx.stroke();
  ctx.restore();
}
