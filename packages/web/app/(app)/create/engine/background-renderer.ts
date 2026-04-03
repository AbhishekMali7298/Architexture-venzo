import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternStroke, type PatternTile } from './pattern-layouts';
import { getJointRenderableColor, getMaterialRenderableColor, mixHexColors } from '../lib/material-assets';
import { resolvePatternRepeatFrame } from '../lib/pattern-repeat-semantics';
import { isVerticalPatternOrientation } from '../lib/pattern-orientation';
import { fillMaterialSurface, tracePolygonPath, traceRoundedRectPath } from './material-fill';
import { drawJointRelief } from './joint-relief';
import { getTileRenderBox } from './render-geometry';

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
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
  rng: () => number,
  scale: number,
  tintColor?: string | null,
  materialImage?: CanvasImageSource | null,
  recessJoints?: boolean,
  concaveJoints?: boolean,
  jointShadowOpacity?: number,
) {
  ctx.save();
  ctx.translate(x + (width * scale) / 2, y + (height * scale) / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-(width * scale) / 2, -(height * scale) / 2);

  const delta = (rng() - 0.5) * toneVariation * 1.5;
  const { tileX: insetX, tileY: insetY, tileWidth: drawWidth, tileHeight: drawHeight, cornerRadius: radius, clipPath } =
    getTileRenderBox(tile, config, scale);
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
    imageDrawBox: materialImage
      ? {
        x: insetX,
        y: insetY,
        width: Math.max(drawWidth, 1),
        height: Math.max(drawHeight, 1),
      }
      : undefined,
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
    const variationStrength = Math.min(0.16, 0.02 + Math.abs(delta) / 140);
    ctx.globalAlpha = variationStrength;
    ctx.fillStyle = delta >= 0 ? '#ffffff' : '#000000';
    ctx.fillRect(insetX, insetY, drawWidth, drawHeight);

    ctx.globalAlpha = 0.02 + (toneVariation / 100) * 0.05;
    for (let i = 0; i < 14; i++) {
      const nx = insetX + rng() * drawWidth;
      const ny = insetY + rng() * drawHeight;
      const size = 0.8 * scale + rng() * 1.6 * scale;
      ctx.fillStyle = rng() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(nx, ny, size, size);
    }
    ctx.restore();
  }

  if (!materialImage && toneVariation > 15) {
    ctx.save();
    ctx.globalAlpha = 0.025 + (toneVariation / 100) * 0.04;
    for (let i = 0; i < 12; i++) {
      const nx = insetX + rng() * drawWidth;
      const ny = insetY + rng() * drawHeight;
      ctx.fillStyle = rng() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(nx, ny, 1.5 * scale, 1.5 * scale);
    }
    ctx.restore();
  }

  drawJointRelief(ctx, {
    tracePath: traceTilePath,
    x: insetX,
    y: insetY,
    width: drawWidth,
    height: drawHeight,
    scale,
    shadowOpacity: jointShadowOpacity ?? 20,
    recess: recessJoints ?? false,
    concave: concaveJoints ?? false,
  });

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
  recessJoints: boolean;
  concaveJoints: boolean;
  shadowOpacity: number;
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
  if (!layout.tiles.length) return null;
  const repeatFrame = resolvePatternRepeatFrame(config, layout);
  const { repeatWidth, repeatHeight, repeatOffsetX, repeatOffsetY } = repeatFrame;
  const previewWidth = repeatWidth;
  const previewHeight = repeatHeight;

  const panelWidth = 380;
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
    recessJoints: config.joints.recess,
    concaveJoints: config.joints.concave,
    shadowOpacity: config.joints.shadowOpacity,
  };
}

function drawPreparedLayout(
  ctx: CanvasRenderingContext2D,
  scene: PreparedBackgroundScene,
  offsetX: number,
  offsetY: number,
  options?: { materialImage?: CanvasImageSource | null },
) {
  const rng = seededRng(0x9e3779b9);

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
      rng,
      scene.scale,
      scene.tintColor,
      options?.materialImage,
      scene.recessJoints,
      scene.concaveJoints,
      scene.shadowOpacity,
    );
  }

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

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    materialImage?: CanvasImageSource | null;
    jointMaterialImage?: CanvasImageSource | null;
    tileBackground?: boolean;
  },
): { x: number; y: number; width: number; height: number; outline?: ReadonlyArray<{ x: number; y: number }> } | null {
  const scene = prepareBackgroundScene(config, canvasWidth, canvasHeight);
  if (!scene) return null;

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
      x: scene.previewX,
      y: scene.previewY,
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

  if (options?.tileBackground === false) {
    drawPreparedLayout(ctx, scene, scene.previewX, scene.previewY, options);
  } else {
    const startX = scene.previewX - Math.ceil(scene.previewX / Math.max(scene.tileSetWidth, 1)) * scene.tileSetWidth;
    const startY = scene.previewY - Math.ceil(scene.previewY / Math.max(scene.tileSetHeight, 1)) * scene.tileSetHeight;

    for (let y = startY; y < canvasHeight + scene.tileSetHeight; y += scene.tileSetHeight) {
      for (let x = startX; x < canvasWidth + scene.tileSetWidth; x += scene.tileSetWidth) {
        drawPreparedLayout(ctx, scene, x, y, options);
      }
    }
  }

  return {
    x: scene.previewX,
    y: scene.previewY,
    width: Math.max(0, scene.previewWidth),
    height: Math.max(0, scene.previewHeight),
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
  ctx.save();
  ctx.setLineDash([2, 6]);
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();

  if (outline && outline.length > 1) {
    ctx.moveTo(x + outline[0]!.x * width, y + outline[0]!.y * height);
    for (let index = 1; index < outline.length; index++) {
      const point = outline[index]!;
      ctx.lineTo(x + point.x * width, y + point.y * height);
    }
    ctx.closePath();
  } else {
    ctx.rect(x, y, width, height);
  }

  ctx.stroke();
  ctx.restore();
}
