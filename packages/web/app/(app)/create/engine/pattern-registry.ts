import type { PatternType, TextureConfig } from '@textura/shared';
import type { PatternLayoutData, PatternTile } from './pattern-layouts';

export interface PatternEngineTileMetrics {
  width: number;
  height: number;
}

export interface PatternEngineJointMetrics {
  horizontal: number;
  vertical: number;
}

export interface PatternEngineTileType {
  width: number;
  height: number;
}

export interface PatternEngineCellTile {
  type: string;
  dx: number;
  dy: number;
  rotation?: number;
}

export interface PatternEngineDefinition {
  tileTypes: Record<string, PatternEngineTileType>;
  offsetX: (row: number, col: number, tile: PatternEngineTileMetrics, joint: PatternEngineJointMetrics, config: TextureConfig) => number;
  offsetY: (row: number, col: number, tile: PatternEngineTileMetrics, joint: PatternEngineJointMetrics, config: TextureConfig) => number;
  rotation: (row: number, col: number, config: TextureConfig) => number;
  getTileType: (row: number, col: number, config: TextureConfig) => string;
  rowRange?: (rows: number, config: TextureConfig) => { start: number; end: number };
  colRange?: (row: number, columns: number, tile: PatternEngineTileMetrics, joint: PatternEngineJointMetrics, config: TextureConfig) => { start: number; end: number };
  getCellTiles?: (row: number, col: number, tile: PatternEngineTileMetrics, joint: PatternEngineJointMetrics, config: TextureConfig) => PatternEngineCellTile[];
  repeatSize?: (rows: number, columns: number, tile: PatternEngineTileMetrics, joint: PatternEngineJointMetrics, config: TextureConfig) => {
    width: number;
    height: number;
  };
  preserveGridCoordinates?: boolean;
  customGenerate?: (config: TextureConfig, helpers: PatternEngineHelpers, definition: PatternEngineDefinition) => PatternLayoutData;
}

interface PatternEngineHelpers {
  withBounds: (tiles: PatternTile[], horizontalJoint: number, verticalJoint: number) => PatternLayoutData;
  normalizeLayoutBounds: (
    tiles: PatternTile[],
    horizontalJoint: number,
    verticalJoint: number,
    repeatBounds?: { width: number; height: number },
  ) => PatternLayoutData;
}

function withBounds(tiles: PatternTile[], horizontalJoint: number, verticalJoint: number): PatternLayoutData {
  let totalWidth = 0;
  let totalHeight = 0;

  for (const tile of tiles) {
    totalWidth = Math.max(totalWidth, tile.x + tile.width + verticalJoint);
    totalHeight = Math.max(totalHeight, tile.y + tile.height + horizontalJoint);
  }

  return {
    tiles,
    strokes: [],
    totalWidth,
    totalHeight,
    repeatWidth: totalWidth,
    repeatHeight: totalHeight,
    repeatOffsetX: 0,
    repeatOffsetY: 0,
    previewOutline: undefined,
  };
}

function normalizeLayoutBounds(
  tiles: PatternTile[],
  horizontalJoint: number,
  verticalJoint: number,
  repeatBounds?: { width: number; height: number },
): PatternLayoutData {
  if (!tiles.length) {
    return {
      tiles,
      strokes: [],
      totalWidth: repeatBounds?.width ?? 0,
      totalHeight: repeatBounds?.height ?? 0,
      repeatWidth: repeatBounds?.width ?? 0,
      repeatHeight: repeatBounds?.height ?? 0,
      repeatOffsetX: 0,
      repeatOffsetY: 0,
      previewOutline: undefined,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const tile of tiles) {
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x + tile.width + verticalJoint);
    maxY = Math.max(maxY, tile.y + tile.height + horizontalJoint);
  }

  const offsetX = Number.isFinite(minX) ? -Math.min(minX, 0) : 0;
  const offsetY = Number.isFinite(minY) ? -Math.min(minY, 0) : 0;

  const normalizedTiles = offsetX === 0 && offsetY === 0
    ? tiles
    : tiles.map((tile) => ({
        ...tile,
        x: tile.x + offsetX,
        y: tile.y + offsetY,
      }));

  return {
    tiles: normalizedTiles,
    strokes: [],
    totalWidth: Math.max(0, maxX + offsetX, repeatBounds?.width ?? 0),
    totalHeight: Math.max(0, maxY + offsetY, repeatBounds?.height ?? 0),
    repeatWidth: repeatBounds?.width ?? Math.max(0, maxX + offsetX),
    repeatHeight: repeatBounds?.height ?? Math.max(0, maxY + offsetY),
    repeatOffsetX: offsetX,
    repeatOffsetY: offsetY,
    previewOutline: undefined,
  };
}

