import { describe, expect, it } from 'vitest';
import { getPatternByType, type TextureConfig } from '@textura/shared';
import { getPatternRepeatCounts } from '../lib/pattern-repeat-semantics';
import { getPatternSidebarSchema } from '../lib/pattern-sidebar-schema';
import { getPatternLayout } from './pattern-layouts';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import { SVG_PATTERN_MODULES } from './generated/svg-pattern-modules';

const PATTERNS = [
  'none',
  'stack_bond',
  'stretcher_bond',
  'herringbone',
  'flemish_bond',
  'running_bond',
  'chevron',
  'staggered',
  'ashlar',
  'cubic',
  'hexagonal',
  'basketweave',
  'hopscotch',
  'diamond',
  'intersecting_circle',
  'fishscale',
  'french',
] as const;

const MODULE_PARITY_PATTERNS = [
  'ashlar',
  'cubic',
  'hexagonal',
  'hopscotch',
  'diamond',
  'intersecting_circle',
  'fishscale',
  'french',
] as const;

function createPatternConfig(type: (typeof PATTERNS)[number]): TextureConfig {
  const pattern = getPatternByType(type);
  if (!pattern) {
    throw new Error(`Missing pattern definition for ${type}`);
  }

  return {
    ...DEFAULT_TEXTURE_CONFIG,
    pattern: {
      type: pattern.type,
      category: pattern.category,
      orientation: 'horizontal',
      rows: pattern.defaults.rows,
      columns: pattern.defaults.columns,
      angle: pattern.defaults.angle,
      stretchers: pattern.defaults.stretchers,
      weaves: pattern.defaults.weaves,
    },
    joints: {
      ...DEFAULT_TEXTURE_CONFIG.joints,
    },
    materials: [
      {
        ...DEFAULT_TEXTURE_CONFIG.materials[0]!,
        width: pattern.defaultUnitWidth,
        height: pattern.defaultUnitHeight,
      },
    ],
  };
}

