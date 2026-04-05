import type { TextureConfig } from '@textura/shared';
import { getPatternLayout, type PatternTile } from './pattern-layouts';
import { resolvePatternRepeatFrame } from '../lib/pattern-repeat-semantics';
import { isVerticalPatternOrientation } from '../lib/pattern-orientation';
import type { EdgeProfileData } from '../lib/edge-style-assets';

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
  clipPath?: { x: number; y: number }[];
}

export interface TileRenderOptions {
  edgeProfiles?: EdgeProfileData[] | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sampleEdge(
  points: { x: number; y: number }[],
  count: number,
  mapper: (t: number) => { x: number; y: number },
  skipFirst = false,
) {
  const steps = Math.max(1, Math.round(count));
  for (let index = skipFirst ? 1 : 0; index <= steps; index++) {
    points.push(mapper(index / steps));
  }
}

function bell(t: number, power = 1.5) {
  return Math.pow(Math.sin(Math.PI * clamp(t, 0, 1)), power);
}

function wave(t: number, frequency: number, phase = 0) {
  return (
    Math.sin((t + phase) * Math.PI * frequency) * 0.62 +
    Math.sin((t * (frequency + 1.7) + phase * 0.6) * Math.PI) * 0.28 +
    Math.sin((t * (frequency * 0.5 + 2.3) - phase * 0.4) * Math.PI) * 0.1
  );
}

function buildChamferPath(x: number, y: number, width: number, height: number, cut: number) {
  const c = clamp(cut, 0, Math.min(width, height) / 2);
  return [
    { x: x + c, y },
    { x: x + width - c, y },
    { x: x + width, y: y + c },
    { x: x + width, y: y + height - c },
    { x: x + width - c, y: y + height },
    { x: x + c, y: y + height },
    { x, y: y + height - c },
    { x, y: y + c },
  ];
}

function buildBulgedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  amountX: number,
  amountY: number,
  mode: 'inset' | 'outset' | 'ogee' | 'waterfall',
) {
  const points: { x: number; y: number }[] = [];
  const topOffset = (t: number) => {
    const curved = bell(t, mode === 'waterfall' ? 2.4 : 1.5);
    if (mode === 'ogee') {
      return amountY * (Math.sin(Math.PI * t * 2) * 0.28 - curved * 0.18);
    }
    if (mode === 'waterfall') {
      const stepped = t < 0.22 || t > 0.78 ? 0 : curved;
      return -amountY * stepped;
    }
    return (mode === 'inset' ? 1 : -1) * amountY * curved;
  };
  const sideOffset = (t: number) => {
    const curved = bell(t, mode === 'waterfall' ? 2.1 : 1.4);
    if (mode === 'ogee') {
      return amountX * (Math.sin(Math.PI * (t - 0.5)) * 0.24 - curved * 0.16);
    }
    if (mode === 'waterfall') {
      const stepped = t < 0.18 || t > 0.82 ? 0 : curved;
      return -amountX * stepped;
    }
    return (mode === 'inset' ? -1 : 1) * amountX * curved;
  };

  sampleEdge(points, 8, (t) => ({ x: x + t * width, y: y + topOffset(t) }));
  sampleEdge(points, 6, (t) => ({ x: x + width + sideOffset(t), y: y + t * height }), true);
  sampleEdge(points, 8, (t) => ({ x: x + width - t * width, y: y + height - topOffset(t) }), true);
  sampleEdge(points, 6, (t) => ({ x: x - sideOffset(t), y: y + height - t * height }), true);

  return points;
}

function buildStandingSeamPath(x: number, y: number, width: number, height: number, seamWidth: number) {
  const seam = clamp(seamWidth, 0, Math.min(width, height) * 0.22);
  const inset = seam * 0.45;
  const upper = height * 0.22;
  const lower = height * 0.78;

  return [
    { x: x + inset, y },
    { x: x + width - inset, y },
    { x: x + width - inset, y: y + upper },
    { x: x + width + seam, y: y + upper },
    { x: x + width + seam, y: y + lower },
    { x: x + width - inset, y: y + lower },
    { x: x + width - inset, y: y + height },
    { x: x + inset, y: y + height },
    { x: x + inset, y: y + lower },
    { x: x - seam, y: y + lower },
    { x: x - seam, y: y + upper },
    { x: x + inset, y: y + upper },
  ];
}

function buildIrregularRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    ampX: number;
    ampY: number;
    freqX: number;
    freqY: number;
    phase: number;
    topBias?: number;
    rightBias?: number;
    bottomBias?: number;
    leftBias?: number;
  },
) {
  const {
    ampX,
    ampY,
    freqX,
    freqY,
    phase,
    topBias = 0,
    rightBias = 0,
    bottomBias = 0,
    leftBias = 0,
  } = options;
  const points: { x: number; y: number }[] = [];

  sampleEdge(points, Math.max(6, Math.round(freqX * 2)), (t) => ({
    x: x + t * width,
    y: y + (-ampY * wave(t, freqX, phase) + topBias * ampY * bell(t, 1.8)),
  }));
  sampleEdge(points, Math.max(5, Math.round(freqY * 2)), (t) => ({
    x: x + width + ampX * wave(t, freqY, phase + 0.17) + rightBias * ampX * bell(t, 1.6),
    y: y + t * height,
  }), true);
  sampleEdge(points, Math.max(6, Math.round(freqX * 2)), (t) => ({
    x: x + width - t * width,
    y: y + height + ampY * wave(t, freqX, phase + 0.31) + bottomBias * ampY * bell(t, 1.8),
  }), true);
  sampleEdge(points, Math.max(5, Math.round(freqY * 2)), (t) => ({
    x: x - ampX * wave(t, freqY, phase + 0.49) - leftBias * ampX * bell(t, 1.6),
    y: y + height - t * height,
  }), true);

  return points;
}

