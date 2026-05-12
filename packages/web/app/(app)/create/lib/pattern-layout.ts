import type { TextureConfig } from '@textura/shared';
import { getPatternByType } from '@textura/shared';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';
import { getCachedSvgPatternModule, hasSvgPatternModule } from './svg-pattern-module-cache';

export interface PatternPoint {
  x: number;
  y: number;
}

export interface PatternTile {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  points: PatternPoint[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PatternStroke {
  points: PatternPoint[];
  closed: boolean;
}

export interface PatternLayout {
  tiles: PatternTile[];
  strokes: PatternStroke[];
  totalWidth: number; // Logical repeat interval
  totalHeight: number; // Logical repeat interval
  contentWidth: number; // Visual bounding box
  contentHeight: number; // Visual bounding box
}

/**
 * Calculate the visual bounding box of all tiles and strokes in a layout.
 */
function getLayoutContentMax(layout: {
  tiles: ReadonlyArray<PatternTile>;
  strokes?: ReadonlyArray<PatternStroke>;
}) {
  const tileMax = layout.tiles.reduce(
    (bounds, tile) => ({
      x: Math.max(bounds.x, tile.bounds.x + tile.bounds.width),
      y: Math.max(bounds.y, tile.bounds.y + tile.bounds.height),
    }),
    { x: 0, y: 0 },
  );

  if (!layout.strokes?.length) {
    return tileMax;
  }

  return layout.strokes.reduce(
    (bounds, stroke) => {
      for (const point of stroke.points) {
        bounds.x = Math.max(bounds.x, point.x);
        bounds.y = Math.max(bounds.y, point.y);
      }
      return bounds;
    },
    { ...tileMax },
  );
}

function getFallbackSvgPatternLayout(config: TextureConfig): PatternLayout {
  const stackLayout = getStackTiles(config);

  return {
    tiles: stackLayout.tiles,
    strokes: [],
    totalWidth: stackLayout.totalWidth,
    totalHeight: stackLayout.totalHeight,
    contentWidth: stackLayout.totalWidth,
    contentHeight: stackLayout.totalHeight,
  };
}

const SQRT_2 = Math.SQRT2;

function degreesToRadians(angle: number) {
  return (angle * Math.PI) / 180;
}

function getPointsBounds(points: PatternPoint[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, maxX, minY, maxY };
}

function roundLayoutValue(value: number) {
  return Math.round(value * 1000) / 1000;
}

function buildVitaPattern13VerticalSeamStrokes(
  strokes: ReadonlyArray<PatternStroke>,
  repeatWidth: number,
  repeatStepHeight: number,
) {
  if (strokes.length < 2) {
    return [] as PatternStroke[];
  }

  type SeamAnchor = { x: number; y: number };
  const anchors: SeamAnchor[] = [];
  const repeatHeight = Math.max(1, repeatStepHeight);
  const gapThreshold = Math.max(8, repeatWidth * 0.018);
  const yThreshold = Math.max(2, repeatHeight * 0.01);
  const rowBuckets = new Map<number, { starts: PatternPoint[]; ends: PatternPoint[] }>();

  for (const stroke of strokes) {
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    if (!start || !end) continue;

    const bucketKey = Math.round(((start.y + end.y) * 0.5) / yThreshold);
    const bucket = rowBuckets.get(bucketKey) ?? { starts: [], ends: [] };
    bucket.starts.push(start);
    bucket.ends.push(end);
    rowBuckets.set(bucketKey, bucket);
  }

  for (const bucket of rowBuckets.values()) {
    const starts = [...bucket.starts].sort((left, right) => left.x - right.x);
    const ends = [...bucket.ends].sort((left, right) => left.x - right.x);
    const wrappedStarts = starts
      .map((point, index) => ({
        point,
        x: point.x + (index === 0 ? repeatWidth : 0),
      }))
      .sort((left, right) => left.x - right.x);
    let endIndex = 0;

    for (const { point: start, x: startX } of wrappedStarts) {
      while (endIndex < ends.length && ends[endIndex]!.x < startX - gapThreshold) {
        endIndex++;
      }

      const candidates = [ends[endIndex - 1], ends[endIndex], ends[endIndex + 1]].filter(
        (point): point is PatternPoint => !!point,
      );

      let bestEnd: PatternPoint | null = null;
      let bestGap = Infinity;

      for (const candidate of candidates) {
        const gap = startX - candidate.x;
        if (gap < -0.001 || gap > gapThreshold) continue;
        if (Math.abs(candidate.y - start.y) > yThreshold) continue;
        if (gap < bestGap) {
          bestGap = gap;
          bestEnd = candidate;
        }
      }

      if (!bestEnd) continue;

      anchors.push({
        x: (bestEnd.x + startX) * 0.5,
        y: (bestEnd.y + start.y) * 0.5,
      });
    }
  }

  if (anchors.length < 2) {
    return [] as PatternStroke[];
  }

  const xGroupThreshold = Math.max(6, repeatWidth * 0.01);
  const groups: SeamAnchor[][] = [];

  for (const anchor of anchors) {
    const group = groups.find(
      (candidate) => Math.abs(candidate[0]!.x - anchor.x) <= xGroupThreshold,
    );
    if (group) {
      group.push(anchor);
    } else {
      groups.push([anchor]);
    }
  }

  const seamStrokes: PatternStroke[] = [];

  for (const group of groups) {
    group.sort((left, right) => left.y - right.y);
    const first = group[0];
    if (!first) continue;

    // Repeat one seam segment per module instance. This avoids the odd/even
    // skipping that can happen when we try to infer row-to-row links globally.
    seamStrokes.push({
      closed: false,
      points: [
        { x: first.x, y: first.y },
        { x: first.x, y: first.y + repeatStepHeight },
      ],
    });
  }

  return seamStrokes;
}

function buildTileFromAnchor(
  anchorX: number,
  anchorY: number,
  angle: number,
  width: number,
  height: number,
): PatternTile {
  const radians = degreesToRadians(angle);
  const ux = Math.cos(radians);
  const uy = Math.sin(radians);
  const vx = -Math.sin(radians);
  const vy = Math.cos(radians);

  const points = [
    { x: anchorX, y: anchorY },
    { x: anchorX + ux * width, y: anchorY + uy * width },
    { x: anchorX + ux * width + vx * height, y: anchorY + uy * width + vy * height },
    { x: anchorX + vx * height, y: anchorY + vy * height },
  ];

  const bounds = getPointsBounds(points);
  const { minX, maxX, minY, maxY } = bounds;

  return {
    x: anchorX,
    y: anchorY,
    width,
    height,
    angle,
    points,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

function buildTileFromPoints(points: PatternPoint[]): PatternTile {
  const bounds = getPointsBounds(points);
  const { minX, maxX, minY, maxY } = bounds;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    angle: 0,
    points,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

function getDimensions(config: TextureConfig) {
  const material = config.materials[0]!;
  const tileWidth = Math.max(1, material.width);
  const tileHeight = Math.max(1, material.height);
  const minJointHorizontal = -tileHeight + 1;
  const minJointVertical = -tileWidth + 1;

  return {
    columns: Math.max(1, Math.floor(config.pattern.columns || 1)),
    rows: Math.max(1, Math.floor(config.pattern.rows || 1)),
    tileWidth,
    tileHeight,
    jointHorizontal: Math.max(minJointHorizontal, config.joints.horizontalSize),
    jointVertical: Math.max(minJointVertical, config.joints.verticalSize),
  };
}

function getStackTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const stepX = tileWidth + jointVertical;
  const stepY = tileHeight + jointHorizontal;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      tiles.push(buildTileFromAnchor(column * stepX, row * stepY, 0, tileWidth, tileHeight));
    }
  }

  return {
    tiles,
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
  };
}

function getStaggeredTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const angle = config.pattern.angle || 0;
  const radians = degreesToRadians(angle);
  const stepX = tileWidth + jointVertical;
  const stepY = tileHeight + jointHorizontal;

  // When patternAngle > 0: diagonal shift per row (like competitor's angled Staggered).
  // When patternAngle = 0: classic running bond with alternating half-step offset.
  const rowShiftX = angle === 0 ? stepX / 2 : tileWidth * Math.sin(radians);

  // Total dimensions are FIXED (like the competitor): width = columns * stepX, height = rows * stepY.
  // Extra tiles extend past these boundaries to cover edge gaps from row offsets.
  const totalWidth = columns * stepX;
  const totalHeight = rows * stepY;

  // Calculate the maximum row offset across all rows.
  const maxOffset = (rows - 1) * rowShiftX;

  // Generate enough tiles per row to cover totalWidth plus the maximum offset.
  // This ensures tiles extend past the nominal boundaries to fill edge gaps.
  const tilesPerRow = Math.ceil((totalWidth + maxOffset) / stepX) + 1;

  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offsetX = row * rowShiftX;

    for (let column = 0; column < tilesPerRow; column++) {
      tiles.push(
        buildTileFromAnchor(offsetX + column * stepX, row * stepY, 0, tileWidth, tileHeight),
      );
    }
  }