function generateGridLayout(config: TextureConfig, definition: PatternEngineDefinition): PatternLayoutData {
  const material = config.materials[0]!;
  const rows = Math.max(1, config.pattern.rows);
  const columns = Math.max(1, config.pattern.columns);
  const tileMetrics: PatternEngineTileMetrics = { width: material.width, height: material.height };
  const jointMetrics: PatternEngineJointMetrics = {
    horizontal: config.joints.horizontalSize,
    vertical: config.joints.verticalSize,
  };
  const stepX = tileMetrics.width + jointMetrics.vertical;
  const stepY = tileMetrics.height + jointMetrics.horizontal;
  const rowWindow = definition.rowRange?.(rows, config) ?? { start: 0, end: rows - 1 };
  const tiles: PatternTile[] = [];

  for (let row = rowWindow.start; row <= rowWindow.end; row++) {
    const colWindow = definition.colRange?.(row, columns, tileMetrics, jointMetrics, config) ?? { start: 0, end: columns - 1 };

    for (let col = colWindow.start; col <= colWindow.end; col++) {
      const cellTiles = definition.getCellTiles?.(row, col, tileMetrics, jointMetrics, config) ?? [
        {
          type: definition.getTileType(row, col, config),
          dx: 0,
          dy: 0,
        },
      ];

      for (const cellTile of cellTiles) {
        const tileType = definition.tileTypes[cellTile.type] ?? definition.tileTypes.base;
        if (!tileType) continue;

        const tileWidth = Math.max(tileMetrics.width * tileType.width, 1);
        const tileHeight = Math.max(tileMetrics.height * tileType.height, 1);
        const tileX = col * stepX + definition.offsetX(row, col, tileMetrics, jointMetrics, config) + cellTile.dx;
        const tileY = row * stepY + definition.offsetY(row, col, tileMetrics, jointMetrics, config) + cellTile.dy;

        tiles.push({
          x: tileX,
          y: tileY,
          width: tileWidth,
          height: tileHeight,
          rotation: cellTile.rotation ?? definition.rotation(row, col, config),
          materialIndex: 0,
        });
      }
    }
  }

  const repeatBounds = definition.repeatSize?.(rows, columns, tileMetrics, jointMetrics, config);

  if (repeatBounds) {
    if (definition.preserveGridCoordinates) {
      const layout = withBounds(tiles, jointMetrics.horizontal, jointMetrics.vertical);
      return {
        ...layout,
        repeatWidth: repeatBounds.width,
        repeatHeight: repeatBounds.height,
        repeatOffsetX: 0,
        repeatOffsetY: 0,
      };
    }

    return normalizeLayoutBounds(tiles, jointMetrics.horizontal, jointMetrics.vertical, repeatBounds);
  }

  return withBounds(tiles, jointMetrics.horizontal, jointMetrics.vertical);
}

const RUNNING_BOND_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    base: { width: 1, height: 1 },
  },
  offsetX: (row, _col, tile, joint, config) => {
    const cycle = Math.max(2, (config.pattern.stretchers ?? 1) + 1);
    const stepX = tile.width + joint.vertical;
    return (row % cycle) * (stepX / cycle);
  },
  offsetY: () => 0,
  rotation: () => 0,
  getTileType: () => 'base',
  colRange: (row, columns, tile, joint, config) => {
    const cycle = Math.max(2, (config.pattern.stretchers ?? 1) + 1);
    const stepX = tile.width + joint.vertical;
    const offset = (row % cycle) * (stepX / cycle);
    if (offset > 0.0001) {
      return { start: -1, end: columns };
    }
    return { start: 0, end: columns - 1 };
  },
  repeatSize: (rows, columns, tile, joint) => ({
    width: columns * (tile.width + joint.vertical),
    height: rows * (tile.height + joint.horizontal),
  }),
  preserveGridCoordinates: true,
};

