import type { MaterialConfig } from '@textura/shared';
import type { PatternPoint, PatternTile } from './pattern-layout';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileRenderShape {
  points: PatternPoint[];
  bounds: Bounds;
}

type SideLabel = 'top' | 'right' | 'bottom' | 'left';

interface EdgeProfileDefinition {
  cornerFade: number;
  points: ReadonlyArray<readonly [number, number]>;
}

const EDGE_PROFILES: Record<string, EdgeProfileDefinition> = {
  handmade: {
    cornerFade: 0.08,
    points: [
      [0, 1],
      [10, 1],
      [20, 2],
      [30, 2],
      [40, 3],
      [50, 3],
      [60, 3],
      [70, 2],
      [80, 2],
      [90, 1],
      [100, 1],
      [110, 1],
      [120, 0],
      [130, 1],
      [140, 3],
      [150, 2],
      [160, 2],
      [170, 1],
      [180, 1],
      [190, 1],
      [200, 2],
      [210, 0],
      [220, 1],
      [230, 1],
      [240, 3],
      [250, 3],
      [260, 2],
      [270, 3],
      [280, 1],
      [290, 1],
    ],
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function distance(a: PatternPoint, b: PatternPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function signedArea(points: ReadonlyArray<PatternPoint>) {
  let area = 0;
  for (let index = 0; index < points.length; index++) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function getOutwardNormal(start: PatternPoint, end: PatternPoint, clockwise: boolean) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  return clockwise
    ? { x: dy / length, y: -dx / length }
    : { x: -dy / length, y: dx / length };
}

function getInwardNormal(start: PatternPoint, end: PatternPoint, clockwise: boolean) {
  const outward = getOutwardNormal(start, end, clockwise);
  return { x: -outward.x, y: -outward.y };
}

function getEdgeProfile(style: MaterialConfig['edges']['style']) {
  if (style === 'handmade') return EDGE_PROFILES.handmade;
  return null;
}

function sampleProfileY(profile: EdgeProfileDefinition, t: number) {
  const maxX = profile.points[profile.points.length - 1]![0];
  const x = clamp(t, 0, 1) * maxX;

  for (let index = 0; index < profile.points.length - 1; index++) {
    const current = profile.points[index]!;
    const next = profile.points[index + 1]!;
    if (x >= current[0] && x <= next[0]) {
      const segmentT = current[0] === next[0] ? 0 : (x - current[0]) / (next[0] - current[0]);
      return lerp(current[1], next[1], segmentT);
    }
  }

  return profile.points[profile.points.length - 1]![1];
}

function buildProfileSidePoints(
  start: PatternPoint,
  end: PatternPoint,
  amplitude: number,
  profile: EdgeProfileDefinition,
  clockwise: boolean,
) {
  const length = distance(start, end);
  const count = Math.max(profile.points.length - 1, Math.round(length / 10));
  const normal = getInwardNormal(start, end, clockwise);
  const points: PatternPoint[] = [];
  const baseLevel = profile.points.reduce((sum, [, y]) => sum + y, 0) / profile.points.length;

  for (let index = 0; index <= count; index++) {
    const t = index / count;
    const fadeIn = smoothstep(clamp(t / profile.cornerFade, 0, 1));
    const fadeOut = smoothstep(clamp((1 - t) / profile.cornerFade, 0, 1));
    const cornerWeight = Math.min(fadeIn, fadeOut);
    const profileValue = sampleProfileY(profile, t);
    const centered = Math.max(0, profileValue - baseLevel * 0.35);
    const offset = centered * amplitude * cornerWeight;

    points.push({
      x: lerp(start.x, end.x, t) + normal.x * offset,
      y: lerp(start.y, end.y, t) + normal.y * offset,
    });
  }

  return points;
}

function computeBounds(points: ReadonlyArray<PatternPoint>): Bounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getTileRenderShape(
  tile: PatternTile,
  material: MaterialConfig,
  _seed: number,
  _tileIndex: number,
): TileRenderShape {
  const profile = getEdgeProfile(material.edges.style);
  if (!profile || tile.points.length !== 4) {
    return {
      points: tile.points,
      bounds: tile.bounds,
    };
  }

  const widthClamp = Number(material.edges.profileWidth || 25);
  const scale = clamp(Number(material.edges.perimeterScale || 1), 0.05, 4);
  const amplitude = clamp(scale * (widthClamp / 25), 0, widthClamp * 0.9);
  if (amplitude <= 0.001) {
    return {
      points: tile.points,
      bounds: tile.bounds,
    };
  }

  const clockwise = signedArea(tile.points) > 0;
  const exclude = new Set<SideLabel>(
    material.edges.excludeSides.map((side) => {
      if (side === 0) return 'top';
      if (side === 1) return 'right';
      if (side === 2) return 'bottom';
      return 'left';
    }),
  );
  const sideLabels: SideLabel[] = ['top', 'right', 'bottom', 'left'];
  const merged: PatternPoint[] = [];

  for (let index = 0; index < tile.points.length; index++) {
    const start = tile.points[index]!;
    const end = tile.points[(index + 1) % tile.points.length]!;
    const sideLabel = sideLabels[index]!;
    const sidePoints = exclude.has(sideLabel)
      ? [start, end]
      : buildProfileSidePoints(start, end, amplitude, profile, clockwise);
    merged.push(...sidePoints.slice(0, -1));
  }

  return {
    points: merged,
    bounds: computeBounds(merged),
  };
}
