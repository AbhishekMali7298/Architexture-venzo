import { getPatternByType, type TextureConfig, type PatternType } from '@textura/shared';
import { SVG_PATTERN_MODULES, type SvgPatternModule } from './generated/svg-pattern-modules';

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

// ─── BOUNDS HELPERS ──────────────────────────────────────────────────────────

function withBounds(
  tiles: PatternTile[],
  horizontalJoint: number,
  verticalJoint: number,
): PatternLayoutData {
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
      totalWidth: repeatBounds?.width ?? 0,
      totalHeight: repeatBounds?.height ?? 0,
      repeatWidth: repeatBounds?.width ?? 0,
      repeatHeight: repeatBounds?.height ?? 0,
      repeatOffsetX: 0,
      repeatOffsetY: 0,
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
    for (const p of stroke.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  const offsetX = Number.isFinite(minX) ? -Math.min(minX, 0) : 0;
  const offsetY = Number.isFinite(minY) ? -Math.min(minY, 0) : 0;

  const normalizedTiles =
    offsetX === 0 && offsetY === 0
      ? tiles
      : tiles.map((t) => ({ ...t, x: t.x + offsetX, y: t.y + offsetY }));

  const normalizedStrokes =
    offsetX === 0 && offsetY === 0
      ? strokes
      : strokes.map((s) => ({
          ...s,
          points: s.points.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY })),
        }));

  return {
    tiles: normalizedTiles,
    strokes: normalizedStrokes,
    totalWidth: Math.max(0, maxX + offsetX),
    totalHeight: Math.max(0, maxY + offsetY),
    repeatWidth: repeatBounds?.width ?? Math.max(0, maxX + offsetX),
    repeatHeight: repeatBounds?.height ?? Math.max(0, maxY + offsetY),
    repeatOffsetX: offsetX,
    repeatOffsetY: offsetY,
  };
}

// ─── SVG MODULE LAYOUT ───────────────────────────────────────────────────────
// Scale by the axis that gives the smallest scale factor so the tile fits
// within the user-specified width AND height. The SVG aspect ratio is preserved.

function layoutFromSvgModule(config: TextureConfig, module: SvgPatternModule): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const refW = Math.max(module.referenceTileWidth, 1);
  const refH = Math.max(module.referenceTileHeight, 1);

  // Use the smaller of the two axis scales so the tile fits user dimensions
  const scale = Math.max(0.01, Math.min(width / refW, height / refH));

  const repeatW = (module.repeatWidth ?? module.viewBoxWidth) * scale;
  const repeatH = (module.repeatHeight ?? module.viewBoxHeight) * scale;
  const moduleViewW = module.viewBoxWidth * scale;
  const moduleViewH = module.viewBoxHeight * scale;

  const tiles: PatternTile[] = [];
  const strokes: PatternStroke[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const ox = col * repeatW;
      const oy = row * repeatH;

      if (module.tiles.length === 0 && module.strokes.length > 0) {
        tiles.push({
          x: ox, y: oy,
          width: moduleViewW, height: moduleViewH,
          rotation: 0, materialIndex: 0,
          applyJointInset: false, skipEdgeStroke: true,
        });
      }

      for (const tile of module.tiles) {
        tiles.push({
          x: ox + tile.x * scale,
          y: oy + tile.y * scale,
          width: tile.width * scale,
          height: tile.height * scale,
          rotation: 0,
          materialIndex: 0,
          clipPath: tile.clipPath.map((p) => ({ x: p.x * scale, y: p.y * scale })),
        });
      }

      for (const stroke of module.strokes) {
        strokes.push({
          points: stroke.points.map((p) => ({ x: ox + p.x * scale, y: oy + p.y * scale })),
          closed: stroke.closed,
          width: scale,
        });
      }
    }
  }

  return normalizeLayoutBounds(tiles, strokes, horizontalJoint, verticalJoint, {
    width: columns * repeatW,
    height: rows * repeatH,
  });
}

// ─── NONE ────────────────────────────────────────────────────────────────────

function layoutNone(config: TextureConfig): PatternLayoutData {
  const { width, height } = getMaterialMetrics(config);
  return {
    tiles: [{ x: 0, y: 0, width, height, rotation: 0, materialIndex: 0 }],
    strokes: [],
    totalWidth: width,
    totalHeight: height,
  };
}

