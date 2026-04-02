import type { TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternTile } from './pattern-layouts';
import { resolvePatternRepeatFrame } from '../lib/pattern-repeat-semantics';
import { isVerticalPatternOrientation } from '../lib/pattern-orientation';

export interface PatternRenderFrame {
  layout: ReturnType<typeof getPatternLayout>;
  repeatWidth: number;
  repeatHeight: number;
  repeatOffsetX: number;
  repeatOffsetY: number;
  verticalOrientation: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
  drawOffsetX: number;
  drawOffsetY: number;
}

export interface TileRenderBox {
  tileX: number;
  tileY: number;
  tileWidth: number;
  tileHeight: number;
  cornerRadius: number;
}

export function computePatternRenderFrame(
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
  paddingFactor = 0.9,
): PatternRenderFrame {
  const layout = getPatternLayout(config);
  const repeatFrame = resolvePatternRepeatFrame(config, layout);
  const { repeatWidth, repeatHeight, repeatOffsetX, repeatOffsetY } = repeatFrame;
  const verticalOrientation = isVerticalPatternOrientation(config.pattern.orientation);
  const scaleX = canvasWidth / Math.max(repeatWidth, 1);
  const scaleY = canvasHeight / Math.max(repeatHeight, 1);
  const scale = Math.min(scaleX, scaleY) * paddingFactor;
  const offsetX = (canvasWidth - repeatWidth * scale) / 2;
  const offsetY = (canvasHeight - repeatHeight * scale) / 2;

  return {
    layout,
    repeatWidth,
    repeatHeight,
    repeatOffsetX,
    repeatOffsetY,
    verticalOrientation,
    scale,
    offsetX,
    offsetY,
    drawOffsetX: -repeatOffsetX * scale,
    drawOffsetY: -repeatOffsetY * scale,
  };
}

export function getTileRenderBox(
  tile: PatternTile,
  config: TextureConfig,
  scale: number,
): TileRenderBox {
  const applyInset = tile.applyJointInset !== false;
  const tileX = applyInset ? (config.joints.verticalSize * scale) / 2 : 0;
  const tileY = applyInset ? (config.joints.horizontalSize * scale) / 2 : 0;
  const tileWidth = applyInset ? tile.width * scale - config.joints.verticalSize * scale : tile.width * scale;
  const tileHeight = applyInset ? tile.height * scale - config.joints.horizontalSize * scale : tile.height * scale;
  const cornerRadius =
    tile.clipPath?.length
      ? 0
      : config.materials[tile.materialIndex]?.edges.style === 'handmade'
        ? 2
        : config.materials[tile.materialIndex]?.edges.style === 'rough'
          ? 3
          : 0;

  return {
    tileX,
    tileY,
    tileWidth,
    tileHeight,
    cornerRadius,
  };
}

export function fitClipPathToTile(
  clipPath: ReadonlyArray<{ x: number; y: number }>,
  scale: number,
  tileX: number,
  tileY: number,
  tileWidth: number,
  tileHeight: number,
) {
  const scaledPoints = clipPath.map((point) => ({
    x: point.x * scale,
    y: point.y * scale,
  }));

  const minX = Math.min(...scaledPoints.map((point) => point.x));
  const maxX = Math.max(...scaledPoints.map((point) => point.x));
  const minY = Math.min(...scaledPoints.map((point) => point.y));
  const maxY = Math.max(...scaledPoints.map((point) => point.y));
  const sourceWidth = Math.max(maxX - minX, 1);
  const sourceHeight = Math.max(maxY - minY, 1);

  return scaledPoints.map((point) => ({
    x: tileX + ((point.x - minX) / sourceWidth) * tileWidth,
    y: tileY + ((point.y - minY) / sourceHeight) * tileHeight,
  }));
}

export function polygonPathData(points: ReadonlyArray<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')} Z`;
}

export function roundedRectPathData(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (r === 0) {
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  }

  return [
    `M ${x + r} ${y}`,
    `H ${x + width - r}`,
    `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
    `V ${y + height - r}`,
    `A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + height - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ');
}

export function buildTilePathData(
  tile: PatternTile,
  config: TextureConfig,
  scale: number,
) {
  const { tileX, tileY, tileWidth, tileHeight, cornerRadius } = getTileRenderBox(tile, config, scale);
  if (tile.clipPath?.length) {
    return polygonPathData(fitClipPathToTile(tile.clipPath, scale, tileX, tileY, tileWidth, tileHeight));
  }

  return roundedRectPathData(tileX, tileY, tileWidth, tileHeight, cornerRadius);
}