  return {
    tiles,
    totalWidth,
    totalHeight,
  };
}

function getStretcherTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const stepX = tileWidth + jointVertical;
  const stepY = tileHeight + jointHorizontal;
  const rowOffset = stepX / 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offsetX = row % 2 === 0 ? -rowOffset : 0;
    for (let column = 0; column < columns; column++) {
      tiles.push(
        buildTileFromAnchor(offsetX + column * stepX, row * stepY, 0, tileWidth, tileHeight),
      );
    }
  }

  return {
    tiles,
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
  };
}

function getHerringboneTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const jointSize = (jointHorizontal + jointVertical) / 2;
  const rowPitch = (tileHeight + jointSize) * SQRT_2;
  const pairPitch = (tileWidth + jointSize) * SQRT_2;
  const switchPitch = (tileWidth + tileHeight + jointSize) / SQRT_2;
  const evenAnchorX = -tileHeight / SQRT_2;
  const evenAnchorY = tileHeight / SQRT_2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const rowBaseY = evenAnchorY + row * rowPitch;
    for (let column = 0; column < columns; column++) {
      const pairIndex = Math.floor(column / 2);
      const isOddTile = column % 2 === 1;
      const anchorX = evenAnchorX + pairIndex * pairPitch + (isOddTile ? switchPitch : 0);
      const anchorY = rowBaseY + (isOddTile ? -switchPitch : 0);
      const angle = isOddTile ? 45 : -45;
      tiles.push(buildTileFromAnchor(anchorX, anchorY, angle, tileWidth, tileHeight));
    }
  }

  return {
    tiles,
    totalWidth: Math.ceil(columns / 2) * pairPitch,
    totalHeight: rows * rowPitch,
  };
}

