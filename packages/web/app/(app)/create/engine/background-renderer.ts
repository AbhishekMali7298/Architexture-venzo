import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternTile } from './pattern-layouts';
import { getMaterialRenderableColor } from '../lib/material-assets';
import { fillMaterialSurface, tracePolygonPath, traceRoundedRectPath } from './material-fill';

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
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  edgeStyle: string,
  baseRgb: [number, number, number],
  toneVariation: number,
  rng: () => number,
  jointH: number,
  jointV: number,
  scale: number,
  textureBox: { x: number; y: number; width: number; height: number },
  materialImage?: CanvasImageSource | null,
) {
  const insetX = (jointV * scale) / 2;
  const insetY = (jointH * scale) / 2;
  const drawWidth = width * scale - jointV * scale;
  const drawHeight = height * scale - jointH * scale;

  ctx.save();
  ctx.translate(x + (width * scale) / 2, y + (height * scale) / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-(width * scale) / 2, -(height * scale) / 2);

  const delta = (rng() - 0.5) * toneVariation * 1.5;
  const imageDelta = materialImage ? 0 : delta;
  const radius =
    edgeStyle === 'handmade'
      ? 3 * scale
      : edgeStyle === 'rough'
        ? 5 * scale
        : edgeStyle === 'fine'
          ? 1.5 * scale
          : 0;

  const traceTilePath = () => {
    if (tile.clipPath?.length) {
      tracePolygonPath(
        ctx,
        tile.clipPath.map((point) => ({
          x: point.x * scale,
          y: point.y * scale,
        })),
      );
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

  const tileFill = rgbAdjust(baseRgb, imageDelta);
  fillMaterialSurface(ctx, {
    x: insetX,
    y: insetY,
    width: drawWidth,
    height: drawHeight,
    radius,
    fallbackFill: tileFill,
    image: materialImage,
    clipPath: tile.clipPath?.map((point) => ({
      x: point.x * scale,
      y: point.y * scale,
    })),
    imageDrawBox: materialImage
      ? {
          x: -(tile.x * scale),
          y: -(tile.y * scale),
          width: textureBox.width,
          height: textureBox.height,
        }
      : undefined,
  });

  if (materialImage && Math.abs(imageDelta) > 1.5) {
    ctx.save();
    traceTilePath();
    ctx.clip();
    ctx.fillStyle = imageDelta > 0 ? '#ffffff' : '#000000';
    ctx.globalAlpha = Math.min(0.04, Math.abs(imageDelta) / 120);
    ctx.fillRect(insetX, insetY, drawWidth, drawHeight);
    ctx.restore();
  }

  if (edgeStyle !== 'none') {
    ctx.save();
    ctx.globalAlpha = materialImage ? 0.03 : 0.07;
    ctx.fillStyle = '#fff';
    traceTilePath();
    ctx.clip();
    ctx.fillRect(insetX, insetY, drawWidth * 0.5, drawHeight * 0.2);
    ctx.fillRect(insetX, insetY, drawWidth * 0.2, drawHeight * 0.5);
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

  ctx.restore();
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: { materialImage?: CanvasImageSource | null; tileBackground?: boolean },
): { x: number; y: number; width: number; height: number } | null {
  const rng = seededRng(config.seed);
  const material = config.materials[0]!;
  const selectedMaterial = material.definitionId ? getMaterialById(material.definitionId) : null;
  const baseColor = getMaterialRenderableColor(material.source, selectedMaterial?.swatchColor ?? '#b8b0a8');
  const baseRgb = hexToRgb(baseColor);
  const jointColor = config.joints.tint ?? '#d4cfc6';
  const edgeStyle = material.edges.style;
  const toneVariation = material.toneVariation;
  const jointH = config.joints.horizontalSize;
  const jointV = config.joints.verticalSize;

  const layout = getPatternLayout(config);
  if (!layout.tiles.length) return null;

  const panelWidth = 320;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);

  const scaleX = (availableWidth * 0.94) / Math.max(layout.totalWidth, 1);
  const scaleY = (availableHeight * 0.94) / Math.max(layout.totalHeight, 1);
  const scale = Math.max(0.01, Math.min(scaleX, scaleY));
  const tileSetHeight = layout.totalHeight * scale;
  const tileSetWidth = layout.totalWidth * scale;
  const previewX = availableX + (availableWidth - tileSetWidth) / 2;
  const previewY = availableY + (availableHeight - tileSetHeight) / 2;

  ctx.fillStyle = jointColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const drawLayoutAt = (offsetX: number, offsetY: number) => {
    const textureBox = {
      x: offsetX,
      y: offsetY,
      width: tileSetWidth,
      height: tileSetHeight,
    };

    for (const tile of layout.tiles) {
      drawTile(
        ctx,
        tile,
        offsetX + tile.x * scale,
        offsetY + tile.y * scale,
        tile.width,
        tile.height,
        tile.rotation,
        edgeStyle,
        baseRgb,
        toneVariation,
        rng,
        jointH,
        jointV,
        scale,
        textureBox,
        options?.materialImage,
      );
    }
  };

  if (options?.tileBackground === false) {
    drawLayoutAt(previewX, previewY);
  } else {
    const startX = previewX - Math.ceil(previewX / Math.max(tileSetWidth, 1)) * tileSetWidth;
    const startY = previewY - Math.ceil(previewY / Math.max(tileSetHeight, 1)) * tileSetHeight;

    for (let y = startY; y < canvasHeight + tileSetHeight; y += tileSetHeight) {
      for (let x = startX; x < canvasWidth + tileSetWidth; x += tileSetWidth) {
        drawLayoutAt(x, y);
      }
    }
  }

  return {
    x: previewX,
    y: previewY,
    width: tileSetWidth,
    height: tileSetHeight,
  };
}

export function drawDottedBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.setLineDash([2, 6]);
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}