// ─── STACK BOND ──────────────────────────────────────────────────────────────

function layoutStackBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      tiles.push({ x: col * stepX, y: row * stepY, width, height, rotation: angle, materialIndex: 0 });
    }
  }

  return { tiles, strokes: [], totalWidth: columns * stepX, totalHeight: rows * stepY };
}

// ─── RUNNING BOND (½-offset) ─────────────────────────────────────────────────
// Even rows flush left. Odd rows offset right by halfStep.
// col=-1 through col=columns ensures both edges are covered by clip.

function layoutRunningBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;
  const halfOffset = stepX / 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const rowOffset = row % 2 === 1 ? halfOffset : 0;
    for (let col = -1; col <= columns; col++) {
      tiles.push({ x: col * stepX + rowOffset, y: row * stepY, width, height, rotation: angle, materialIndex: 0 });
    }
  }

  return { tiles, strokes: [], totalWidth: columns * stepX, totalHeight: rows * stepY };
}

// ─── STRETCHER BOND ──────────────────────────────────────────────────────────

function layoutStretcherBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns, stretchers } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const cycle = Math.max(2, stretchers + 1);
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;
  const offsetStep = stepX / cycle;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const rowOffset = (row % cycle) * offsetStep;
    for (let col = -1; col <= columns; col++) {
      tiles.push({ x: col * stepX + rowOffset, y: row * stepY, width, height, rotation: angle, materialIndex: 0 });
    }
  }

  return { tiles, strokes: [], totalWidth: columns * stepX, totalHeight: rows * stepY };
}

// ─── FLEMISH BOND ─────────────────────────────────────────────────────────────
// FIX: totalWidth = columns * pairWidth (was columns * halfPairWidth — 50% too narrow).

function layoutFlemishBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const stepY = height + horizontalJoint;
  const pairWidth = width + verticalJoint + headerWidth + verticalJoint;
  const halfPairWidth = pairWidth / 2;
  const totalWidth = columns * pairWidth;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const startX = row % 2 === 1 ? -halfPairWidth : 0;
    let cursorX = startX;

    for (let unit = 0; unit < columns + 2; unit++) {
      tiles.push({ x: cursorX, y: row * stepY, width, height, rotation: 0, materialIndex: 0 });
      cursorX += width + verticalJoint;
      tiles.push({ x: cursorX, y: row * stepY, width: headerWidth, height, rotation: 0, materialIndex: 0 });
      cursorX += headerWidth + verticalJoint;
    }
  }

  return { tiles, strokes: [], totalWidth, totalHeight: rows * stepY };
}

// ─── ENGLISH BOND ─────────────────────────────────────────────────────────────

function layoutEnglishBond(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const headerWidth = Math.max(width / 2, 1);
  const stepX = width + verticalJoint;
  const headerStepX = headerWidth + verticalJoint;
  const stepY = height + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    const y = row * stepY;
    if (row % 2 === 0) {
      for (let col = 0; col < columns; col++) {
        tiles.push({ x: col * stepX, y, width, height, rotation: angle, materialIndex: 0 });
      }
    } else {
      const offset = headerStepX / 2;
      for (let col = -1; col <= columns * 2; col++) {
        tiles.push({ x: col * headerStepX + offset, y, width: headerWidth, height, rotation: angle, materialIndex: 0 });
      }
    }
  }

  return { tiles, strokes: [], totalWidth: columns * stepX, totalHeight: rows * stepY };
}

// ─── SOLDIER COURSE ───────────────────────────────────────────────────────────

function layoutSoldierCourse(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const stepX = height + verticalJoint;
  const stepY = width + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      tiles.push({ x: col * stepX, y: row * stepY, width: height, height: width, rotation: angle, materialIndex: 0 });
    }
  }

  return { tiles, strokes: [], totalWidth: columns * stepX, totalHeight: rows * stepY };
}

// ─── HERRINGBONE ──────────────────────────────────────────────────────────────
// FIX: correct module side = width + height + joint (not the old broken formula).