/**
 * Build a parallelogram tile for Chevron pattern.
 * Unlike buildTileFromAnchor (which creates rotated rectangles),
 * chevron tiles are parallelograms with slanted side edges.
 */
function buildParallelogramTile(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  slantAngleDeg: number,
): PatternTile {
  const radians = degreesToRadians(slantAngleDeg);
  const slantY = width * Math.tan(radians);

  // Parallelogram corners: anchor → right-slanted → right-slanted+down → down
  const points = [
    { x: anchorX, y: anchorY },
    { x: anchorX + width, y: anchorY + slantY },
    { x: anchorX + width, y: anchorY + slantY + height },
    { x: anchorX, y: anchorY + height },
  ];

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: anchorX,
    y: anchorY,
    width,
    height,
    angle: slantAngleDeg,
    points,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

function getChevronTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const angle = config.pattern.angle || 30;
  const radians = degreesToRadians(angle);

  const tanAngle = Math.tan(radians);
  const cosAngle = Math.cos(radians);

  // Column step: horizontal spacing between adjacent columns
  // dx = tileWidth + jointVertical (pure horizontal gap)
  // dy = -tileWidth * tan(angle) — slant offset for alternating columns
  const colStepX = tileWidth + jointVertical;
  const colStepY = -tileWidth * tanAngle;

  // Row step: vertical spacing between adjacent rows
  // dx = 0 (columns stack directly on top of each other)
  // dy = tileHeight + jointHorizontal / cos(angle) — gap measured perpendicular to slanted edge
  const rowStepY = tileHeight + jointHorizontal / cosAngle;

  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const isOdd = column % 2 === 1;

      // Anchor position
      const anchorX = column * colStepX;
      const anchorY = row * rowStepY + (isOdd ? colStepY : 0);

      // Slant direction: even cols slant one way, odd cols the opposite
      const slantAngle = isOdd ? angle : -angle;

      tiles.push(buildParallelogramTile(anchorX, anchorY, tileWidth, tileHeight, slantAngle));
    }
  }

  const totalWidth = columns * colStepX;
  const totalHeight = rows * rowStepY;

  return { tiles, totalWidth, totalHeight };
}

function getFlemishTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const fullWidth = tileWidth;
  const halfWidth = (tileWidth - jointVertical) / 2;
  const fullStepX = fullWidth + jointVertical;
  const halfStepX = halfWidth + jointVertical;
  const rowStepY = tileHeight + jointHorizontal;
  const oddRowOffsetX = -(fullWidth * 0.75 + jointVertical * 0.75);
  const tiles: PatternTile[] = [];

  let totalWidth = 0;

  for (let row = 0; row < rows; row++) {
    let cursorX = row % 2 === 1 ? oddRowOffsetX : 0;
    const cursorY = row * rowStepY;

    for (let column = 0; column < columns; column++) {
      const currentWidth = column % 2 === 0 ? fullWidth : halfWidth;
      tiles.push(buildTileFromAnchor(cursorX, cursorY, 0, currentWidth, tileHeight));
      cursorX += currentWidth + jointVertical;
    }

    totalWidth = Math.max(totalWidth, cursorX);
  }

  return {
    tiles,
    totalWidth,
    totalHeight: rows * rowStepY,
  };
}

const VENZOWOOD_SOURCE_SIZE = 30000;
const VENZOWOOD_MODULE_SHAPES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [6661.91, 15051.7],
    [15012.78, 6700.83],
    [23363.65, 15051.7],
    [15012.78, 23402.57],
  ],
  [
    [14226.3, 3794.44],
    [14999.13, 3021.61],
    [15800.59, 3823.5],
    [15027.76, 4596.33],
  ],
  [
    [2982.08, 15035],
    [3754.91, 14262.17],
    [4556.37, 15064.06],
    [3783.54, 15836.89],
  ],
  [
    [25468.4, 15036.6],
    [26241.23, 14263.77],
    [27042.69, 15065.66],
    [26269.86, 15838.49],
  ],
  [
    [14226, 26278.9],
    [14998.83, 25506.07],
    [15800.29, 26307.96],
    [15027.46, 27080.79],
  ],
  [
    [4830.92, 16883.8],
    [5603.75, 16110.97],
    [13952.01, 24460.28],
    [13179.18, 25233.11],
  ],
  [
    [16066.4, 5643.5],
    [16839.23, 4870.67],
    [25191.83, 13224.32],
    [24419, 13997.15],
  ],
  [
    [4837.39, 13221.3],
    [13192.16, 4866.53],
    [13988.62, 5674.25],
    [5633.85, 14029.02],
  ],
  [
    [16058.1, 24442],
    [24413.83, 16086.27],
    [25210.29, 16893.99],
    [16854.56, 25249.72],
  ],
];
const VENZOWOOD_MODULE_BOUNDS = VENZOWOOD_MODULE_SHAPES.flat().reduce(
  (bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    maxX: Math.max(bounds.maxX, x),
    minY: Math.min(bounds.minY, y),
    maxY: Math.max(bounds.maxY, y),
  }),
  {
    minX: VENZOWOOD_SOURCE_SIZE,
    maxX: 0,
    minY: VENZOWOOD_SOURCE_SIZE,
    maxY: 0,
  },
);
const VENZOWOOD_MODULE_CENTER = {
  x: (VENZOWOOD_MODULE_BOUNDS.minX + VENZOWOOD_MODULE_BOUNDS.maxX) / 2,
  y: (VENZOWOOD_MODULE_BOUNDS.minY + VENZOWOOD_MODULE_BOUNDS.maxY) / 2,
};

