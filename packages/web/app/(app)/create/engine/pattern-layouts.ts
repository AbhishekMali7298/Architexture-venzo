import type { TextureConfig, PatternType } from '@textura/shared';

export interface PatternTile {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  materialIndex: number;
  clipPath?: { x: number; y: number }[];
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

function layoutNone(config: TextureConfig): PatternLayoutData {
  const { width, height } = getMaterialMetrics(config);

  return {
    tiles: [
      {
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        materialIndex: 0,
      },
    ],
    totalWidth: width,
    totalHeight: height,
  };
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
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    let cursorX = row % 2 === 1 ? -(headerWidth + verticalJoint) : 0;
    for (let unit = 0; unit < columns * 2; unit++) {
      const useHeader = unit % 2 === 0;
      const tileWidth = useHeader ? headerWidth : width;
      tiles.push({
        x: cursorX,
        y: row * (height + horizontalJoint),
        width: tileWidth,
        height,
        rotation: 0,
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
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const diagonalModule = Math.max(width, height) + Math.max(height, width * 0.25);
  const step = diagonalModule / 2;
  const tiles: PatternTile[] = [];
  const useOrthogonal = Math.abs((((angle % 180) + 180) % 180) - 90) < 0.001;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * (diagonalModule + verticalJoint);
      const baseY = row * (diagonalModule + horizontalJoint);

      if (useOrthogonal) {
        tiles.push({
          x: baseX,
          y: baseY,
          width,
          height,
          rotation: 0,
          materialIndex: 0,
        });

        tiles.push({
          x: baseX + width - height,
          y: baseY + height,
          width,
          height,
          rotation: 90,
          materialIndex: 0,
        });
      } else {
        tiles.push({
          x: baseX,
          y: baseY + step,
          width,
          height,
          rotation: -45,
          materialIndex: 0,
        });

        tiles.push({
          x: baseX + step,
          y: baseY,
          width,
          height,
          rotation: 45,
          materialIndex: 0,
        });
      }
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutChevron(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const pieceWidth = Math.max(width / 2, 1);
  const clampedAngle = Math.max(5, Math.min(85, angle || 45));
  const angleRadians = (clampedAngle * Math.PI) / 180;
  const pieceHeight = Math.max(height * 2, 1);
  const mitreRise = Math.max(1, Math.min(pieceHeight, pieceWidth * Math.tan(angleRadians)));
  const shoulderY = Math.max((pieceHeight - mitreRise) / 2, 0);
  const rowStep = height + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * (width + verticalJoint);
      const baseY = row * rowStep - height;

      tiles.push({
        x: baseX,
        y: baseY,
        width: pieceWidth,
        height: pieceHeight,
        rotation: 0,
        materialIndex: 0,
        clipPath: [
          { x: 0, y: height },
          { x: pieceWidth, y: shoulderY },
          { x: pieceWidth, y: shoulderY + height },
          { x: 0, y: pieceHeight },
        ],
      });
      tiles.push({
        x: baseX + pieceWidth,
        y: baseY,
        width: pieceWidth,
        height: pieceHeight,
        rotation: 0,
        materialIndex: 0,
        clipPath: [
          { x: 0, y: shoulderY },
          { x: pieceWidth, y: height },
          { x: pieceWidth, y: pieceHeight },
          { x: 0, y: shoulderY + height },
        ],
      });
    }
  }

  // Chevron pieces intentionally overlap adjacent rows; keep the repeat period
  // tied to the user-facing module size so the border matches the editor controls.
  return {
    tiles,
    totalWidth: columns * width + Math.max(0, columns - 1) * verticalJoint,
    totalHeight: rows * height + Math.max(0, rows - 1) * horizontalJoint,
  };
}

function layoutBasketweave(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const moduleWidth = width + height * 2 + verticalJoint * 2;
  const moduleHeight = width + height * 2 + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * moduleWidth;
      const baseY = row * moduleHeight;
      const flip = (row + column) % 2 === 1;

      if (!flip) {
        tiles.push({ x: baseX, y: baseY, width, height, rotation: 0, materialIndex: 0 });
        tiles.push({ x: baseX, y: baseY + height + horizontalJoint, width, height, rotation: 0, materialIndex: 0 });
        tiles.push({
          x: baseX + width + verticalJoint,
          y: baseY,
          width: height,
          height: width,
          rotation: 0,
          materialIndex: 0,
        });
        tiles.push({
          x: baseX + width + height + verticalJoint * 2,
          y: baseY,
          width: height,
          height: width,
          rotation: 0,
          materialIndex: 0,
        });
      } else {
        tiles.push({
          x: baseX,
          y: baseY,
          width: height,
          height: width,
          rotation: 0,
          materialIndex: 0,
        });
        tiles.push({
          x: baseX + height + verticalJoint,
          y: baseY,
          width: height,
          height: width,
          rotation: 0,
          materialIndex: 0,
        });
        tiles.push({
          x: baseX,
          y: baseY + width + horizontalJoint,
          width,
          height,
          rotation: 0,
          materialIndex: 0,
        });
        tiles.push({
          x: baseX,
          y: baseY + width + height + horizontalJoint * 2,
          width,
          height,
          rotation: 0,
          materialIndex: 0,
        });
      }
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutHexagonal(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const hexWidth = width;
  const hexHeight = width * 1.1547;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const offsetX = row % 2 === 1 ? hexWidth / 2 : 0;
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * (hexWidth + verticalJoint) + offsetX,
        y: row * (hexHeight * 0.75 + horizontalJoint),
        width: hexWidth,
        height: hexHeight,
        rotation: 0,
        materialIndex: 0,
        clipPath: [
          { x: hexWidth * 0.25, y: 0 },
          { x: hexWidth * 0.75, y: 0 },
          { x: hexWidth, y: hexHeight * 0.5 },
          { x: hexWidth * 0.75, y: hexHeight },
          { x: hexWidth * 0.25, y: hexHeight },
          { x: 0, y: hexHeight * 0.5 },
        ],
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutAshlar(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];
  const rowPatterns = [
    [0.5, 1.5, 1],
    [1.25, 0.75, 1.25],
    [1, 0.5, 1.5],
  ];
  const rowHeights = [0.75, 0.5, 0.6];

  for (let row = 0; row < rows; row++) {
    const heightFactor = rowHeights[row % rowHeights.length]!;
    const tileHeight = Math.max(height * heightFactor, 1);
    const widths = rowPatterns[row % rowPatterns.length]!;
    let cursorX = 0;

    for (let column = 0; column < columns; column++) {
      const widthFactor = widths[column % widths.length]!;
      const tileWidth = Math.max(width * widthFactor, 1);
      tiles.push({
        x: cursorX,
        y: row * (height + horizontalJoint),
        width: tileWidth,
        height: tileHeight,
        rotation: 0,
        materialIndex: 0,
      });
      cursorX += tileWidth + verticalJoint;
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutPinwheel(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const square = Math.max(Math.min(width, height), 1);
  const armLength = square * 1.5;
  const armThickness = square * 0.5;
  const unitWidth = armLength + square + verticalJoint * 2;
  const unitHeight = armLength + square + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * unitWidth;
      const baseY = row * unitHeight;

      tiles.push({ x: baseX, y: baseY, width: armLength, height: armThickness, rotation: 0, materialIndex: 0 });
      tiles.push({
        x: baseX + armLength + verticalJoint,
        y: baseY + armThickness,
        width: armThickness,
        height: square,
        rotation: 0,
        materialIndex: 0,
      });
      tiles.push({
        x: baseX + armThickness,
        y: baseY + armLength + horizontalJoint,
        width: armLength,
        height: armThickness,
        rotation: 0,
        materialIndex: 0,
      });
      tiles.push({
        x: baseX,
        y: baseY + armThickness,
        width: armThickness,
        height: square,
        rotation: 0,
        materialIndex: 0,
      });
      tiles.push({
        x: baseX + armThickness,
        y: baseY + armThickness,
        width: square,
        height: square,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutWindmill(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const square = Math.max(Math.min(width, height), 1);
  const arm = square * 1.5;
  const armThickness = square * 0.5;
  const unitWidth = arm + square + verticalJoint * 2;
  const unitHeight = arm + square + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * unitWidth;
      const baseY = row * unitHeight;

      tiles.push({ x: baseX, y: baseY, width: arm, height: armThickness, rotation: 0, materialIndex: 0 });
      tiles.push({
        x: baseX + arm + verticalJoint,
        y: baseY,
        width: armThickness,
        height: arm,
        rotation: 0,
        materialIndex: 0,
      });
      tiles.push({
        x: baseX + armThickness,
        y: baseY + arm + horizontalJoint,
        width: arm,
        height: armThickness,
        rotation: 0,
        materialIndex: 0,
      });
      tiles.push({
        x: baseX,
        y: baseY + armThickness,
        width: armThickness,
        height: arm,
        rotation: 0,
        materialIndex: 0,
      });
      tiles.push({
        x: baseX + armThickness,
        y: baseY + armThickness,
        width: square,
        height: square,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}
const PATTERN_LAYOUTS: Partial<Record<PatternType, (config: TextureConfig) => PatternLayoutData>> = {
  none: layoutNone,
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
  fishscale: layoutHexagonal,
  french: layoutEnglishBond,
  hexagon_and_triangle: layoutHexagonal,
  hexagon_weave: layoutHexagonal,
  hopscotch: layoutPinwheel,
  houndstooth: layoutPinwheel,
  hourglass: layoutChevron,
  intersecting_circle: layoutHexagonal,
  isosceles: layoutChevron,
  mansion_weave: layoutBasketweave,
  mixed_stones: layoutAshlar,
  octagon_square: layoutPinwheel,
  octagon_star: layoutPinwheel,
  ogee_fishscale: layoutHexagonal,
  plus: layoutPinwheel,
  plus_square: layoutPinwheel,
  rounded_rubble: layoutAshlar,
  rubble: layoutAshlar,
  staggered: layoutRunningBond,
  staggered_isosceles: layoutChevron,
  star_and_cross: layoutPinwheel,
  star_and_hexagon: layoutHexagonal,
  swiss_cross: layoutPinwheel,
  swiss_cross_square: layoutPinwheel,
  triangle: layoutChevron,
  triangle_chevron: layoutChevron,
  triangle_diamond: layoutChevron,
  triple_herringbone: layoutHerringbone,
  variable_hexagon: layoutHexagonal,
};

export function getPatternLayout(config: TextureConfig): PatternLayoutData {
  const layout = PATTERN_LAYOUTS[config.pattern.type] ?? layoutRunningBond;
  return layout(config);
}
