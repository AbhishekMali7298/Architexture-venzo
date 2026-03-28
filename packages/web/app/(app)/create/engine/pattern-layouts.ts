import type { TextureConfig, PatternType } from '@textura/shared';

export interface PatternTile {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  materialIndex: number;
}

export interface PatternLayoutData {
  tiles: PatternTile[];
  totalWidth: number;
  totalHeight: number;
}

function getMaterialMetrics(config: TextureConfig) {
  const material = config.materials[0]!;
  return {
    width: material.width,
    height: material.height,
    horizontalJoint: config.joints.horizontalSize,
    verticalJoint: config.joints.verticalSize,
    angle: config.pattern.angle,
  };
}

function withBounds(tiles: PatternTile[], horizontalJoint: number, verticalJoint: number): PatternLayoutData {
  let totalWidth = 0;
  let totalHeight = 0;

  for (const tile of tiles) {
    totalWidth = Math.max(totalWidth, tile.x + tile.width + verticalJoint);
    totalHeight = Math.max(totalHeight, tile.y + tile.height + horizontalJoint);
  }

  return { tiles, totalWidth, totalHeight };
}

function layoutRunningBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 1 ? (width + verticalJoint) / 2 : 0;
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * (width + verticalJoint) + offset,
        y: row * (height + horizontalJoint),
        width,
        height,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutStackBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * (width + verticalJoint),
        y: row * (height + horizontalJoint),
        width,
        height,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutStretcherBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns, stretchers } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const cycle = Math.max(2, stretchers + 1);
  const offsetStep = (width + verticalJoint) / cycle;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offset = (row % cycle) * offsetStep;
    for (let column = -1; column < columns; column++) {
      tiles.push({
        x: column * (width + verticalJoint) + offset,
        y: row * (height + horizontalJoint),
        width,
        height,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutFlemishBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    let cursorX = row % 2 === 1 ? -(headerWidth + verticalJoint) / 2 : 0;
    for (let unit = 0; unit < columns * 2; unit++) {
      const useHeader = (row + unit) % 2 === 0;
      const tileWidth = useHeader ? headerWidth : width;
      tiles.push({
        x: cursorX,
        y: row * (height + horizontalJoint),
        width: tileWidth,
        height,
        rotation: angle,
        materialIndex: 0,
      });
      cursorX += tileWidth + verticalJoint;
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutEnglishBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    if (row % 2 === 0) {
      for (let column = 0; column < columns; column++) {
        tiles.push({
          x: column * (width + verticalJoint),
          y: row * (height + horizontalJoint),
          width,
          height,
          rotation: angle,
          materialIndex: 0,
        });
      }
      continue;
    }

    for (let column = 0; column < columns * 2; column++) {
      tiles.push({
        x: column * (headerWidth + verticalJoint),
        y: row * (height + horizontalJoint),
        width: headerWidth,
        height,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutSoldierCourse(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * (height + verticalJoint),
        y: row * (width + horizontalJoint),
        width: height,
        height: width,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutHerringbone(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, angle } = getMaterialMetrics(config);
  const unit = width + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * unit;
      const baseY = row * unit;

      tiles.push({
        x: baseX,
        y: baseY,
        width,
        height,
        rotation: angle,
        materialIndex: 0,
      });

      tiles.push({
        x: baseX + height + horizontalJoint,
        y: baseY,
        width: height,
        height: width,
        rotation: angle + 90,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, horizontalJoint);
}

function layoutChevron(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const halfWidth = width / 2;
  const swing = Math.max(10, angle || 45);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * (width + verticalJoint);
      const baseY = row * (height + horizontalJoint);
      tiles.push({ x: baseX, y: baseY, width: halfWidth, height, rotation: swing, materialIndex: 0 });
      tiles.push({
        x: baseX + halfWidth + verticalJoint,
        y: baseY,
        width: halfWidth,
        height,
        rotation: -swing,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutBasketweave(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const unit = width + verticalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const vertical = (row + column) % 2 === 1;
      tiles.push({
        x: column * unit,
        y: row * unit,
        width: vertical ? height : width,
        height: vertical ? width : height,
        rotation: angle + (vertical ? 90 : 0),
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutHexagonal(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const hexWidth = width + verticalJoint;
  const hexHeight = width * 0.866 + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offsetX = row % 2 === 1 ? hexWidth / 2 : 0;
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * hexWidth + offsetX,
        y: row * hexHeight,
        width,
        height: width,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutAshlar(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const large = (row + column) % 2 === 0;
      const tileWidth = large ? width : Math.max(width * 0.6, 1);
      const tileHeight = large ? height : Math.max(height * 0.7, 1);
      tiles.push({
        x: column * (width + verticalJoint),
        y: row * (height + horizontalJoint),
        width: tileWidth,
        height: tileHeight,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutPinwheel(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const square = Math.min(width, height) * 0.5;
  const unitWidth = width + square + verticalJoint * 2;
  const unitHeight = height + square + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * unitWidth;
      const baseY = row * unitHeight;

      tiles.push({ x: baseX, y: baseY, width, height: square, rotation: angle, materialIndex: 0 });
      tiles.push({ x: baseX + width + verticalJoint, y: baseY, width: square, height, rotation: angle + 90, materialIndex: 0 });
      tiles.push({ x: baseX + square, y: baseY + height + horizontalJoint, width, height: square, rotation: angle + 180, materialIndex: 0 });
      tiles.push({ x: baseX, y: baseY + square, width: square, height, rotation: angle + 270, materialIndex: 0 });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutWindmill(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const arm = Math.min(width, height) * 0.5;
  const unitWidth = width + arm + verticalJoint * 2;
  const unitHeight = height + arm + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * unitWidth;
      const baseY = row * unitHeight;

      tiles.push({ x: baseX, y: baseY, width: arm, height, rotation: angle, materialIndex: 0 });
      tiles.push({ x: baseX + arm + verticalJoint, y: baseY, width, height: arm, rotation: angle + 90, materialIndex: 0 });
      tiles.push({ x: baseX + width, y: baseY + arm + horizontalJoint, width: arm, height, rotation: angle + 180, materialIndex: 0 });
      tiles.push({ x: baseX, y: baseY + height, width, height: arm, rotation: angle + 270, materialIndex: 0 });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

const PATTERN_LAYOUTS: Partial<Record<PatternType, (config: TextureConfig) => PatternLayoutData>> = {
  running_bond: layoutRunningBond,
  stack_bond: layoutStackBond,
  stretcher_bond: layoutStretcherBond,
  flemish_bond: layoutFlemishBond,
  english_bond: layoutEnglishBond,
  soldier_course: layoutSoldierCourse,
  subway: layoutRunningBond,
  herringbone: layoutHerringbone,
  chevron: layoutChevron,
  basketweave: layoutBasketweave,
  hexagonal: layoutHexagonal,
  ashlar: layoutAshlar,
  pinwheel: layoutPinwheel,
  windmill: layoutWindmill,
  parquet_straight: layoutStackBond,
  parquet_diagonal: layoutHerringbone,
  versailles: layoutPinwheel,
  cobblestone: layoutAshlar,
  crazy_paving: layoutAshlar,
};

export function getPatternLayout(config: TextureConfig): PatternLayoutData {
  const layout = PATTERN_LAYOUTS[config.pattern.type] ?? layoutRunningBond;
  return layout(config);
}
