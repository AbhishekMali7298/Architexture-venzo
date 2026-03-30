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

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return [0, 0, lightness];
  }

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return [hue * 60, saturation, lightness];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  let rgb: [number, number, number] = [0, 0, 0];

  if (segment >= 0 && segment < 1) rgb = [chroma, x, 0];
  else if (segment < 2) rgb = [x, chroma, 0];
  else if (segment < 3) rgb = [0, chroma, x];
  else if (segment < 4) rgb = [0, x, chroma];
  else if (segment < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  const match = l - chroma / 2;
  return rgb.map((value) => (value + match) * 255) as [number, number, number];
}

function applyAdjustmentsToHex(
  hex: string,
  adjustments: TextureConfig['joints']['adjustments'],
) {
  let [r, g, b] = hexToRgb(hex);

  if (adjustments.invertColors) {
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
  }

  const brightnessDelta = (adjustments.brightness / 100) * 255;
  r += brightnessDelta;
  g += brightnessDelta;
  b += brightnessDelta;

  const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
  r = contrastFactor * (r - 128) + 128;
  g = contrastFactor * (g - 128) + 128;
  b = contrastFactor * (b - 128) + 128;

  let [h, s, l] = hexToHsl(rgbToHex([r, g, b]));
  h += adjustments.hue;
  s = Math.max(0, Math.min(1, s * (1 + adjustments.saturation / 100)));

  return rgbToHex(hslToRgb(h, s, l));
}

function blendHex(baseHex: string, tintHex: string, strength: number) {
  const base = hexToRgb(baseHex);
  const tint = hexToRgb(tintHex);
  const mix = Math.max(0, Math.min(1, strength));
  return rgbToHex([
    base[0] + (tint[0] - base[0]) * mix,
    base[1] + (tint[1] - base[1]) * mix,
    base[2] + (tint[2] - base[2]) * mix,
  ]);
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
  tintColor?: string | null,
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
    tintColor,
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

  if (materialImage && toneVariation > 0) {
    ctx.save();
    traceTilePath();
    ctx.clip();
    ctx.globalAlpha = 0.015 + (toneVariation / 100) * 0.03;
    for (let i = 0; i < 10; i++) {
      const nx = insetX + rng() * drawWidth;
      const ny = insetY + rng() * drawHeight;
      const size = 0.8 * scale + rng() * 1.2 * scale;
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

  ctx.restore();
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  options?: { materialImage?: CanvasImageSource | null; tileBackground?: boolean },
): { x: number; y: number; width: number; height: number } | null {
  const previewDensity = 0.82;
  const rng = seededRng(config.seed);
  const material = config.materials[0]!;
  const selectedMaterial = material.definitionId ? getMaterialById(material.definitionId) : null;
  const sourceColor = getMaterialRenderableColor(material.source, selectedMaterial?.swatchColor ?? '#b8b0a8');
  const baseColor = material.tint ? blendHex(sourceColor, material.tint, 0.88) : sourceColor;
  const baseRgb = hexToRgb(baseColor);
  const jointColor = applyAdjustmentsToHex(config.joints.tint ?? '#d4cfc6', config.joints.adjustments);
  const edgeStyle = material.edges.style;
  const toneVariation = material.toneVariation;
  const jointH = config.joints.horizontalSize;
  const jointV = config.joints.verticalSize;

  const layout = getPatternLayout(config);
  if (!layout.tiles.length) return null;

  const panelWidth = 410;
  const outerPadding = 40;
  const availableX = panelWidth + outerPadding;
  const availableY = outerPadding;
  const availableWidth = Math.max(160, canvasWidth - availableX - outerPadding);
  const availableHeight = Math.max(160, canvasHeight - outerPadding * 2);

  const scaleX = (availableWidth * 0.94) / Math.max(layout.totalWidth, 1);
  const scaleY = (availableHeight * 0.94) / Math.max(layout.totalHeight, 1);
  const scale = Math.max(0.01, Math.min(scaleX, scaleY) * previewDensity);
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
        material.tint,
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