function getBoundsFromShapes(shapes: ReadonlyArray<ReadonlyArray<PatternPoint>>) {
  return shapes.flat().reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function getVenzowoodRotatedShapes(angle: number) {
  const clampedAngle = Math.max(0, Math.min(45, Math.round(angle)));
  const rotation = degreesToRadians(clampedAngle - 45);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return VENZOWOOD_MODULE_SHAPES.map((shape) =>
    shape.map(([x, y]) => {
      const dx = x - VENZOWOOD_MODULE_CENTER.x;
      const dy = y - VENZOWOOD_MODULE_CENTER.y;

      return {
        x: VENZOWOOD_MODULE_CENTER.x + dx * cos - dy * sin,
        y: VENZOWOOD_MODULE_CENTER.y + dx * sin + dy * cos,
      };
    }),
  );
}

function getVenzowoodTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const moduleShapes = getVenzowoodRotatedShapes(config.pattern.angle);
  const moduleBounds = getBoundsFromShapes(moduleShapes);
  const moduleBoundsWidth = moduleBounds.maxX - moduleBounds.minX;
  const moduleBoundsHeight = moduleBounds.maxY - moduleBounds.minY;
  const moduleSize = Math.max(tileWidth, tileHeight, 1);
  const scale = moduleSize / Math.max(moduleBoundsWidth, moduleBoundsHeight, 1);
  const moduleWidth = moduleBoundsWidth * scale;
  const moduleHeight = moduleBoundsHeight * scale;
  const stepX = moduleWidth + jointVertical;
  const stepY = moduleHeight + jointHorizontal;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offsetX = column * stepX;
      const offsetY = row * stepY;

      for (const shape of moduleShapes) {
        tiles.push(
          buildTileFromPoints(
            shape.map((point) => ({
              x: offsetX + (point.x - moduleBounds.minX) * scale,
              y: offsetY + (point.y - moduleBounds.minY) * scale,
            })),
          ),
        );
      }
    }
  }

  return {
    tiles,
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
  };
}