function layoutHerringbone(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const tiles: PatternTile[] = [];
  const useOrthogonal = Math.abs((((angle % 180) + 180) % 180) - 90) < 0.001;

  if (useOrthogonal) {
    const pairW = width + height + verticalJoint;
    const pairH = height + width + horizontalJoint;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const bx = col * pairW;
        const by = row * pairH;
        tiles.push({ x: bx, y: by, width, height, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx + width + verticalJoint, y: by + height + horizontalJoint, width: height, height: width, rotation: 0, materialIndex: 0 });
      }
    }

    return { tiles, strokes: [], totalWidth: columns * pairW, totalHeight: rows * pairH };
  }

  // 45° diagonal: correct module side = width + height + avg_joint
  const joint = (horizontalJoint + verticalJoint) / 2;
  const moduleSide = width + height + joint;
  const half = moduleSide / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cx = col * moduleSide + half;
      const cy = row * moduleSide + half;
      tiles.push({ x: cx - half / 2 - width / 2, y: cy - half / 2 - height / 2, width, height, rotation: -45, materialIndex: 0 });
      tiles.push({ x: cx + half / 2 - width / 2, y: cy - half / 2 - height / 2, width, height, rotation: 45, materialIndex: 0 });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

// ─── CHEVRON ──────────────────────────────────────────────────────────────────

function layoutChevron(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint, angle } = getMaterialMetrics(config);
  const pieceWidth = Math.max(width / 2, 1);
  const clampedAngle = Math.max(5, Math.min(85, angle || 45));
  const angleRadians = (clampedAngle * Math.PI) / 180;
  const pieceHeight = Math.max(height * 2, 1);
  const mitreRise = Math.max(1, Math.min(pieceHeight, pieceWidth * Math.tan(angleRadians)));
  const shoulderY = Math.max((pieceHeight - mitreRise) / 2, 0);
  const stepX = width + verticalJoint;
  const stepY = height + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let row = -1; row <= rows; row++) {
    for (let col = -1; col <= columns; col++) {
      const baseX = col * stepX;
      const baseY = row * stepY - height;

      tiles.push({
        x: baseX, y: baseY, width: pieceWidth, height: pieceHeight,
        rotation: 0, materialIndex: 0,
        clipPath: [
          { x: 0, y: height },
          { x: pieceWidth, y: shoulderY },
          { x: pieceWidth, y: shoulderY + height },
          { x: 0, y: pieceHeight },
        ],
      });

      tiles.push({
        x: baseX + pieceWidth, y: baseY, width: pieceWidth, height: pieceHeight,
        rotation: 0, materialIndex: 0,
        clipPath: [
          { x: 0, y: shoulderY },
          { x: pieceWidth, y: height },
          { x: pieceWidth, y: pieceHeight },
          { x: 0, y: shoulderY + height },
        ],
      });
    }
  }

  return { tiles, strokes: [], totalWidth: columns * stepX, totalHeight: rows * stepY };
}

// ─── BASKETWEAVE ──────────────────────────────────────────────────────────────

function layoutBasketweave(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const moduleW = width + height * 2 + verticalJoint * 2;
  const moduleH = width + height * 2 + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const bx = col * moduleW;
      const by = row * moduleH;
      const flip = (row + col) % 2 === 1;

      if (!flip) {
        tiles.push({ x: bx, y: by, width, height, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx, y: by + height + horizontalJoint, width, height, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx + width + verticalJoint, y: by, width: height, height: width, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx + width + height + verticalJoint * 2, y: by, width: height, height: width, rotation: 0, materialIndex: 0 });
      } else {
        tiles.push({ x: bx, y: by, width: height, height: width, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx + height + verticalJoint, y: by, width: height, height: width, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx, y: by + width + horizontalJoint, width, height, rotation: 0, materialIndex: 0 });
        tiles.push({ x: bx, y: by + width + height + horizontalJoint * 2, width, height, rotation: 0, materialIndex: 0 });
      }
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

// ─── HEXAGONAL ────────────────────────────────────────────────────────────────
// FIX: Use full joints (not 20%). Use correct pointy-top grid math.
// Compute explicit totalWidth/totalHeight (withBounds adds an extra joint incorrectly).

function layoutHexagonal(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);

  const s = Math.max(1, Math.min(width, height) / 2);
  const hexW = s * Math.sqrt(3);
  const hexH = s * 2;
  const colStep = hexW + verticalJoint;
  const rowStep = hexH * 0.75 + horizontalJoint;
  const tiles: PatternTile[] = [];

  for (let col = -1; col <= columns; col++) {
    const colOffsetY = Math.abs(col % 2) === 1 ? hexH * 0.5 : 0;
    for (let row = -1; row <= rows; row++) {
      tiles.push({
        x: col * colStep,
        y: row * rowStep + colOffsetY,
        width: hexW,
        height: hexH,
        rotation: 0,
        materialIndex: 0,
        clipPath: [
          { x: hexW * 0.5, y: 0 },
          { x: hexW,       y: hexH * 0.25 },
          { x: hexW,       y: hexH * 0.75 },
          { x: hexW * 0.5, y: hexH },
          { x: 0,          y: hexH * 0.75 },
          { x: 0,          y: hexH * 0.25 },
        ],
      });
    }
  }

  const totalWidth = columns * colStep - verticalJoint;
  const extraH = columns > 1 ? hexH * 0.5 : 0;
  const totalHeight = rows * rowStep + extraH;

  return {
    tiles, strokes: [],
    totalWidth, totalHeight,
    repeatWidth: totalWidth, repeatHeight: totalHeight,
    repeatOffsetX: 0, repeatOffsetY: 0,
  };
}

