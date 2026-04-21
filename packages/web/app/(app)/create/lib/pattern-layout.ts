import type { TextureConfig } from '@textura/shared';

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

export interface PatternLayout {
  tiles: PatternTile[];
  totalWidth: number;
  totalHeight: number;
}

const SQRT_2 = Math.SQRT2;

function degreesToRadians(angle: number) {
  return (angle * Math.PI) / 180;
}

function roundLayoutValue(value: number) {
  return Math.round(value * 1000) / 1000;
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

  return {
    columns: Math.max(1, Math.floor(config.pattern.columns || 1)),
    rows: Math.max(1, Math.floor(config.pattern.rows || 1)),
    tileWidth: Math.max(1, material.width),
    tileHeight: Math.max(1, material.height),
    jointHorizontal: Math.max(0, config.joints.horizontalSize),
    jointVertical: Math.max(0, config.joints.verticalSize),
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
const VENZOWOOD_MODULE_WIDTH = VENZOWOOD_MODULE_BOUNDS.maxX - VENZOWOOD_MODULE_BOUNDS.minX;
const VENZOWOOD_MODULE_HEIGHT = VENZOWOOD_MODULE_BOUNDS.maxY - VENZOWOOD_MODULE_BOUNDS.minY;

function getVenzowoodTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } =
    getDimensions(config);
  const moduleSize = Math.max(tileWidth * 3, tileHeight * 3, 1);
  const scale = moduleSize / Math.max(VENZOWOOD_MODULE_WIDTH, VENZOWOOD_MODULE_HEIGHT, 1);
  const moduleWidth = VENZOWOOD_MODULE_WIDTH * scale;
  const moduleHeight = VENZOWOOD_MODULE_HEIGHT * scale;
  const stepX = moduleWidth + jointVertical;
  const stepY = moduleHeight + jointHorizontal;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offsetX = column * stepX;
      const offsetY = row * stepY;

      for (const shape of VENZOWOOD_MODULE_SHAPES) {
        tiles.push(
          buildTileFromPoints(
            shape.map(([x, y]) => ({
              x: offsetX + (x - VENZOWOOD_MODULE_BOUNDS.minX) * scale,
              y: offsetY + (y - VENZOWOOD_MODULE_BOUNDS.minY) * scale,
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

export function getPatternLayout(config: TextureConfig): PatternLayout {
  const baseLayout =
    config.pattern.type === 'flemish_bond'
      ? getFlemishTiles(config)
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
                : getStackTiles(config);

  return {
    tiles: baseLayout.tiles,
    totalWidth: roundLayoutValue(baseLayout.totalWidth),
    totalHeight: roundLayoutValue(baseLayout.totalHeight),
  };
}