function getSvgPatternTiles(config: TextureConfig, module: SvgPatternModule) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const contentBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (const tile of module.tiles) {
    contentBounds.minX = Math.min(contentBounds.minX, tile.x);
    contentBounds.minY = Math.min(contentBounds.minY, tile.y);
    contentBounds.maxX = Math.max(contentBounds.maxX, tile.x + tile.width);
    contentBounds.maxY = Math.max(contentBounds.maxY, tile.y + tile.height);
  }

  for (const stroke of module.strokes) {
    for (const point of stroke.points) {
      contentBounds.minX = Math.min(contentBounds.minX, point.x);
      contentBounds.minY = Math.min(contentBounds.minY, point.y);
      contentBounds.maxX = Math.max(contentBounds.maxX, point.x);
      contentBounds.maxY = Math.max(contentBounds.maxY, point.y);
    }
  }

  if (!Number.isFinite(contentBounds.minX)) {
    contentBounds.minX = 0;
    contentBounds.minY = 0;
    contentBounds.maxX = module.viewBoxWidth;
    contentBounds.maxY = module.viewBoxHeight;
  }

  const contentWidth = Math.max(1, contentBounds.maxX - contentBounds.minX);
  const contentHeight = Math.max(1, contentBounds.maxY - contentBounds.minY);
  const moduleOriginX = module.originX ?? 0;
  const moduleOriginY = module.originY ?? 0;

  const layoutMode = ['fibra_pattern', 'weave_pattern_2', 'grate_pattern_2', 'vita_pattern_13'].includes(config.pattern.type) 
    ? 'viewbox-uniform-repeat' 
    : 'preserve-existing';

  let scaleX: number;
  let scaleY: number;
  let moduleWidth: number;
  let moduleHeight: number;
  let repeatWidth: number;
  let repeatHeight: number;
  let stepX: number;
  let stepY: number;
  let extraWidth = 0;
  let extraHeight = 0;

  const patternDef = getPatternByType(config.pattern.type);
  const compensationX = patternDef?.repeatCompensation?.x ?? 0;
  const compensationY = patternDef?.repeatCompensation?.y ?? 0;

  const authoredRepeatWidth = Math.max(1, module.repeatWidth ?? module.viewBoxWidth);
  const authoredRepeatHeight = Math.max(1, module.repeatHeight ?? module.viewBoxHeight);

  if (layoutMode === 'viewbox-uniform-repeat') {
    const scale = tileWidth / authoredRepeatWidth;
    scaleX = scale;
    scaleY = scale;
    
    const artworkDrawWidth = authoredRepeatWidth * scale;
    const artworkDrawHeight = authoredRepeatHeight * scale;
    
    const baseRepeatStepX = patternDef?.baseRepeatStepX ?? patternDef?.repeatWidth ?? artworkDrawWidth;
    const baseRepeatStepY = patternDef?.baseRepeatStepY ?? patternDef?.repeatHeight ?? artworkDrawHeight;
    
    const userHJoint = config.joints.horizontalSize;
    const userVJoint = config.joints.verticalSize;
    const effectiveHJoint = userHJoint + compensationX;
    const effectiveVJoint = userVJoint + compensationY;
    
    const effectiveStepX = baseRepeatStepX + effectiveHJoint;
    const effectiveStepY = baseRepeatStepY + effectiveVJoint;

    const allowOverlap = patternDef?.allowNegativeOverlap ?? true;
    
    stepX = allowOverlap || effectiveHJoint < 0
      ? effectiveStepX
      : Math.max(effectiveStepX, baseRepeatStepX);
      
    stepY = allowOverlap || effectiveVJoint < 0
      ? effectiveStepY
      : Math.max(effectiveStepY, baseRepeatStepY);

    if (config.pattern.type === 'grate_pattern_2' || config.pattern.type === 'weave_pattern_2' || compensationX !== 0 || compensationY !== 0) {
      console.table({
        patternName: config.pattern.type,
        layoutMode,
        moduleWidth: tileWidth,
        moduleHeight: tileHeight,
        selectedWidth: columns * stepX,
        selectedHeight: rows * stepY,
        baseRepeatStepX,
        baseRepeatStepY,
        userHJoint,
        userVJoint,
        effectiveStepX,
        effectiveStepY,
        artworkDrawWidth,
        artworkDrawHeight,
        artworkOffsetX: patternDef?.artworkOffsetX ?? 0,
        artworkOffsetY: patternDef?.artworkOffsetY ?? 0,
      });
    }
  } else {
    // Legacy preserve-existing mode
    scaleX = tileWidth / authoredRepeatWidth;
    scaleY = tileHeight / authoredRepeatHeight;
    moduleWidth = Math.max(authoredRepeatWidth, contentWidth) * scaleX;
    moduleHeight = Math.max(authoredRepeatHeight, contentHeight) * scaleY;
    repeatWidth = authoredRepeatWidth * scaleX;
    repeatHeight = authoredRepeatHeight * scaleY;

    const intrinsicRepeatAdjustment =
      config.pattern.type === 'venzowood_3'
        ? { x: tileWidth * (-80 / 610), y: tileHeight * (-20 / 610) }
        : { x: 0, y: 0 };

    const userHJoint = jointVertical;
    const userVJoint = jointHorizontal;
    const effectiveHJoint = userHJoint + compensationX;
    const effectiveVJoint = userVJoint + compensationY;

    stepX = repeatWidth + intrinsicRepeatAdjustment.x + effectiveHJoint;
    stepY = repeatHeight + intrinsicRepeatAdjustment.y + effectiveVJoint;

    if (compensationX !== 0 || compensationY !== 0) {
      console.table({
        patternName: config.pattern.type,
        userHJoint,
        userVJoint,
        compensationX,
        compensationY,
        effectiveHJoint,
        effectiveVJoint,
        patternWidth: repeatWidth,
        patternHeight: repeatHeight,
        stepX,
        stepY
      });
    }
  }

  const isSlatPattern = ['concave_pattern', 'convex_pattern', 'ripple_pattern'].includes(
    config.pattern.type,
  );
  const isChequer = config.pattern.type === 'chequer_pattern';
  const isVitaPattern3 = config.pattern.type === 'vita_pattern_3';

  const tiles: PatternTile[] = [];
  const strokes: PatternStroke[] = [];
  const fillTiles =
    config.pattern.type === 'venzowood_4'
      ? module.tiles.filter((tile) => tile.height >= contentHeight * 0.8)
      : isVitaPattern3
        ? module.tiles.filter((tile, index, allTiles) =>
            allTiles.some((candidate, candidateIndex) => {
              if (candidateIndex === index) return false;
              // Vita Pattern 3 is a mixed-material module. Each unit is authored as:
              // 1. a larger closed rectangle for the surrounding frame/bevel ring
              // 2. a smaller inset square for the flat center face
              // Only the inset square should receive the main material image. The surrounding
              // rectangle stays in the joint/frame bucket so the joint texture shows through.
              return (
                tile.x >= candidate.x &&
                tile.y >= candidate.y &&
                tile.x + tile.width <= candidate.x + candidate.width &&
                tile.y + tile.height <= candidate.y + candidate.height
              );
            }),
          )
        : config.pattern.type === 'vita_pattern_20'
          ? [
              ...module.tiles,
              ...module.strokes
                .filter((s) => s.points.length === 4)
                .map((s) => ({
                  x: Math.min(...s.points.map((p) => p.x)),
                  y: Math.min(...s.points.map((p) => p.y)),
                  width:
                    Math.max(...s.points.map((p) => p.x)) - Math.min(...s.points.map((p) => p.x)),
                  height:
                    Math.max(...s.points.map((p) => p.y)) - Math.min(...s.points.map((p) => p.y)),
                  clipPath: [...s.points, s.points[0]],
                })),
            ]
          : module.tiles;


  const moduleStrokes =
    config.pattern.type === 'vita_pattern_20'
      ? module.strokes.filter((s) => s.points.length !== 4)
      : module.strokes;
  const outlineTiles =
    config.pattern.type === 'venzowood_4'
      ? module.tiles
      : isVitaPattern3
        ? module.tiles.filter((tile) => !fillTiles.includes(tile))
        : [];
  const artworkOffsetX = patternDef?.artworkOffsetX ?? 0;
  const artworkOffsetY = patternDef?.artworkOffsetY ?? 0;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offsetX = column * stepX;
      const offsetY = row * stepY;
      const scaledModuleStrokes: PatternStroke[] = [];

      for (const tile of fillTiles) {
        let internalOffsetX = (tile.x - moduleOriginX + artworkOffsetX) * scaleX;
        let internalOffsetY = (tile.y - moduleOriginY + artworkOffsetY) * scaleY;

        if (layoutMode === 'preserve-existing') {
          if (isChequer) {
            if (tile.x > authoredRepeatWidth * 0.4) internalOffsetX += jointVertical;
            if (tile.y > authoredRepeatHeight * 0.4) internalOffsetY += jointHorizontal;
          } else if (isSlatPattern) {
            const slatIndex = module.tiles.indexOf(tile);
            if (slatIndex > 0) internalOffsetX += slatIndex * jointVertical;
          }
        }

        tiles.push(
          buildTileFromPoints(
            tile.clipPath.map((point) => ({
              x: offsetX + internalOffsetX + point.x * scaleX,
              y: offsetY + internalOffsetY + point.y * scaleY,
            })),
          ),
        );
      }

      for (const tile of outlineTiles) {
        strokes.push({
          closed: true,
          points: tile.clipPath.map((point) => ({
            x: offsetX + (tile.x - moduleOriginX + artworkOffsetX + point.x) * scaleX,
            y: offsetY + (tile.y - moduleOriginY + artworkOffsetY + point.y) * scaleY,
          })),
        });
      }

      for (const stroke of module.strokes) {
        const scaledStroke = {
          closed: stroke.closed,
          points: stroke.points.map((point) => ({
            x: offsetX + (point.x - moduleOriginX + artworkOffsetX) * scaleX,
            y: offsetY + (point.y - moduleOriginY + artworkOffsetY) * scaleY,
          })),
        };
        strokes.push(scaledStroke);
        if (config.pattern.type === 'vita_pattern_13') {
          scaledModuleStrokes.push(scaledStroke);
        }
      }

      if (config.pattern.type === 'vita_pattern_13') {
        strokes.push(
          ...buildVitaPattern13VerticalSeamStrokes(
            scaledModuleStrokes,
            stepX,
            stepY,
          ),
        );
      }
    }
  }

  if (layoutMode === 'preserve-existing') {
    extraWidth = isChequer ? jointVertical : isSlatPattern ? (module.tiles.length - 1) * jointVertical : 0;
    extraHeight = isChequer ? jointHorizontal : 0;
  }

  return {
    tiles,
    strokes,
    totalWidth: columns * stepX + extraWidth,
    totalHeight: rows * stepY + extraHeight,
  };
}