// ─── ASHLAR ───────────────────────────────────────────────────────────────────

function layoutAshlar(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const rowPatterns = [[0.5, 1.5, 1], [1.25, 0.75, 1.25], [1, 0.5, 1.5]];
  const rowHeights = [0.75, 0.5, 0.6];
  const stepY = height + horizontalJoint;
  const repeatWidth = Math.max(columns, 1) * (width + verticalJoint);
  const repeatHeight = Math.max(rows, 1) * stepY;
  const wrap = (v: number, len: number) => ((v % len) + len) % len;
  const tiles: PatternTile[] = [];

  for (let row = -1; row <= rows; row++) {
    const tileH = Math.max(height * rowHeights[wrap(row, rowHeights.length)]!, 1);
    const widths = rowPatterns[wrap(row, rowPatterns.length)]!;
    let cursorX = -repeatWidth;
    let unit = 0;

    while (cursorX < repeatWidth * 2) {
      const tileW = Math.max(width * widths[unit % widths.length]!, 1);
      tiles.push({ x: cursorX, y: row * stepY, width: tileW, height: tileH, rotation: 0, materialIndex: 0 });
      cursorX += tileW + verticalJoint;
      unit++;
    }
  }

  return normalizeLayoutBounds(tiles, [], horizontalJoint, verticalJoint, {
    width: repeatWidth,
    height: repeatHeight,
  });
}

// ─── PINWHEEL ─────────────────────────────────────────────────────────────────

function layoutPinwheel(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const sq = Math.max(Math.min(width, height), 1);
  const arm = sq * 1.5;
  const armT = sq * 0.5;
  const unitW = arm + sq + verticalJoint * 2;
  const unitH = arm + sq + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const bx = col * unitW;
      const by = row * unitH;
      tiles.push({ x: bx, y: by, width: arm, height: armT, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx + arm + verticalJoint, y: by + armT, width: armT, height: sq, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx + armT, y: by + arm + horizontalJoint, width: arm, height: armT, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx, y: by + armT, width: armT, height: sq, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx + armT, y: by + armT, width: sq, height: sq, rotation: 0, materialIndex: 0 });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

// ─── WINDMILL ─────────────────────────────────────────────────────────────────

function layoutWindmill(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const sq = Math.max(Math.min(width, height), 1);
  const arm = sq * 1.5;
  const armT = sq * 0.5;
  const unitW = arm + sq + verticalJoint * 2;
  const unitH = arm + sq + horizontalJoint * 2;
  const tiles: PatternTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const bx = col * unitW;
      const by = row * unitH;
      tiles.push({ x: bx, y: by, width: arm, height: armT, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx + arm + verticalJoint, y: by, width: armT, height: arm, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx + armT, y: by + arm + horizontalJoint, width: arm, height: armT, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx, y: by + armT, width: armT, height: arm, rotation: 0, materialIndex: 0 });
      tiles.push({ x: bx + armT, y: by + armT, width: sq, height: sq, rotation: 0, materialIndex: 0 });
    }
  }

  return withBounds(tiles, horizontalJoint, verticalJoint);
}

