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

export function getPatternLayout(config: TextureConfig): PatternLayout {
  const baseLayout =
    config.pattern.type === 'stretcher_bond' ? getStretcherTiles(config) :
    config.pattern.type === 'herringbone' ? getHerringboneTiles(config) :
    getStackTiles(config);

  return {
    tiles: baseLayout.tiles,
    totalWidth: roundLayoutValue(baseLayout.totalWidth),
    totalHeight: roundLayoutValue(baseLayout.totalHeight),
  };
}