const STACK_BOND_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    base: { width: 1, height: 1 },
  },
  offsetX: () => 0,
  offsetY: () => 0,
  rotation: () => 0,
  getTileType: () => 'base',
};

const STRETCHER_BOND_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    base: { width: 1, height: 1 },
  },
  offsetX: (row, _col, tile, joint) => {
    const stepX = tile.width + joint.vertical;
    return row % 2 === 1 ? stepX / 2 : 0;
  },
  offsetY: () => 0,
  rotation: () => 0,
  getTileType: () => 'base',
  colRange: (_row, columns) => ({ start: -1, end: columns - 1 }),
  repeatSize: (rows, columns, tile, joint) => ({
    width: columns * (tile.width + joint.vertical),
    height: rows * (tile.height + joint.horizontal),
  }),
  preserveGridCoordinates: true,
};

const STAGGERED_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    base: { width: 1, height: 1 },
  },
  offsetX: (row, _col, tile, joint) => {
    const stepX = tile.width + joint.vertical;
    return row % 2 === 1 ? stepX / 2 : 0;
  },
  offsetY: () => 0,
  rotation: () => 0,
  getTileType: () => 'base',
  colRange: (row, columns) => (row % 2 === 1 ? { start: -1, end: columns } : { start: 0, end: columns - 1 }),
  repeatSize: (rows, columns, tile, joint) => ({
    width: columns * (tile.width + joint.vertical),
    height: rows * (tile.height + joint.horizontal),
  }),
  preserveGridCoordinates: true,
};

const FLEMISH_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    stretcher: { width: 1, height: 1 },
    header: { width: 0.5, height: 1 },
  },
  offsetX: () => 0,
  offsetY: () => 0,
  rotation: () => 0,
  getTileType: (row, col) => {
    const startWithHeader = row % 2 === 1;
    const useHeader = startWithHeader ? col % 2 === 0 : col % 2 === 1;
    return useHeader ? 'header' : 'stretcher';
  },
  customGenerate: (config, helpers, definition) => {
    const material = config.materials[0]!;
    const rows = Math.max(1, config.pattern.rows);
    const columns = Math.max(1, config.pattern.columns);
    const jointH = config.joints.horizontalSize;
    const jointV = config.joints.verticalSize;
    const headerWidth = Math.max(material.width / 2, 1);
    const stepY = material.height + jointH;
    const pairWidth = material.width + headerWidth + jointV * 2;
    const halfPairOffset = pairWidth / 2;
    const totalWidth = columns * halfPairOffset;
    const tiles: PatternTile[] = [];

    for (let row = 0; row < rows; row++) {
      let cursorX = row % 2 === 1 ? -halfPairOffset : 0;
      let unit = 0;

      while (cursorX < totalWidth + material.width) {
        const tileType = definition.getTileType(row, unit, config);
        const tileDef = definition.tileTypes[tileType] ?? definition.tileTypes.stretcher!;
        const tileWidth = Math.max(material.width * tileDef.width, 1);

        tiles.push({
          x: cursorX,
          y: row * stepY,
          width: tileWidth,
          height: material.height,
          rotation: definition.rotation(row, unit, config),
          materialIndex: 0,
        });

        cursorX += tileWidth + jointV;
        unit += 1;
      }
    }

    return {
      tiles,
      strokes: [],
      totalWidth,
      totalHeight: rows * stepY,
      repeatWidth: totalWidth,
      repeatHeight: rows * stepY,
      repeatOffsetX: 0,
      repeatOffsetY: 0,
      previewOutline: undefined,
    };
  },
};

