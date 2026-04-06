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

function buildTileFromAnchor(anchorX: number, anchorY: number, angle: number, width: number, height: number): PatternTile {
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
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } = getDimensions(config);
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

function getStretcherTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } = getDimensions(config);
  const stepX = tileWidth + jointVertical;
  const stepY = tileHeight + jointHorizontal;
  const rowOffset = stepX / 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offsetX = row % 2 === 0 ? -rowOffset : 0;
    for (let column = 0; column < columns; column++) {
      tiles.push(buildTileFromAnchor(offsetX + column * stepX, row * stepY, 0, tileWidth, tileHeight));
    }
  }

  return {
    tiles,
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
  };
}

function getHerringboneTiles(config: TextureConfig) {
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } = getDimensions(config);
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
function buildParallelogramTile(anchorX: number, anchorY: number, width: number, height: number, slantAngleDeg: number): PatternTile {
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
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } = getDimensions(config);
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
  const { columns, rows, tileWidth, tileHeight, jointHorizontal, jointVertical } = getDimensions(config);
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

export function getPatternLayout(config: TextureConfig): PatternLayout {
  const baseLayout =
    config.pattern.type === 'flemish_bond' ? getFlemishTiles(config) :
      config.pattern.type === 'stretcher_bond' ? getStretcherTiles(config) :
        config.pattern.type === 'herringbone' ? getHerringboneTiles(config) :
          config.pattern.type === 'chevron' ? getChevronTiles(config) :
            getStackTiles(config);

  return {
    tiles: baseLayout.tiles,
    totalWidth: roundLayoutValue(baseLayout.totalWidth),
    totalHeight: roundLayoutValue(baseLayout.totalHeight),
  };
}