function hashTile(tile: PatternTile) {
  let hash = 2166136261;
  const values = [tile.x, tile.y, tile.width, tile.height, tile.rotation, tile.materialIndex];
  for (const value of values) {
    const normalized = Math.round(value * 100);
    hash ^= normalized;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sampleWrappedProfile(samples: number[], t: number) {
  if (samples.length === 0) return 0;
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * (samples.length - 1);
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(samples.length - 1, Math.ceil(scaled));
  const fraction = scaled - lowerIndex;
  const lower = samples[lowerIndex] ?? 0;
  const upper = samples[upperIndex] ?? lower;
  return lower + (upper - lower) * fraction;
}

function buildAssetProfileRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  profile: EdgeProfileData,
  seed: number,
  perimeterScale: number,
) {
  const points: { x: number; y: number }[] = [];
  const intensity = clamp(perimeterScale / 100, 0, 1);
  const aspectRatio = profile.intrinsicHeight / Math.max(profile.intrinsicWidth, 1);
  const repeatCount = 0.65 + intensity * 3.2;
  const topDepth = clamp(height * aspectRatio * (0.9 + intensity * 0.7), 1.5, height * (0.1 + intensity * 0.08));
  const sideDepth = clamp(height * aspectRatio * (0.7 + intensity * 0.55), 1.5, width * (0.025 + intensity * 0.02));
  const phase = (seed % 997) / 997;
  const topSamples = Math.max(profile.samples.length - 1, 18);
  const sideSamples = Math.max(Math.round(topSamples * (height / Math.max(width, 1))), 10);

  sampleEdge(points, topSamples, (t) => ({
    x: x + t * width,
    y: y + topDepth * sampleWrappedProfile(profile.samples, phase + t * repeatCount),
  }));
  sampleEdge(points, sideSamples, (t) => ({
    x: x + width - sideDepth * sampleWrappedProfile(profile.samples, phase + 0.23 + t * repeatCount),
    y: y + t * height,
  }), true);
  sampleEdge(points, topSamples, (t) => ({
    x: x + width - t * width,
    y: y + height - topDepth * sampleWrappedProfile(profile.samples, phase + 0.51 + t * repeatCount),
  }), true);
  sampleEdge(points, sideSamples, (t) => ({
    x: x + sideDepth * sampleWrappedProfile(profile.samples, phase + 0.77 + t * repeatCount),
    y: y + height - t * height,
  }), true);

  return points;
}

function buildEdgeStyleClipPath(
  style: string,
  x: number,
  y: number,
  width: number,
  height: number,
  perimeterScale: number,
  profileWidth: number,
  tile: PatternTile,
  edgeProfiles?: EdgeProfileData[] | null,
) {
  const intensity = clamp(perimeterScale / 100, 0, 1);
  const profile = clamp(profileWidth / 100, 0, 1);
  const minDimension = Math.max(1, Math.min(width, height));

  if (style === 'parged' && edgeProfiles?.length) {
    const profileIndex = hashTile(tile) % edgeProfiles.length;
    const selectedProfile = edgeProfiles[profileIndex]!;
    return buildAssetProfileRectPath(x, y, width, height, selectedProfile, hashTile(tile), perimeterScale);
  }

  if (style === 'parged') {
    return undefined;
  }

  switch (style) {
    case 'handmade':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.004 + intensity * 0.012),
        ampY: minDimension * (0.006 + intensity * 0.016),
        freqX: 4.8 + intensity * 1.4,
        freqY: 3.8 + intensity * 1.2,
        phase: 0.08,
      });
    case 'rough_brick':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.006 + intensity * 0.01),
        ampY: minDimension * (0.02 + intensity * 0.035),
        freqX: 6.8 + intensity * 2.8,
        freqY: 3.2 + intensity * 1.1,
        phase: 0.16,
      });
    case 'long_brick':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.004 + intensity * 0.008),
        ampY: minDimension * (0.012 + intensity * 0.018),
        freqX: 2 + intensity * 0.8,
        freqY: 2.5 + intensity * 0.7,
        phase: 0.21,
      });
    case 'rough':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.012 + intensity * 0.026),
        ampY: minDimension * (0.018 + intensity * 0.038),
        freqX: 7.2 + intensity * 2.8,
        freqY: 5.1 + intensity * 1.9,
        phase: 0.29,
      });
    case 'uneven':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.012 + intensity * 0.02),
        ampY: minDimension * (0.014 + intensity * 0.026),
        freqX: 3.5 + intensity * 1.4,
        freqY: 3 + intensity * 1.2,
        phase: 0.38,
        topBias: 0.35,
        rightBias: -0.2,
        bottomBias: 0.2,
        leftBias: -0.3,
      });
    case 'chamfer':
      return buildChamferPath(x, y, width, height, minDimension * (0.06 + profile * 0.18));
    case 'cove':
      return buildBulgedRectPath(
        x,
        y,
        width,
        height,
        minDimension * (0.02 + profile * 0.06),
        minDimension * (0.02 + profile * 0.06),
        'inset',
      );
    case 'standing_seam':
      return buildStandingSeamPath(x, y, width, height, minDimension * (0.03 + profile * 0.08));
    case 'ogee':
      return buildBulgedRectPath(
        x,
        y,
        width,
        height,
        minDimension * (0.02 + profile * 0.05),
        minDimension * (0.02 + profile * 0.05),
        'ogee',
      );
    case 'waterfall':
      return buildBulgedRectPath(
        x,
        y,
        width,
        height,
        minDimension * (0.015 + profile * 0.05),
        minDimension * (0.02 + profile * 0.05),
        'waterfall',
      );
    case 'wirecut':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * 0.004,
        ampY: minDimension * (0.006 + intensity * 0.012),
        freqX: 10 + intensity * 6,
        freqY: 7 + intensity * 3,
        phase: 0.44,
      });
    case 'recessed':
      return buildBulgedRectPath(
        x,
        y,
        width,
        height,
        minDimension * (0.03 + profile * 0.08),
        minDimension * (0.03 + profile * 0.08),
        'inset',
      );
    case 'protruding':
      return buildBulgedRectPath(
        x,
        y,
        width,
        height,
        minDimension * (0.025 + profile * 0.06),
        minDimension * (0.025 + profile * 0.06),
        'outset',
      );
    case 'rough_stone':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.02 + intensity * 0.04),
        ampY: minDimension * (0.022 + intensity * 0.045),
        freqX: 3.2 + intensity * 1.1,
        freqY: 2.7 + intensity * 1.1,
        phase: 0.57,
        topBias: 0.18,
        rightBias: 0.14,
        bottomBias: 0.2,
        leftBias: 0.16,
      });
    case 'parged':
      return buildIrregularRectPath(x, y, width, height, {
        ampX: minDimension * (0.005 + intensity * 0.008),
        ampY: minDimension * (0.005 + intensity * 0.01),
        freqX: 4 + intensity,
        freqY: 3.2 + intensity,
        phase: 0.63,
      });
    default:
      return undefined;
  }
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
  options?: TileRenderOptions,
): TileRenderBox {
  const applyInset = tile.applyJointInset !== false;
  const tileX = applyInset ? (config.joints.verticalSize * scale) / 2 : 0;
  const tileY = applyInset ? (config.joints.horizontalSize * scale) / 2 : 0;
  const tileWidth = applyInset ? tile.width * scale - config.joints.verticalSize * scale : tile.width * scale;
  const tileHeight = applyInset ? tile.height * scale - config.joints.horizontalSize * scale : tile.height * scale;
  const material = config.materials[tile.materialIndex] ?? config.materials[0];
  const edgeStyle = material?.edges.style ?? 'none';
  const cornerRadius =
    tile.clipPath?.length
      ? 0
      : edgeStyle === 'fine'
        ? Math.max(1, Math.min(tileWidth, tileHeight) * (0.035 + ((material?.edges.perimeterScale ?? 0) / 100) * 0.045))
        : edgeStyle === 'fillet'
          ? Math.max(3, Math.min(tileWidth, tileHeight) * (0.14 + ((material?.edges.profileWidth ?? 0) / 100) * 0.22))
          : edgeStyle === 'double_bullnose'
            ? Math.max(3, Math.min(tileWidth, tileHeight) * (0.22 + ((material?.edges.profileWidth ?? 0) / 100) * 0.18))
            : 0;
  const clipPath = tile.clipPath?.length
    ? fitClipPathToTile(tile.clipPath, scale, tileX, tileY, tileWidth, tileHeight)
    : buildEdgeStyleClipPath(
        edgeStyle,
        tileX,
        tileY,
        tileWidth,
        tileHeight,
        material?.edges.perimeterScale ?? 0,
        material?.edges.profileWidth ?? 0,
        tile,
        options?.edgeProfiles,
      );

  return {
    tileX,
    tileY,
    tileWidth,
    tileHeight,
    cornerRadius,
    clipPath,
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
  options?: TileRenderOptions,
) {
  const { tileX, tileY, tileWidth, tileHeight, cornerRadius, clipPath } = getTileRenderBox(tile, config, scale, options);
  if (clipPath?.length) {
    return polygonPathData(clipPath);
  }

  return roundedRectPathData(tileX, tileY, tileWidth, tileHeight, cornerRadius);
}
