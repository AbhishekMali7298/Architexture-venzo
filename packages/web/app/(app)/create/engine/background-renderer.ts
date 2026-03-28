import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout } from './pattern-layouts';
import { getMaterialRenderableColor } from '../lib/material-assets';
import { fillMaterialSurface, traceRoundedRectPath } from './material-fill';

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
  const radius =
    edgeStyle === 'handmade'
      ? 3 * scale
      : edgeStyle === 'rough'
        ? 5 * scale
        : edgeStyle === 'fine'
          ? 1.5 * scale
          : 0;

  const tileFill = rgbAdjust(baseRgb, delta);
  fillMaterialSurface(ctx, {
    x: insetX,
    y: insetY,
    width: drawWidth,
    height: drawHeight,
    radius,
    fallbackFill: tileFill,
    image: materialImage,
  });

  if (materialImage && Math.abs(delta) > 0.25) {
    ctx.save();
    if (radius > 0) {
      traceRoundedRectPath(ctx, insetX, insetY, drawWidth, drawHeight, radius);
    } else {
      ctx.beginPath();
      ctx.rect(insetX, insetY, drawWidth, drawHeight);
      ctx.closePath();
    }
    ctx.clip();
    ctx.fillStyle = delta > 0 ? '#ffffff' : '#000000';
    ctx.globalAlpha = Math.min(0.18, Math.abs(delta) / 60);
    ctx.fillRect(insetX, insetY, drawWidth, drawHeight);
    ctx.restore();
  }

  if (edgeStyle !== 'none') {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#fff';
    ctx.fillRect(insetX, insetY, drawWidth * 0.5, drawHeight * 0.2);
    ctx.fillRect(insetX, insetY, drawWidth * 0.2, drawHeight * 0.5);
    ctx.restore();
  }

  if (toneVariation > 15) {
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
  options?: { materialImage?: CanvasImageSource | null },
): void {
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
  if (!layout.tiles.length) return;

  const targetWidth = canvasWidth * 0.42;
  const scale = targetWidth / Math.max(layout.totalWidth, 1);
  const tileSetHeight = layout.totalHeight * scale;
  const tileSetWidth = layout.totalWidth * scale;

  ctx.fillStyle = jointColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let y = -tileSetHeight; y < canvasHeight + tileSetHeight; y += tileSetHeight) {
    for (let x = 0; x < canvasWidth + tileSetWidth; x += tileSetWidth) {
      for (const tile of layout.tiles) {
        drawTile(
          ctx,
          x + tile.x * scale,
          y + tile.y * scale,
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
          options?.materialImage,
        );
      }
    }
  }
}

export function drawDottedBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}
