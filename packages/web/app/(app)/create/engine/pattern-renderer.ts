import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternTile } from './pattern-layouts';
import { getMaterialRenderableColor } from '../lib/material-assets';

export interface RenderedJoint {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

export interface PatternLayout {
  tiles: PatternTile[];
  joints: RenderedJoint[];
  totalWidth: number;
  totalHeight: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

export function computePatternLayout(config: TextureConfig): PatternLayout {
  const layout = getPatternLayout(config);
  return { ...layout, joints: [] };
}

export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const layout = computePatternLayout(config);
  const rng = seededRandom(config.seed);

  const scaleX = canvasWidth / Math.max(layout.totalWidth, 1);
  const scaleY = canvasHeight / Math.max(layout.totalHeight, 1);
  const scale = Math.min(scaleX, scaleY) * 0.9;
  const offsetX = (canvasWidth - layout.totalWidth * scale) / 2;
  const offsetY = (canvasHeight - layout.totalHeight * scale) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const jointColor = config.joints.tint ?? '#d4cfc6';
  ctx.fillStyle = jointColor;
  ctx.fillRect(offsetX, offsetY, layout.totalWidth * scale, layout.totalHeight * scale);

  for (const tile of layout.tiles) {
    const material = config.materials[tile.materialIndex] ?? config.materials[0]!;
    const selectedMaterial = material.definitionId ? getMaterialById(material.definitionId) : null;
    const baseColor = getMaterialRenderableColor(material.source, selectedMaterial?.swatchColor ?? '#b0a090');
    const variation = material.toneVariation;
    const tileColor = adjustBrightness(baseColor, (rng() - 0.5) * variation * 0.4);

    ctx.save();
    ctx.translate(offsetX + tile.x * scale, offsetY + tile.y * scale);
    if (tile.rotation !== 0) {
      ctx.translate((tile.width * scale) / 2, (tile.height * scale) / 2);
      ctx.rotate((tile.rotation * Math.PI) / 180);
      ctx.translate(-(tile.width * scale) / 2, -(tile.height * scale) / 2);
    }

    const tileX = (config.joints.verticalSize * scale) / 2;
    const tileY = (config.joints.horizontalSize * scale) / 2;
    const tileWidth = tile.width * scale - config.joints.verticalSize * scale;
    const tileHeight = tile.height * scale - config.joints.horizontalSize * scale;

    ctx.fillStyle = tileColor;
    const cornerRadius = material.edges.style === 'handmade' ? 2 : material.edges.style === 'rough' ? 3 : 0;
    if (cornerRadius > 0) {
      roundRect(ctx, tileX, tileY, tileWidth, tileHeight, cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(tileX, tileY, tileWidth, tileHeight);
    }

    if (material.edges.style !== 'none') {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      if (cornerRadius > 0) {
        roundRect(ctx, tileX, tileY, tileWidth, tileHeight, cornerRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(tileX, tileY, tileWidth, tileHeight);
      }
    }

    if (variation > 10) {
      ctx.globalAlpha = 0.03 + (variation / 100) * 0.05;
      for (let i = 0; i < 20; i++) {
        const nx = tileX + rng() * tileWidth;
        const ny = tileY + rng() * tileHeight;
        const size = 1 + rng() * 3;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(nx, ny, size, size);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  const shadowOpacity = config.joints.shadowOpacity / 100;
  if (shadowOpacity > 0) {
    ctx.strokeStyle = `rgba(0,0,0,${shadowOpacity * 0.4})`;
    ctx.lineWidth = Math.max(1, config.joints.horizontalSize * scale * 0.5);

    for (const tile of layout.tiles) {
      const tileX = offsetX + tile.x * scale + (config.joints.verticalSize * scale) / 2;
      const tileY = offsetY + tile.y * scale + (config.joints.horizontalSize * scale) / 2;
      const tileWidth = tile.width * scale - config.joints.verticalSize * scale;
      const tileHeight = tile.height * scale - config.joints.horizontalSize * scale;

      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileHeight + 1);
      ctx.lineTo(tileX + tileWidth, tileY + tileHeight + 1);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tileX + tileWidth + 1, tileY);
      ctx.lineTo(tileX + tileWidth + 1, tileY + tileHeight);
      ctx.stroke();
    }
  }

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(100, 140, 240, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX - 2, offsetY - 2, layout.totalWidth * scale + 4, layout.totalHeight * scale + 4);
  ctx.setLineDash([]);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + Math.round(amount * 255)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + Math.round(amount * 255)));
  const b = Math.max(0, Math.min(255, (num & 0xff) + Math.round(amount * 255)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