const HERRINGBONE_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    left: { width: 1, height: 1 },
    right: { width: 1, height: 1 },
  },
  offsetX: () => 0,
  offsetY: () => 0,
  rotation: (_row, col) => (col % 2 === 0 ? -45 : 45),
  getTileType: (_row, col) => (col % 2 === 0 ? 'left' : 'right'),
  customGenerate: (config, helpers) => {
    const material = config.materials[0]!;
    const rows = Math.max(1, config.pattern.rows);
    const columns = Math.max(1, Math.ceil(config.pattern.columns / 2));
    const jointH = config.joints.horizontalSize;
    const jointV = config.joints.verticalSize;
    const projectedSpan = (material.width + material.height) / Math.SQRT2;
    const stepX = projectedSpan + jointV / Math.SQRT2;
    const stepY = projectedSpan + jointH / Math.SQRT2;
    const halfStepX = stepX / 2;
    const halfStepY = stepY / 2;
    const tiles: PatternTile[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const baseX = col * stepX;
        const baseY = row * stepY;

        tiles.push({
          x: baseX - material.width / 2,
          y: baseY + halfStepY - material.height / 2,
          width: material.width,
          height: material.height,
          rotation: -45,
          materialIndex: 0,
          applyJointInset: false,
        });

        tiles.push({
          x: baseX + halfStepX - material.width / 2,
          y: baseY - material.height / 2,
          width: material.width,
          height: material.height,
          rotation: 45,
          materialIndex: 0,
          applyJointInset: false,
        });
      }
    }

    const layout = helpers.normalizeLayoutBounds(tiles, jointH, jointV, {
      width: columns * stepX,
      height: rows * stepY,
    });

    const normalizeOffset = (value: number, period: number) => {
      const safePeriod = Math.max(period, 1);
      return ((value % safePeriod) + safePeriod) % safePeriod;
    };

    return {
      ...layout,
      repeatOffsetX: normalizeOffset(layout.repeatOffsetX ?? 0, stepX),
      repeatOffsetY: normalizeOffset(layout.repeatOffsetY ?? 0, stepY),
    };
  },
};

const BASKETWEAVE_DEFINITION: PatternEngineDefinition = {
  tileTypes: {
    horizontal: { width: 1, height: 1 },
    vertical: { width: 1, height: 1 },
  },
  offsetX: () => 0,
  offsetY: () => 0,
  rotation: () => 0,
  getTileType: () => 'horizontal',
  customGenerate: (config, helpers) => {
    const material = config.materials[0]!;
    const rows = Math.max(1, config.pattern.rows);
    const columns = Math.max(1, config.pattern.columns);
    const jointH = config.joints.horizontalSize;
    const jointV = config.joints.verticalSize;
    const weaveCount = Math.max(1, config.pattern.weaves ?? 1);
    const moduleWidth = material.width + material.height * weaveCount + jointV * weaveCount;
    const moduleHeight = material.width + material.height * weaveCount + jointH * weaveCount;
    const tiles: PatternTile[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const baseX = col * moduleWidth;
        const baseY = row * moduleHeight;
        const flip = (row + col) % 2 === 1;

        if (!flip) {
          for (let weave = 0; weave < weaveCount; weave++) {
            tiles.push({
              x: baseX,
              y: baseY + weave * (material.height + jointH),
              width: material.width,
              height: material.height,
              rotation: 0,
              materialIndex: 0,
            });
            tiles.push({
              x: baseX + material.width + jointV + weave * (material.height + jointV),
              y: baseY,
              width: material.height,
              height: material.width,
              rotation: 0,
              materialIndex: 0,
            });
          }
        } else {
          for (let weave = 0; weave < weaveCount; weave++) {
            tiles.push({
              x: baseX + weave * (material.height + jointV),
              y: baseY,
              width: material.height,
              height: material.width,
              rotation: 0,
              materialIndex: 0,
            });
            tiles.push({
              x: baseX,
              y: baseY + material.width + jointH + weave * (material.height + jointH),
              width: material.width,
              height: material.height,
              rotation: 0,
              materialIndex: 0,
            });
          }
        }
      }
    }

    return helpers.withBounds(tiles, jointH, jointV);
  },
};

const PATTERN_REGISTRY: Partial<Record<PatternType, PatternEngineDefinition>> = {
  running_bond: RUNNING_BOND_DEFINITION,
  stack_bond: STACK_BOND_DEFINITION,
  stretcher_bond: STRETCHER_BOND_DEFINITION,
  flemish_bond: FLEMISH_DEFINITION,
  herringbone: HERRINGBONE_DEFINITION,
  staggered: STAGGERED_DEFINITION,
  basketweave: BASKETWEAVE_DEFINITION,
};

export function generateRegistryPatternLayout(config: TextureConfig): PatternLayoutData | null {
  const definition = PATTERN_REGISTRY[config.pattern.type];
  if (!definition) return null;

  if (definition.customGenerate) {
    return definition.customGenerate(config, { withBounds, normalizeLayoutBounds }, definition);
  }

  return generateGridLayout(config, definition);
}