export function getPatternLayout(
  config: TextureConfig,
  svgPatternModule: SvgPatternModule | null = getCachedSvgPatternModule(config.pattern.type),
): PatternLayout {
  const baseLayout: {
    tiles: PatternTile[];
    totalWidth: number;
    totalHeight: number;
    strokes?: PatternStroke[];
  } =
    config.pattern.type === 'flemish_bond'
      ? getFlemishTiles(config)
      : config.pattern.type === 'stack_bond'
        ? getStackTiles(config)
        : config.pattern.type === 'stretcher_bond'
          ? getStretcherTiles(config)
          : config.pattern.type === 'herringbone'
            ? getHerringboneTiles(config)
            : config.pattern.type === 'chevron'
              ? getChevronTiles(config)
              : config.pattern.type === 'staggered'
                ? getStaggeredTiles(config)
                : config.pattern.type === 'venzowood'
                  ? getVenzowoodTiles(config)
                  : svgPatternModule &&
                      (svgPatternModule.tiles.length || svgPatternModule.strokes.length)
                    ? getSvgPatternTiles(config, svgPatternModule)
                    : hasSvgPatternModule(config.pattern.type)
                      ? getFallbackSvgPatternLayout(config)
                      : getStackTiles(config);

  const tiles = baseLayout.tiles;
  const strokes = baseLayout.strokes ?? [];
  const contentMax = getLayoutContentMax({ tiles, strokes });

  return {
    tiles,
    strokes,
    totalWidth: roundLayoutValue(baseLayout.totalWidth),
    totalHeight: roundLayoutValue(baseLayout.totalHeight),
    contentWidth: roundLayoutValue(contentMax.x),
    contentHeight: roundLayoutValue(contentMax.y),
  };
}
