import { type TextureConfig, type PatternType } from '@textura/shared';
import { SVG_PATTERN_MODULES, type SvgPatternModule } from './generated/svg-pattern-modules';
import {
  getChevronRepeatPitch,
  getPatternLayoutSource,
  getPatternRepeatCounts,
  getSvgModuleScale,
} from '../lib/pattern-repeat-semantics';

export interface PatternTile {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  materialIndex: number;
  clipPath?: { x: number; y: number }[];
  applyJointInset?: boolean;
  skipEdgeStroke?: boolean;
}

export interface PatternStroke {
  points: { x: number; y: number }[];
  closed: boolean;
  width?: number;
}

export interface PatternLayoutData {
  tiles: PatternTile[];
  strokes: PatternStroke[];
  totalWidth: number;
  totalHeight: number;
  repeatWidth?: number;
  repeatHeight?: number;
  repeatOffsetX?: number;
  repeatOffsetY?: number;
  previewOutline?: { x: number; y: number }[];
  /** If set, use these dimensions for canvas zoom/scale instead of repeatWidth/Height.
   * Lets the dotted repeat frame show the correct tile count while keeping visual density stable. */
  displayRepeatWidth?: number;
  displayRepeatHeight?: number;
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
  strokes: PatternStroke[],
  horizontalJoint: number,
  verticalJoint: number,
  repeatBounds?: { width: number; height: number },
): PatternLayoutData {
  if (tiles.length === 0 && strokes.length === 0) {
    return {
      tiles,
      strokes,
      totalWidth: 0,
      totalHeight: 0,
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

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
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

  const normalizedStrokes = offsetX === 0 && offsetY === 0
    ? strokes
    : strokes.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({
          x: point.x + offsetX,
          y: point.y + offsetY,
        })),
      }));

  return {
    tiles: normalizedTiles,
    strokes: normalizedStrokes,
    totalWidth: Math.max(0, maxX + offsetX, repeatBounds?.width ?? 0),
    totalHeight: Math.max(0, maxY + offsetY, repeatBounds?.height ?? 0),
    repeatWidth: repeatBounds?.width ?? Math.max(0, maxX + offsetX),
    repeatHeight: repeatBounds?.height ?? Math.max(0, maxY + offsetY),
    repeatOffsetX: offsetX,
    repeatOffsetY: offsetY,
    previewOutline: undefined,
  };
}

function isUsableSvgModule(module: SvgPatternModule | undefined): module is SvgPatternModule {
  return Boolean(
    module &&
      Number.isFinite(module.referenceTileWidth) &&
      Number.isFinite(module.referenceTileHeight) &&
      module.referenceTileWidth > 1 &&
      module.referenceTileHeight > 1 &&
      module.viewBoxWidth > 0 &&
      module.viewBoxHeight > 0 &&
      (module.tiles.length > 0 || module.strokes.length > 0),
  );
}

function layoutSvgModule(config: TextureConfig, module: SvgPatternModule): PatternLayoutData {
  const { horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const { rows, columns } = getPatternRepeatCounts(config);
  const { scaleX, scaleY } = getSvgModuleScale(config, module);
  const repeatWidth = (module.repeatWidth ?? module.viewBoxWidth) * scaleX;
  const repeatHeight = (module.repeatHeight ?? module.viewBoxHeight) * scaleY;
  const tiles: PatternTile[] = [];
  const strokes: PatternStroke[] = [];
  const strokeOnlyModule = module.tiles.length === 0 && module.strokes.length > 0;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offsetX = column * repeatWidth;
      const offsetY = row * repeatHeight;

      if (strokeOnlyModule) {
        tiles.push({
          x: offsetX,
          y: offsetY,
          width: repeatWidth,
          height: repeatHeight,
          rotation: 0,
          materialIndex: 0,
          applyJointInset: false,
          skipEdgeStroke: true,
        });
      }

      for (const tile of module.tiles) {
        tiles.push({
          x: offsetX + tile.x * scaleX,
          y: offsetY + tile.y * scaleY,
          width: tile.width * scaleX,
          height: tile.height * scaleY,
          rotation: 0,
          materialIndex: 0,
          clipPath: tile.clipPath.map((point) => ({
            x: point.x * scaleX,
            y: point.y * scaleY,
          })),
        });
      }

      for (const stroke of module.strokes) {
        strokes.push({
          closed: stroke.closed,
          points: stroke.points.map((point) => ({
            x: offsetX + point.x * scaleX,
            y: offsetY + point.y * scaleY,
          })),
        });
      }
    }
  }

  const layout = normalizeLayoutBounds(tiles, strokes, horizontalJoint, verticalJoint, {
    width: columns * repeatWidth,
    height: rows * repeatHeight,
  });

  if (config.pattern.type === 'ashlar') {
    return {
      ...layout,
      // Keep ashlar border phase stable so the dotted repeat frame stays aligned
      // to the same visual seam across row/column edits.
      repeatOffsetX: 0,
      repeatOffsetY: 0,
    };
  }

  return layout;
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
    strokes: [],
    totalWidth: width,
    totalHeight: height,
    previewOutline: undefined,
  };
}

function layoutRunningBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns, stretchers } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;
  const cycle = Math.max(2, stretchers + 1);

  for (let row = 0; row < rows; row++) {
    const offset = (row % cycle) * (stepX / cycle);
    const hasOffset = offset > 0.0001;
    const startColumn = hasOffset ? -1 : 0;
    const endColumn = hasOffset ? columns : columns - 1;

    for (let column = startColumn; column <= endColumn; column++) {
      tiles.push({
        x: column * stepX + offset,
        y: row * stepY,
        width,
        height,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return {
    tiles,
    strokes: [],
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
    repeatWidth: columns * stepX,
    repeatHeight: rows * stepY,
    repeatOffsetX: 0,
    repeatOffsetY: 0,
    previewOutline: undefined,
  };
}

function layoutStackBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * stepX,
        y: row * stepY,
        width,
        height,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutStretcherBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;

  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 1 ? stepX / 2 : 0;
    for (let column = -1; column < columns; column++) {
      tiles.push({
        x: column * stepX + offset,
        y: row * stepY,
        width,
        height,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  return {
    tiles,
    strokes: [],
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
    repeatWidth: columns * stepX,
    repeatHeight: rows * stepY,
    repeatOffsetX: 0,
    repeatOffsetY: 0,
  };
}

function layoutFlemishBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const tiles: PatternTile[] = [];
  const stepY = height + horizontalJoint;
  const pairWidth = width + headerWidth + verticalJoint * 2;
  const halfPairOffset = pairWidth / 2;
  const totalWidth = Math.max(columns, 1) * halfPairOffset;

  for (let row = 0; row < rows; row++) {
    let cursorX = row % 2 === 1 ? -halfPairOffset : 0;
    const startWithHeader = row % 2 === 1;
    let unit = 0;

    while (cursorX < totalWidth + width) {
      const useHeader = startWithHeader ? unit % 2 === 0 : unit % 2 === 1;
      const tileWidth = useHeader ? headerWidth : width;
      tiles.push({
        x: cursorX,
        y: row * stepY,
        width: tileWidth,
        height,
        rotation: 0,
        materialIndex: 0,
      });
      cursorX += tileWidth + verticalJoint;
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
  };
}

function layoutEnglishBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const tiles: PatternTile[] = [];
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;

  for (let row = 0; row < rows; row++) {
    if (row % 2 === 0) {
      for (let column = 0; column < columns; column++) {
        tiles.push({
          x: column * stepX,
          y: row * stepY,
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
        y: row * stepY,
        width: headerWidth,
        height,
        rotation: angle,
        materialIndex: 0,
      });
    }
  }

  return {
    tiles,
    strokes: [],
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
  };
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
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);

  // Use half-column module grouping so the visual count stays close to the
  // authored herringbone rhythm while keeping row controls intuitive.
  const repeatColumns = Math.max(1, Math.ceil(columns / 2));
  const repeatRows = Math.max(1, rows);

  const stepX = width + height + verticalJoint;
  const stepY = height + horizontalJoint + width * 0.115;
  const halfStepX = stepX / 2;
  const halfStepY = stepY / 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < repeatRows; row++) {
    for (let column = 0; column < repeatColumns; column++) {
      const baseX = column * stepX;
      const baseY = row * stepY;

      tiles.push({
        x: baseX,
        y: baseY + halfStepY,
        width,
        height,
        rotation: -45,
        materialIndex: 0,
      });

      tiles.push({
        x: baseX + halfStepX,
        y: baseY,
        width,
        height,
        rotation: 45,
        materialIndex: 0,
      });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutStaggered(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;
  const halfStepX = stepX / 2;

  for (let row = 0; row < rows; row++) {
    const offsetX = row % 2 === 1 ? halfStepX : 0;
    const startColumn = row % 2 === 1 ? -1 : 0;
    const endColumn = row % 2 === 1 ? columns : columns - 1;

    for (let column = startColumn; column <= endColumn; column++) {
      tiles.push({
        x: column * stepX + offsetX,
        y: row * stepY,
        width,
        height,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  return {
    tiles,
    strokes: [],
    totalWidth: columns * stepX,
    totalHeight: rows * stepY,
  };
}

function layoutChevron(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const pieceWidth = Math.max(width / 2, 1);
  const clampedAngle = Math.max(0, Math.min(45, angle || 30));
  const angleRadians = (clampedAngle * Math.PI) / 180;
  const rise = Math.max(0, pieceWidth * Math.tan(angleRadians));
  const pieceHeight = Math.max(height + rise, 1);
  const pitch = getChevronRepeatPitch(config);
  const stepX = pitch.width;
  const stepY = pitch.height;
  const tiles: PatternTile[] = [];
  const leftClipPath = [
    { x: 0, y: rise },
    { x: pieceWidth, y: 0 },
    { x: pieceWidth, y: height },
    { x: 0, y: pieceHeight },
  ];
  const rightClipPath = [
    { x: 0, y: 0 },
    { x: pieceWidth, y: rise },
    { x: pieceWidth, y: pieceHeight },
    { x: 0, y: height },
  ];

  // columns = individual chevron half-arms (two halves make one full V-pair).
  const halfColumns = Math.max(1, columns);
  const vPairs = Math.max(1, Math.ceil(halfColumns / 2));

  // Draw one bleed ring around the visible repeat so the background tiles
  // seamlessly outside the bordered frame.
  for (let row = -1; row <= rows; row++) {
    for (let column = -1; column <= vPairs; column++) {
      const baseX = column * stepX;
      const baseY = row * stepY - height;

      tiles.push({
        x: baseX,
        y: baseY,
        width: pieceWidth,
        height: pieceHeight,
        rotation: 0,
        materialIndex: 0,
        clipPath: leftClipPath,
      });
      tiles.push({
        x: baseX + pieceWidth,
        y: baseY,
        width: pieceWidth,
        height: pieceHeight,
        rotation: 0,
        materialIndex: 0,
        clipPath: rightClipPath,
      });
    }
  }

  const layout = normalizeLayoutBounds(tiles, [], horizontalJoint, verticalJoint, {
    width: halfColumns * (stepX / 2),
    height: rows * stepY,
  });

  // With chevron columns defined as full V-pairs, the bordered repeat should
  // start on the canonical seam so the frame matches the live site alignment.
  const repeatPhaseX = 0;

  const normalizeOffset = (value: number, period: number) => {
    const safePeriod = Math.max(period, 1);
    return ((value % safePeriod) + safePeriod) % safePeriod;
  };

  const canonicalOffsetX = normalizeOffset((layout.repeatOffsetX ?? 0) + repeatPhaseX, stepX);
  // Chevron pieces extend beyond a single vertical pitch, so reducing the
  // offset modulo stepY shifts the bordered frame into the bleed region at
  // steep angles and visibly cuts the top/bottom of the pattern.
  const canonicalOffsetY = layout.repeatOffsetY ?? 0;

  return {
    ...layout,
    repeatOffsetX: canonicalOffsetX,
    repeatOffsetY: canonicalOffsetY,
    displayRepeatWidth: halfColumns * (stepX / 2),
    displayRepeatHeight: rows * stepY,
  };
}

function layoutBasketweave(config: TextureConfig): PatternLayoutData {
  const { rows, columns, weaves } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const weaveCount = Math.max(1, weaves);
  const moduleWidth = width + height * weaveCount + verticalJoint * weaveCount;
  const moduleHeight = width + height * weaveCount + horizontalJoint * weaveCount;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const baseX = column * moduleWidth;
      const baseY = row * moduleHeight;
      const flip = (row + column) % 2 === 1;

      // Each basket groups `weaveCount` bricks in one direction, then alternates
      // orientation in the neighboring cell to preserve the classic weave rhythm.
      if (!flip) {
        for (let weave = 0; weave < weaveCount; weave++) {
          tiles.push({
            x: baseX,
            y: baseY + weave * (height + horizontalJoint),
            width,
            height,
            rotation: 0,
            materialIndex: 0,
          });
          tiles.push({
            x: baseX + width + verticalJoint + weave * (height + verticalJoint),
            y: baseY,
            width: height,
            height: width,
            rotation: 0,
            materialIndex: 0,
          });
        }
      } else {
        for (let weave = 0; weave < weaveCount; weave++) {
          tiles.push({
            x: baseX + weave * (height + verticalJoint),
            y: baseY,
            width: height,
            height: width,
            rotation: 0,
            materialIndex: 0,
          });
          tiles.push({
            x: baseX,
            y: baseY + width + horizontalJoint + weave * (height + horizontalJoint),
            width,
            height,
            rotation: 0,
            materialIndex: 0,
          });
        }
      }
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

function layoutHexagonal(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const side = Math.max(1, Math.min(width, height) * 0.5);
  const hexWidth = side * Math.sqrt(3);
  const hexHeight = side * 2;
  const stepX = hexWidth + verticalJoint;
  const stepY = hexHeight * 0.75 + horizontalJoint;
  const tiles: PatternTile[] = [];

  // Generate bleed tiles outside bounds so repeating and preview clipping are seam-free.
  for (let row = -1; row <= rows; row++) {
    const oddRow = Math.abs(row % 2) === 1;
    const offsetX = oddRow ? stepX * 0.5 : 0;
    const startColumn = oddRow ? -1 : 0;
    const endColumn = oddRow ? columns : columns - 1;

    for (let column = startColumn; column <= endColumn; column++) {
      tiles.push({
        x: column * stepX + offsetX,
        y: row * stepY,
        width: hexWidth,
        height: hexHeight,
        rotation: 0,
        materialIndex: 0,
        clipPath: [
          { x: hexWidth * 0.5, y: 0 },
          { x: hexWidth, y: hexHeight * 0.25 },
          { x: hexWidth, y: hexHeight * 0.75 },
          { x: hexWidth * 0.5, y: hexHeight },
          { x: 0, y: hexHeight * 0.75 },
          { x: 0, y: hexHeight * 0.25 },
        ],
      });
    }
  }

  const totalWidth = columns * stepX;
  const totalHeight = rows * stepY;
  const outlineInsetY = Math.min(hexHeight * 0.25, totalHeight / 2);

  return {
    tiles,
    strokes: [],
    totalWidth,
    totalHeight,
    previewOutline: [
      { x: 0, y: outlineInsetY / totalHeight },
      { x: 0.5, y: 0 },
      { x: 1, y: outlineInsetY / totalHeight },
      { x: 1, y: (totalHeight - outlineInsetY) / totalHeight },
      { x: 0.5, y: 1 },
      { x: 0, y: (totalHeight - outlineInsetY) / totalHeight },
    ],
  };
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
  const stepY = height + horizontalJoint;
  const repeatWidth = Math.max(columns, 1) * (width + verticalJoint);
  const repeatHeight = Math.max(rows, 1) * stepY;
  const wrapIndex = (value: number, length: number) => ((value % length) + length) % length;

  for (let row = -1; row <= rows; row++) {
    const heightFactor = rowHeights[wrapIndex(row, rowHeights.length)]!;
    const tileHeight = Math.max(height * heightFactor, 1);
    const widths = rowPatterns[wrapIndex(row, rowPatterns.length)]!;
    let cursorX = -repeatWidth;
    let unit = 0;

    while (cursorX < repeatWidth * 2) {
      const widthFactor = widths[unit % widths.length]!;
      const tileWidth = Math.max(width * widthFactor, 1);
      tiles.push({
        x: cursorX,
        y: row * stepY,
        width: tileWidth,
        height: tileHeight,
        rotation: 0,
        materialIndex: 0,
      });
      cursorX += tileWidth + verticalJoint;
      unit += 1;
    }
  }

  return normalizeLayoutBounds(tiles, [], horizontalJoint, verticalJoint, {
    width: repeatWidth,
    height: repeatHeight,
  });
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

function layoutFishscale(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const stepX = width + verticalJoint;
  const stepY = Math.max(height * 0.55 + horizontalJoint, 1);
  const scallopWidth = width;
  const scallopHeight = height;
  const shoulderSamples = 8;
  const arcSamples = 18;
  const centerX = scallopWidth / 2;
  const midY = scallopHeight / 2;
  const radius = Math.max(scallopWidth / 2, 1);
  const scallopPoints: { x: number; y: number }[] = [];

  // Build a scallop outline path. We use strokes over a continuous material fill
  // instead of clipping each tile into a separate fishscale, which leaves gaps
  // between rows and does not match the original Architextures behavior.
  for (let sample = 0; sample <= shoulderSamples; sample++) {
    const t = sample / shoulderSamples;
    const inv = 1 - t;
    scallopPoints.push({
      x: inv * inv * centerX + 2 * inv * t * 0 + t * t * 0,
      y: inv * inv * 0 + 2 * inv * t * 0 + t * t * midY,
    });
  }

  for (let sample = 1; sample < arcSamples; sample++) {
    const t = sample / arcSamples;
    const theta = Math.PI - Math.PI * t;
    scallopPoints.push({
      x: centerX + Math.cos(theta) * radius,
      y: midY + Math.sin(theta) * radius,
    });
  }

  for (let sample = shoulderSamples; sample >= 0; sample--) {
    const t = sample / shoulderSamples;
    const inv = 1 - t;
    scallopPoints.push({
      x: inv * inv * scallopWidth + 2 * inv * t * scallopWidth + t * t * centerX,
      y: inv * inv * midY + 2 * inv * t * 0 + t * t * 0,
    });
  }

  const totalWidth = columns * stepX;
  const totalHeight = rows * stepY + scallopHeight * 0.45;
  const tiles: PatternTile[] = [
    {
      x: 0,
      y: 0,
      width: totalWidth,
      height: totalHeight,
      rotation: 0,
      materialIndex: 0,
      applyJointInset: false,
      skipEdgeStroke: true,
    },
  ];
  const strokes: PatternStroke[] = [];

  for (let row = -1; row < rows + 1; row++) {
    const offsetX = row % 2 === 1 ? stepX / 2 : 0;
    for (let column = -1; column < columns + 1; column++) {
      strokes.push({
        points: scallopPoints.map((point) => ({
          x: column * stepX + offsetX + point.x,
          y: row * stepY + point.y,
        })),
        closed: true,
      });
    }
  }

  return normalizeLayoutBounds(tiles, strokes, horizontalJoint, verticalJoint);
}

const PATTERN_LAYOUTS: Partial<Record<PatternType, (config: TextureConfig) => PatternLayoutData>> = {
  none: layoutNone,
  running_bond: layoutRunningBond,
  stack_bond: layoutStackBond,
  stretcher_bond: layoutStretcherBond,
  flemish_bond: layoutFlemishBond,
  herringbone: layoutHerringbone,
  chevron: layoutChevron,
  staggered: layoutStaggered,
  basketweave: layoutBasketweave,
  hexagonal: layoutHexagonal,
  ashlar: layoutAshlar,
  fishscale: layoutFishscale,
};

export function getPatternLayout(config: TextureConfig): PatternLayoutData {
  const module = SVG_PATTERN_MODULES[config.pattern.type];
  if (getPatternLayoutSource(config.pattern.type) === 'svg-module' && isUsableSvgModule(module)) {
    return layoutSvgModule(config, module);
  }

  const proceduralLayout = PATTERN_LAYOUTS[config.pattern.type];
  if (proceduralLayout) {
    return proceduralLayout(config);
  }
  throw new Error(`No layout available for pattern: ${config.pattern.type}`);
}
