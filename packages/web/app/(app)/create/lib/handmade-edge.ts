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
  mode?: 'textured' | 'raw';
  points: ReadonlyArray<readonly [number, number]>;
}

export const PRESET_EDGE_WIDTH = 25;

const EDGE_PROFILES: Record<MaterialConfig['edges']['style'], EdgeProfileDefinition> = {
  none: {
    cornerFade: 0,
    mode: 'raw',
    points: [
      [0, 0],
      [100, 0],
    ],
  },
  fine: {
    cornerFade: 0,
    mode: 'raw',
    points: [
      [0, 0],
      [100, 0],
    ],
  },
  handmade: {
    cornerFade: 0.08,
    mode: 'textured',
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
  rough_brick: {
    cornerFade: 0.06,
    mode: 'textured',
    points: [
      [0, 0.2],
      [12, 1.1],
      [24, 2.8],
      [38, 1.3],
      [52, 3.5],
      [68, 1.6],
      [86, 3.9],
      [104, 1.1],
      [122, 3.1],
      [138, 0.8],
      [156, 2.9],
      [176, 1.4],
      [198, 4.2],
      [220, 1.2],
      [244, 3.6],
      [270, 0.6],
      [300, 0.3],
    ],
  },
  long_brick: {
    cornerFade: 0.04,
    mode: 'raw',
    points: [
      [0, 0.4],
      [16, 0.4],
      [22, 1.2],
      [78, 1.2],
      [84, 0.4],
      [100, 0.4],
    ],
  },
  rough: {
    cornerFade: 0.06,
    mode: 'textured',
    points: [
      [0, 0.1],
      [8, 1.2],
      [18, 3.8],
      [28, 1.4],
      [42, 4.8],
      [56, 1.8],
      [70, 4.4],
      [88, 0.9],
      [106, 3.1],
      [124, 1.3],
      [142, 4.2],
      [164, 0.7],
      [190, 2.9],
      [214, 1.7],
      [238, 3.7],
      [266, 0.5],
      [300, 0.1],
    ],
  },
  uneven: {
    cornerFade: 0.09,
    mode: 'textured',
    points: [
      [0, 1.8],
      [20, 1.5],
      [50, 1.1],
      [88, 0.9],
      [122, 0.7],
      [154, 0.5],
      [188, 0.8],
      [230, 1.3],
      [278, 1.9],
      [332, 1.1],
      [388, 0.6],
      [446, 1.2],
      [512, 2.1],
      [590, 1.4],
      [676, 0.8],
      [770, 1.7],
      [874, 0.5],
      [990, 1.2],
    ],
  },
  chamfer: {
    cornerFade: 0.02,
    mode: 'raw',
    points: [
      [0, 0],
      [10, 0],
      [22, 2.8],
      [78, 2.8],
      [90, 0],
      [100, 0],
    ],
  },
  fillet: {
    cornerFade: 0.04,
    mode: 'raw',
    points: [
      [0, 0],
      [8, 0.2],
      [18, 1.1],
      [32, 2.4],
      [50, 3.1],
      [68, 2.4],
      [82, 1.1],
      [92, 0.2],
      [100, 0],
    ],
  },
  cove: {
    cornerFade: 0.05,
    mode: 'raw',
    points: [
      [0, 0],
      [10, 0.4],
      [22, 1.8],
      [36, 3.6],
      [50, 4.4],
      [64, 3.6],
      [78, 1.8],
      [90, 0.4],
      [100, 0],
    ],
  },
  standing_seam: {
    cornerFade: 0.02,
    mode: 'raw',
    points: [
      [0, 0],
      [34, 0],
      [38, 3.5],
      [46, 3.5],
      [50, 0],
      [54, 0],
      [62, 3.5],
      [66, 3.5],
      [100, 0],
    ],
  },
  ogee: {
    cornerFade: 0.05,
    mode: 'raw',
    points: [
      [0, 0],
      [12, 0.4],
      [28, 2.6],
      [42, 1.1],
      [58, 3.4],
      [72, 1.2],
      [88, 0.3],
      [100, 0],
    ],
  },
  waterfall: {
    cornerFade: 0.04,
    mode: 'raw',
    points: [
      [0, 0],
      [12, 0.3],
      [32, 0.9],
      [50, 2.6],
      [68, 4.3],
      [84, 5.4],
      [100, 5.8],
    ],
  },
  double_bullnose: {
    cornerFade: 0.05,
    mode: 'raw',
    points: [
      [0, 0],
      [10, 0.2],
      [22, 1.8],
      [34, 0.6],
      [50, 0.1],
      [66, 0.6],
      [78, 1.8],
      [90, 0.2],
      [100, 0],
    ],
  },
  wirecut: {
    cornerFade: 0.03,
    mode: 'textured',
    points: [
      [0, 0],
      [10, 0.1],
      [20, 0],
      [30, 0.3],
      [40, 0.1],
      [50, 0.4],
      [60, 0.1],
      [70, 0.35],
      [80, 0.1],
      [90, 0.2],
      [100, 0],
    ],
  },
  recessed: {
    cornerFade: 0.01,
    mode: 'raw',
    points: [
      [0, 0],
      [8, 0],
      [8, 4.2],
      [92, 4.2],
      [92, 0],
      [100, 0],
    ],
  },
  protruding: {
    cornerFade: 0.03,
    mode: 'raw',
    points: [
      [0, 0],
      [12, 0],
      [24, -1.6],
      [50, -2.4],
      [76, -1.6],
      [88, 0],
      [100, 0],
    ],
  },
  rough_stone: {
    cornerFade: 0.08,
    mode: 'textured',
    points: [
      [0, 2.4],
      [18, 1.8],
      [46, 1.1],
      [78, 0.6],
      [116, 0.9],
      [168, 1.6],
      [228, 2.5],
      [304, 1.7],
      [390, 0.8],
      [486, 1.9],
      [598, 3.2],
      [720, 2.2],
      [860, 1.1],
      [1000, 2.6],
    ],
  },
  parged: {
    cornerFade: 0.06,
    mode: 'raw',
    points: [
      [0, 0.4],
      [18, 0.8],
      [42, 1.4],
      [64, 1.2],
      [86, 0.7],
      [100, 0.5],
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

export function isPresetEdgeStyle(style: MaterialConfig['edges']['style']) {
  return style !== 'none' && Boolean(EDGE_PROFILES[style]);
}

export function getDefaultEdgeWidth(style: MaterialConfig['edges']['style']) {
  return isPresetEdgeStyle(style) ? PRESET_EDGE_WIDTH : PRESET_EDGE_WIDTH;
}

export function getDefaultEdgeScale(style: MaterialConfig['edges']['style']) {
  return isPresetEdgeStyle(style) ? 1 : 1;
}

function getEdgeProfile(style: MaterialConfig['edges']['style']) {
  if (style === 'none') return null;
  return EDGE_PROFILES[style] ?? null;
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

function sampleProfileOffset(profile: EdgeProfileDefinition, t: number) {
  const profileValue = sampleProfileY(profile, t);
  if (profile.mode === 'raw') {
    return profileValue;
  }

  const baseLevel = profile.points.reduce((sum, [, y]) => sum + y, 0) / profile.points.length;
  return Math.max(0, profileValue - baseLevel * 0.35);
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

  for (let index = 0; index <= count; index++) {
    const t = index / count;
    const fadeIn = smoothstep(clamp(t / profile.cornerFade, 0, 1));
    const fadeOut = smoothstep(clamp((1 - t) / profile.cornerFade, 0, 1));
    const cornerWeight = Math.min(fadeIn, fadeOut);
    const offset = sampleProfileOffset(profile, t) * amplitude * cornerWeight;

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