// ─── FISHSCALE ────────────────────────────────────────────────────────────────

function layoutFishscale(config: TextureConfig): PatternLayoutData {
  const { rows, columns } = config.pattern;
  const { width, height, horizontalJoint, verticalJoint } = getMaterialMetrics(config);
  const stepX = width + verticalJoint;
  const stepY = Math.max(height * 0.55 + horizontalJoint, 1);
  const scallopW = width;
  const scallopH = height;
  const cx = scallopW / 2;
  const midY = scallopH / 2;
  const radius = Math.max(scallopW / 2, 1);
  const shoulderSamples = 8;
  const arcSamples = 18;
  const scallopPoints: { x: number; y: number }[] = [];

  for (let i = 0; i <= shoulderSamples; i++) {
    const t = i / shoulderSamples;
    const inv = 1 - t;
    scallopPoints.push({ x: inv * inv * cx, y: t * t * midY });
  }
  for (let i = 1; i < arcSamples; i++) {
    const theta = Math.PI - Math.PI * (i / arcSamples);
    scallopPoints.push({ x: cx + Math.cos(theta) * radius, y: midY + Math.sin(theta) * radius });
  }
  for (let i = shoulderSamples; i >= 0; i--) {
    const t = i / shoulderSamples;
    const inv = 1 - t;
    scallopPoints.push({
      x: inv * inv * scallopW + 2 * inv * t * scallopW + t * t * cx,
      y: inv * inv * midY,
    });
  }

  const totalW = columns * stepX;
  const totalH = rows * stepY + scallopH * 0.45;
  const tiles: PatternTile[] = [{
    x: 0, y: 0, width: totalW, height: totalH,
    rotation: 0, materialIndex: 0,
    applyJointInset: false, skipEdgeStroke: true,
  }];
  const strokes: PatternStroke[] = [];

  for (let row = -1; row < rows + 1; row++) {
    const offsetX = row % 2 === 1 ? stepX / 2 : 0;
    for (let col = -1; col < columns + 1; col++) {
      strokes.push({
        points: scallopPoints.map((p) => ({
          x: col * stepX + offsetX + p.x,
          y: row * stepY + p.y,
        })),
        closed: true,
      });
    }
  }

  return normalizeLayoutBounds(tiles, strokes, horizontalJoint, verticalJoint);
}

// ─── PATTERN DISPATCH ─────────────────────────────────────────────────────────
// Procedural layouts always take priority over SVG modules for the patterns listed.
// SVG modules are used as fallback for any pattern type not listed here.

const PROCEDURAL_LAYOUTS: Partial<Record<PatternType, (config: TextureConfig) => PatternLayoutData>> = {
  none: layoutNone,
  running_bond: layoutRunningBond,
  stack_bond: layoutStackBond,
  stretcher_bond: layoutStretcherBond,
  flemish_bond: layoutFlemishBond,
  english_bond: layoutEnglishBond,
  soldier_course: layoutSoldierCourse,
  herringbone: layoutHerringbone,
  chevron: layoutChevron,
  basketweave: layoutBasketweave,
  hexagonal: layoutHexagonal,
  ashlar: layoutAshlar,
  fishscale: layoutFishscale,
  pinwheel: layoutPinwheel,
  windmill: layoutWindmill,
  // Aliases
  staggered: layoutRunningBond,
  subway: layoutRunningBond,
};

export function getPatternLayout(config: TextureConfig): PatternLayoutData {
  // 1. Procedural layout (exact geometry, respects rows/cols as tile counts)
  const procedural = PROCEDURAL_LAYOUTS[config.pattern.type];
  if (procedural) return procedural(config);

  // 2. SVG-driven layout (for exotic patterns: cubic, diamond, hopscotch, french, etc.)
  const svgModule = SVG_PATTERN_MODULES[config.pattern.type];
  if (
    svgModule &&
    svgModule.referenceTileWidth > 1 &&
    svgModule.referenceTileHeight > 1 &&
    (svgModule.tiles.length > 0 || svgModule.strokes.length > 0)
  ) {
    return layoutFromSvgModule(config, svgModule);
  }

  // 3. Absolute fallback
  return layoutRunningBond(config);
}