function getRotatedCorners(tile: { x: number; y: number; width: number; height: number; rotation: number }) {
  const centerX = tile.x + tile.width / 2;
  const centerY = tile.y + tile.height / 2;
  const radians = (tile.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return [
    { x: tile.x, y: tile.y },
    { x: tile.x + tile.width, y: tile.y },
    { x: tile.x + tile.width, y: tile.y + tile.height },
    { x: tile.x, y: tile.y + tile.height },
  ].map((point) => {
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  });
}

function getTileOriginForRotatedCorner(
  width: number,
  height: number,
  rotation: number,
  anchorX: number,
  anchorY: number,
  cornerIndex = 0,
) {
  const rotatedCorners = getRotatedCorners({
    x: 0,
    y: 0,
    width,
    height,
    rotation,
  });
  const anchorCorner = rotatedCorners[cornerIndex]!;
  return {
    x: anchorX - anchorCorner.x,
    y: anchorY - anchorCorner.y,
  };
}

function sampleHerringboneCoverage(
  layout: ReturnType<typeof getPatternLayout>,
  sampleStep: number,
) {
  const repeatWidth = layout.repeatWidth ?? 0;
  const repeatHeight = layout.repeatHeight ?? 0;
  const originalTiles = layout.tiles.map((tile) => ({
    ...tile,
    originalX: tile.x - (layout.repeatOffsetX ?? 0),
    originalY: tile.y - (layout.repeatOffsetY ?? 0),
  }));

  const pointInPolygon = (x: number, y: number, points: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i]!;
      const b = points[j]!;
      const intersects = (a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
      if (intersects) inside = !inside;
    }
    return inside;
  };

  const polygons = originalTiles.map((tile) => {
    const corners = getRotatedCorners({
      x: tile.originalX,
      y: tile.originalY,
      width: tile.width,
      height: tile.height,
      rotation: tile.rotation,
    });
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    return {
      corners,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  });

  let uncovered = 0;
  let total = 0;
  let maxGapCells = 0;

  for (let y = sampleStep / 2; y < repeatHeight; y += sampleStep) {
    let rowGap = 0;
    let rowMaxGap = 0;

    for (let x = sampleStep / 2; x < repeatWidth; x += sampleStep) {
      total += 1;
      const covered = polygons.some(
        (polygon) =>
          x >= polygon.minX &&
          x <= polygon.maxX &&
          y >= polygon.minY &&
          y <= polygon.maxY &&
          pointInPolygon(x, y, polygon.corners),
      );

      if (!covered) {
        uncovered += 1;
        rowGap += 1;
      } else {
        rowMaxGap = Math.max(rowMaxGap, rowGap);
        rowGap = 0;
      }
    }

    rowMaxGap = Math.max(rowMaxGap, rowGap);
    maxGapCells = Math.max(maxGapCells, rowMaxGap);
  }

  return {
    maxGapCells,
    uncoveredRatio: total > 0 ? uncovered / total : 0,
  };
}

describe('pattern layouts', () => {
  it.each(PATTERNS)('produces stable bounds for %s', (type) => {
    const layout = getPatternLayout(createPatternConfig(type));
    expect(layout.totalWidth).toBeGreaterThan(0);
    expect(layout.totalHeight).toBeGreaterThan(0);
    expect(Number.isFinite(layout.totalWidth)).toBe(true);
    expect(Number.isFinite(layout.totalHeight)).toBe(true);

    const schema = getPatternSidebarSchema(type);
    if (schema.layoutSource === 'svg-module') {
      expect(layout.repeatWidth ?? 0).toBeGreaterThan(0);
      expect(layout.repeatHeight ?? 0).toBeGreaterThan(0);
    }
  });

  it.each(PATTERNS.filter((type) => type !== 'none'))('grows vertically when rows increase for %s', (type) => {
    const base = createPatternConfig(type);
    const taller = createPatternConfig(type);
    const pattern = getPatternByType(type)!;
    taller.pattern.rows += pattern.rowMultiple;

    expect(getPatternLayout(taller).totalHeight).toBeGreaterThan(getPatternLayout(base).totalHeight);
  });

  it.each(PATTERNS.filter((type) => type !== 'none'))('grows horizontally when columns increase for %s', (type) => {
    const base = createPatternConfig(type);
    const wider = createPatternConfig(type);
    const pattern = getPatternByType(type)!;
    wider.pattern.columns += pattern.columnMultiple;

    expect(getPatternLayout(wider).totalWidth).toBeGreaterThan(getPatternLayout(base).totalWidth);
  });

  it('uses procedural half-pair repeat width for flemish bond', () => {
    const config = createPatternConfig('flemish_bond');
    config.pattern.rows = 4;
    config.pattern.columns = 4;
    const layout = getPatternLayout(config);

    const repeatWidth = 665; // Matches procedural internal footprint for 4 columns

    expect(layout.repeatWidth).toBeCloseTo(repeatWidth);
  });

  it.each(MODULE_PARITY_PATTERNS)('matches the authored module repeat at reference scale for %s', (type) => {
    const config = createPatternConfig(type);
    const module = SVG_PATTERN_MODULES[type];
    
    // Force material to reference size to check unscaled module dimensions
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    
    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);

    expect(layout.repeatWidth).toBeCloseTo(repeatCounts.columns * (module.repeatWidth || module.viewBoxWidth));
    expect(layout.repeatHeight).toBeCloseTo(repeatCounts.rows * (module.repeatHeight || module.viewBoxHeight));
    expect(layout.totalWidth).toBeGreaterThanOrEqual(layout.repeatWidth ?? 0);
    expect(layout.totalHeight).toBeGreaterThanOrEqual(layout.repeatHeight ?? 0);
  });

  it.each(MODULE_PARITY_PATTERNS)('scales module repeat counts directly with rows and columns for %s', (type) => {
    const config = createPatternConfig(type);
    const pattern = getPatternByType(type)!;
    config.pattern.rows = pattern.rowMultiple * 2;
    config.pattern.columns = pattern.columnMultiple * 2;
    const layout = getPatternLayout(config);
    const module = SVG_PATTERN_MODULES[type];
    const repeatCounts = getPatternRepeatCounts(config);

    const scaleX = config.materials[0]!.width / module.referenceTileWidth;
    const scaleY = config.materials[0]!.height / module.referenceTileHeight;

    expect(layout.repeatWidth).toBeCloseTo(repeatCounts.columns * (module.repeatWidth || module.viewBoxWidth) * scaleX);
    expect(layout.repeatHeight).toBeCloseTo(repeatCounts.rows * (module.repeatHeight || module.viewBoxHeight) * scaleY);
  });

  it('uses the explicit fishscale repeat height from the parity logic', () => {
    const config = createPatternConfig('fishscale');
    config.materials[0]!.width = 400; 
    config.joints.verticalSize = 0; // Use 0 joint to keep math simple 
    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);
    const expectedHeight = repeatCounts.rows * (400 * 0.5);
    expect(layout.repeatHeight).toBeCloseTo(expectedHeight, 1);
  });

  it('keeps herringbone stable when angle changes because angle is fixed in create', () => {
    const base = createPatternConfig('herringbone');
    base.pattern.rows = 6;
    base.pattern.columns = 4;
    base.pattern.angle = 45;

    const changed = createPatternConfig('herringbone');
    changed.pattern.rows = 6;
    changed.pattern.columns = 4;
    changed.pattern.angle = 90;

    const baseLayout = getPatternLayout(base);
    const changedLayout = getPatternLayout(changed);

    expect(baseLayout.repeatWidth).toBeCloseTo(changedLayout.repeatWidth ?? 0);
    expect(baseLayout.repeatHeight).toBeCloseTo(changedLayout.repeatHeight ?? 0);
  });

  it('uses procedural herringbone math to ensure 90-degree corners and clean scaling', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const expectedWidth = config.pattern.columns * (config.materials[0]!.width + config.joints.verticalSize) / Math.sqrt(2);
    const expectedHeight = config.pattern.rows * (config.materials[0]!.height + config.joints.horizontalSize) * Math.sqrt(2);

    const originalTiles = layout.tiles.map((tile) => ({
      ...tile,
      originalX: tile.x - (layout.repeatOffsetX ?? 0),
      originalY: tile.y - (layout.repeatOffsetY ?? 0),
    }));
    const visibleTiles = originalTiles.filter(
      (tile) =>
        tile.originalX > -config.materials[0]!.width &&
        tile.originalX < (layout.repeatWidth ?? 0) &&
        tile.originalY > -config.materials[0]!.width &&
        tile.originalY < (layout.repeatHeight ?? 0),
    );
    const evenTiles = visibleTiles
      .filter((tile) => tile.rotation === -45)
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX);
    const topEvenRowY = evenTiles[0]?.originalY ?? 0;
    const topEvenTiles = evenTiles.filter((tile) => Math.abs(tile.originalY - topEvenRowY) < 0.001);
    const firstEven = topEvenTiles[0];
    const secondEven = topEvenTiles[1];
    const nextRowEven = evenTiles.find(
      (tile) => Math.abs(tile.originalX - (firstEven?.originalX ?? 0)) < 0.001 && tile.originalY > (firstEven?.originalY ?? 0),
    );
    const oddTiles = visibleTiles
      .filter((tile) => tile.rotation === 45)
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX);
    const firstOdd = oddTiles[0];
    const invSqrt2 = 1 / Math.sqrt(2);
    const firstEvenAnchor = {
      x: -config.materials[0]!.height * invSqrt2,
      y: config.materials[0]!.height * invSqrt2,
    };
    const firstOddAnchorShift =
      (config.materials[0]!.width + config.materials[0]!.height + config.joints.horizontalSize) * invSqrt2;
    const firstOddAnchor = {
      x: firstEvenAnchor.x + firstOddAnchorShift,
      y: firstEvenAnchor.y - firstOddAnchorShift,
    };
    const expectedFirstEven = {
      ...getTileOriginForRotatedCorner(
        config.materials[0]!.width,
        config.materials[0]!.height,
        -45,
        firstEvenAnchor.x,
        firstEvenAnchor.y,
      ),
    };
    const expectedFirstOdd = {
      ...getTileOriginForRotatedCorner(
        config.materials[0]!.width,
        config.materials[0]!.height,
        45,
        firstOddAnchor.x,
        firstOddAnchor.y,
      ),
    };

    expect(layout.repeatWidth).toBeCloseTo(expectedWidth, 1);
    expect(layout.repeatHeight).toBeCloseTo(expectedHeight, 1);
    expect(firstEven).toBeDefined();
    expect(secondEven).toBeDefined();
    expect(nextRowEven).toBeDefined();
    expect(firstOdd).toBeDefined();
    expect(firstEven?.applyJointInset).toBe(false);
    expect(firstOdd?.applyJointInset).toBe(false);
    expect(firstEven?.originalX ?? 0).toBeCloseTo(expectedFirstEven.x, 3);
    expect(firstEven?.originalY ?? 0).toBeCloseTo(expectedFirstEven.y, 3);
    expect(firstOdd?.originalX ?? 0).toBeCloseTo(expectedFirstOdd.x, 2);
    expect(firstOdd?.originalY ?? 0).toBeCloseTo(expectedFirstOdd.y, 2);
    expect((secondEven?.originalX ?? 0) - (firstEven?.originalX ?? 0)).toBeCloseTo(572.761986, 1);
    expect((nextRowEven?.originalY ?? 0) - (firstEven?.originalY ?? 0)).toBeCloseTo(148.491, 2);

    expect(Number.isFinite(layout.repeatOffsetY ?? 0)).toBe(true);
    expect(layout.totalWidth).toBeGreaterThanOrEqual(layout.repeatWidth ?? 0);
    expect(layout.totalHeight).toBeGreaterThanOrEqual(layout.repeatHeight ?? 0);
  });

  it('matches competitor herringbone repeat math when the brick width changes', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.materials[0]!.width = 300;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const originalTiles = layout.tiles.map((tile) => ({
      ...tile,
      originalX: tile.x - (layout.repeatOffsetX ?? 0),
      originalY: tile.y - (layout.repeatOffsetY ?? 0),
    }));
    const visibleTiles = originalTiles.filter(
      (tile) =>
        tile.originalX > -config.materials[0]!.width &&
        tile.originalX < (layout.repeatWidth ?? 0) &&
        tile.originalY > -config.materials[0]!.width &&
        tile.originalY < (layout.repeatHeight ?? 0),
    );
    const evenTiles = visibleTiles
      .filter((tile) => tile.rotation === -45)
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX);
    const firstEven = evenTiles[0];
    const secondEven = evenTiles[1];
    const oddTiles = visibleTiles
      .filter((tile) => tile.rotation === 45)
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX);
    const firstOdd = oddTiles[0];
    const invSqrt2 = 1 / Math.sqrt(2);
    const firstEvenAnchor = {
      x: -config.materials[0]!.height * invSqrt2,
      y: config.materials[0]!.height * invSqrt2,
    };
    const firstOddAnchorShift =
      (config.materials[0]!.width + config.materials[0]!.height + config.joints.horizontalSize) * invSqrt2;
    const firstOddAnchor = {
      x: firstEvenAnchor.x + firstOddAnchorShift,
      y: firstEvenAnchor.y - firstOddAnchorShift,
    };
    const expectedFirstEven = {
      ...getTileOriginForRotatedCorner(
        config.materials[0]!.width,
        config.materials[0]!.height,
        -45,
        firstEvenAnchor.x,
        firstEvenAnchor.y,
      ),
    };
    const expectedFirstOdd = {
      ...getTileOriginForRotatedCorner(
        config.materials[0]!.width,
        config.materials[0]!.height,
        45,
        firstOddAnchor.x,
        firstOddAnchor.y,
      ),
    };

    expect(layout.repeatWidth).toBeCloseTo(4 * (300 + 5) / Math.sqrt(2), 3);
    expect(layout.repeatHeight).toBeCloseTo(6 * (100 + 5) * Math.sqrt(2), 3);
    expect(firstEven).toBeDefined();
    expect(secondEven).toBeDefined();
    expect(firstOdd).toBeDefined();
    expect(firstEven?.applyJointInset).toBe(false);
    expect(firstOdd?.applyJointInset).toBe(false);
    expect(firstEven?.originalX ?? 0).toBeCloseTo(expectedFirstEven.x, 3);
    expect(firstEven?.originalY ?? 0).toBeCloseTo(expectedFirstEven.y, 3);
    expect(firstOdd?.originalX ?? 0).toBeCloseTo(expectedFirstOdd.x, 2);
    expect(firstOdd?.originalY ?? 0).toBeCloseTo(expectedFirstOdd.y, 2);
    expect((secondEven?.originalX ?? 0) - (firstEven?.originalX ?? 0)).toBeCloseTo(431.339273, 2);
  });

  it('keeps thin herringbone pavers on the competitor corner anchors', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 10;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const originalTiles = layout.tiles.map((tile) => ({
      ...tile,
      originalX: tile.x - (layout.repeatOffsetX ?? 0),
      originalY: tile.y - (layout.repeatOffsetY ?? 0),
    }));
    const visibleTiles = originalTiles.filter(
      (tile) =>
        tile.originalX > -config.materials[0]!.width &&
        tile.originalX < (layout.repeatWidth ?? 0) &&
        tile.originalY > -config.materials[0]!.width &&
        tile.originalY < (layout.repeatHeight ?? 0),
    );
    const firstEven = visibleTiles
      .filter((tile) => tile.rotation === -45)
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX)[0];
    const firstOdd = visibleTiles
      .filter((tile) => tile.rotation === 45)
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX)[0];
    const invSqrt2 = 1 / Math.sqrt(2);
    const firstEvenAnchor = {
      x: -config.materials[0]!.height * invSqrt2,
      y: config.materials[0]!.height * invSqrt2,
    };
    const firstOddAnchorShift =
      (config.materials[0]!.width + config.materials[0]!.height + config.joints.horizontalSize) * invSqrt2;
    const firstOddAnchor = {
      x: firstEvenAnchor.x + firstOddAnchorShift,
      y: firstEvenAnchor.y - firstOddAnchorShift,
    };

    expect(layout.repeatWidth).toBeCloseTo(4 * (400 + 5) / Math.sqrt(2), 3);
    expect(layout.repeatHeight).toBeCloseTo(6 * (10 + 5) * Math.sqrt(2), 3);
    expect(firstEven?.applyJointInset).toBe(false);
    expect(firstOdd?.applyJointInset).toBe(false);
    const expectedEven = getTileOriginForRotatedCorner(400, 10, -45, firstEvenAnchor.x, firstEvenAnchor.y);
    const expectedOdd = getTileOriginForRotatedCorner(400, 10, 45, firstOddAnchor.x, firstOddAnchor.y);

    expect(firstEven?.originalX ?? 0).toBeCloseTo(expectedEven.x, 3);
    expect(firstEven?.originalY ?? 0).toBeCloseTo(expectedEven.y, 3);
    expect(firstOdd?.originalX ?? 0).toBeCloseTo(expectedOdd.x, 3);
    expect(firstOdd?.originalY ?? 0).toBeCloseTo(expectedOdd.y, 3);
  });

  it('matches the competitor snapshot for thin herringbone pavers', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 4;
    config.pattern.columns = 2;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 10;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const originalTiles = layout.tiles.map((tile) => ({
      ...tile,
      originalX: tile.x - (layout.repeatOffsetX ?? 0),
      originalY: tile.y - (layout.repeatOffsetY ?? 0),
    }));
    const visibleTiles = originalTiles
      .filter(
        (tile) =>
          tile.originalX > -config.materials[0]!.width &&
          tile.originalX < (layout.repeatWidth ?? 0) &&
          tile.originalY > -config.materials[0]!.width &&
          tile.originalY < (layout.repeatHeight ?? 0),
      )
      .sort((a, b) => a.originalY - b.originalY || a.originalX - b.originalX);

    const firstEven = visibleTiles.find((tile) => tile.rotation === -45);
    const firstOdd = visibleTiles.find((tile) => tile.rotation === 45);
    const nextRowEven = visibleTiles.find(
      (tile) =>
        tile.rotation === -45 &&
        Math.abs((tile.originalX ?? 0) - (firstEven?.originalX ?? 0)) < 0.001 &&
        (tile.originalY ?? 0) > (firstEven?.originalY ?? 0),
    );
    const evenAnchor = firstEven ? getRotatedCorners(firstEven)[0] : undefined;
    const oddAnchor = firstOdd ? getRotatedCorners(firstOdd)[0] : undefined;
    const oddOffset =
      evenAnchor && oddAnchor
        ? Math.hypot(oddAnchor.x - evenAnchor.x, oddAnchor.y - evenAnchor.y)
        : undefined;

    expect(layout.repeatWidth).toBeCloseTo(572.76, 2);
    expect(layout.repeatHeight).toBeCloseTo(84.85, 2);
    expect(firstEven).toBeDefined();
    expect(firstOdd).toBeDefined();
    expect(nextRowEven).toBeDefined();
    expect((nextRowEven?.originalY ?? 0) - (firstEven?.originalY ?? 0)).toBeCloseTo(21.213, 3);
    expect(oddOffset ?? 0).toBeCloseTo(415.004, 2);
  });

  it('does not leave large voids inside the procedural herringbone repeat', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 6;
    config.pattern.columns = 6;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const coverage = sampleHerringboneCoverage(layout, 20);

    expect(coverage.maxGapCells).toBeLessThanOrEqual(3);
    expect(coverage.uncoveredRatio).toBeLessThan(0.1);
  });

  it('changes chevron repeat height with angle while keeping repeat width stable', () => {
    const base = createPatternConfig('chevron');
    base.pattern.rows = 6;
    base.pattern.columns = 2;
    base.pattern.angle = 10;

    const changed = createPatternConfig('chevron');
    changed.pattern.rows = 6;
    changed.pattern.columns = 2;
    changed.pattern.angle = 45;

    const baseLayout = getPatternLayout(base);
    const changedLayout = getPatternLayout(changed);

    expect(baseLayout.repeatWidth).toBeCloseTo(changedLayout.repeatWidth ?? 0, 0.1);
    expect(changedLayout.repeatHeight).toBeGreaterThan(baseLayout.repeatHeight ?? 0);
  });

  it('keeps common-bond repeat sizing procedural', () => {
    const config = createPatternConfig('running_bond');
    const layout = getPatternLayout(config);
    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;

    expect(layout.repeatWidth).toBeCloseTo(config.pattern.columns * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(config.pattern.rows * unitHeight);
  });

  it('maps common-bond visible rows and columns directly onto procedural repeat bounds', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    const layout = getPatternLayout(config);

    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;
    expect(layout.repeatWidth).toBeCloseTo(4 * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(6 * unitHeight);
  });

  it('keeps repeat size stable when stretchers changes and moves the header courses', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.pattern.stretchers = 1;
    const compactLayout = getPatternLayout(config);
    config.pattern.stretchers = 3;
    const sparseLayout = getPatternLayout(config);
    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;

    expect(compactLayout.repeatWidth).toBeCloseTo(config.pattern.columns * unitWidth);
    expect(compactLayout.repeatHeight).toBeCloseTo(config.pattern.rows * unitHeight);
    expect(sparseLayout.repeatWidth).toBeCloseTo(config.pattern.columns * unitWidth);
    expect(sparseLayout.repeatHeight).toBeCloseTo(config.pattern.rows * unitHeight);

    const compactHeaderRows = new Set(
      compactLayout.tiles
        .filter((tile) => tile.width < config.materials[0]!.width)
        .map((tile) => tile.y),
    );
    const sparseHeaderRows = new Set(
      sparseLayout.tiles
        .filter((tile) => tile.width < config.materials[0]!.width)
        .map((tile) => tile.y),
    );

    expect([...compactHeaderRows]).toEqual([0, 210, 420]);
    expect([...sparseHeaderRows]).toEqual([0, 420]);
  });

  it('matches competitor common-bond spacing with half-width header courses', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.pattern.stretchers = 3;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const headerWidth = (config.materials[0]!.width - config.joints.verticalSize) / 2;
    const headerStepX = headerWidth + config.joints.verticalSize;
    const stretcherStepX = config.materials[0]!.width + config.joints.verticalSize;
    const topCourse = layout.tiles.filter((tile) => tile.y === 0).sort((a, b) => a.x - b.x);
    const firstStretcherCourse = layout.tiles.filter((tile) => tile.y === 105).sort((a, b) => a.x - b.x);
    const repeatedHeaderCourse = layout.tiles.filter((tile) => tile.y === 420).sort((a, b) => a.x - b.x);

    expect(topCourse).toHaveLength(8);
    expect(firstStretcherCourse).toHaveLength(4);
    expect(repeatedHeaderCourse).toHaveLength(8);
    expect(topCourse[0]?.width).toBeCloseTo(headerWidth);
    expect(topCourse[1]?.x).toBeCloseTo(headerStepX);
    expect(topCourse[2]?.x).toBeCloseTo(headerStepX * 2);
    expect(firstStretcherCourse[0]?.width).toBeCloseTo(400);
    expect(firstStretcherCourse[1]?.x).toBeCloseTo(stretcherStepX);
    expect(firstStretcherCourse[2]?.x).toBeCloseTo(stretcherStepX * 2);
    expect(layout.repeatWidth).toBeCloseTo(1620);
    expect(layout.repeatHeight).toBeCloseTo(630);
  });

  it('keeps stretcher layout as fixed half-offset alternating rows', () => {
    const config = createPatternConfig('stretcher_bond');
    const layout = getPatternLayout(config);
    expect(layout.tiles.length).toBeGreaterThan(0);
    expect(layout.repeatWidth).toBeGreaterThan(0);
  });
});
