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
    materials: [
      {
        ...DEFAULT_TEXTURE_CONFIG.materials[0]!,
        width: pattern.defaultUnitWidth,
        height: pattern.defaultUnitHeight,
      },
    ],
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
    config.materials[0]!.width = 300;
    config.materials[0]!.height = 100;
    config.pattern.rows = 2;
    config.pattern.columns = 2;

    const layout = getPatternLayout(config);
    const stepX = 300 + config.joints.verticalSize;
    const headerWidth = 300 / 2;
    const pairWidth = 300 + headerWidth + config.joints.verticalSize * 2;
    const expectedRepeatWidth = 2 * (pairWidth / 2);
    const expectedRepeatHeight = 2 * (100 + config.joints.horizontalSize);

    expect(layout.repeatWidth).toBeCloseTo(expectedRepeatWidth);
    expect(layout.repeatHeight).toBeCloseTo(expectedRepeatHeight);
    expect(layout.tiles.some((t) => Math.abs(t.width - 300) < 1)).toBe(true);
    expect(layout.tiles.some((t) => Math.abs(t.width - headerWidth) < 1)).toBe(true);
  });

  it('uses Architextures module repeat sizes for ashlar and hexagonal', () => {
    const ashlar = createPatternConfig('ashlar');
    ashlar.materials[0]!.width = SVG_PATTERN_MODULES.ashlar.referenceTileWidth;
    ashlar.materials[0]!.height = SVG_PATTERN_MODULES.ashlar.referenceTileHeight;
    ashlar.pattern.rows = 1;
    ashlar.pattern.columns = 1;

    const hexagonal = createPatternConfig('hexagonal');
    hexagonal.materials[0]!.width = SVG_PATTERN_MODULES.hexagonal.referenceTileWidth;
    hexagonal.materials[0]!.height = SVG_PATTERN_MODULES.hexagonal.referenceTileHeight;
    hexagonal.pattern.rows = 1;
    hexagonal.pattern.columns = 1;

    expect(getPatternLayout(ashlar).repeatWidth).toBe(SVG_PATTERN_MODULES.ashlar.viewBoxWidth);
    expect(getPatternLayout(ashlar).repeatHeight).toBe(SVG_PATTERN_MODULES.ashlar.viewBoxHeight);
    expect(getPatternLayout(hexagonal).repeatWidth).toBe(SVG_PATTERN_MODULES.hexagonal.viewBoxWidth);
    expect(getPatternLayout(hexagonal).repeatHeight).toBe(SVG_PATTERN_MODULES.hexagonal.viewBoxHeight);
  });

  it.each(MODULE_PARITY_PATTERNS)('matches the authored module repeat at reference scale for %s', (type) => {
    const config = createPatternConfig(type);
    const module = SVG_PATTERN_MODULES[type];
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    config.pattern.rows = 1;
    config.pattern.columns = 1;

    const layout = getPatternLayout(config);

    expect(layout.repeatWidth).toBe(module.repeatWidth ?? module.viewBoxWidth);
    expect(layout.repeatHeight).toBe(module.repeatHeight ?? module.viewBoxHeight);
    expect(layout.totalWidth).toBeGreaterThanOrEqual(layout.repeatWidth ?? 0);
    expect(layout.totalHeight).toBeGreaterThanOrEqual(layout.repeatHeight ?? 0);
  });

  it.each(MODULE_PARITY_PATTERNS)('scales module repeat counts directly with rows and columns for %s', (type) => {
    const config = createPatternConfig(type);
    const module = SVG_PATTERN_MODULES[type];
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    config.pattern.rows = 2;
    config.pattern.columns = 3;

    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);

    expect(layout.repeatWidth).toBe((module.repeatWidth ?? module.viewBoxWidth) * repeatCounts.columns);
    expect(layout.repeatHeight).toBe((module.repeatHeight ?? module.viewBoxHeight) * repeatCounts.rows);
  });

  it('uses the explicit fishscale repeat height from the authored module', () => {
    const config = createPatternConfig('fishscale');
    config.materials[0]!.width = SVG_PATTERN_MODULES.fishscale.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.fishscale.referenceTileHeight;
    config.pattern.rows = 1;
    config.pattern.columns = 1;

    const layout = getPatternLayout(config);
    expect(layout.repeatWidth).toBe(SVG_PATTERN_MODULES.fishscale.repeatWidth);
    expect(layout.repeatHeight).toBe(SVG_PATTERN_MODULES.fishscale.repeatHeight);
    expect(layout.strokes.length).toBeGreaterThan(0);
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

  it('uses projected 45-degree herringbone geometry with stable frame and symmetric placement', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const projectedSpan = (400 + 100) / Math.SQRT2;
    const stepX = projectedSpan + 5 / Math.SQRT2;
    const stepY = projectedSpan + 5 / Math.SQRT2;
    const expectedRepeatWidth = config.pattern.columns * stepX;
    const expectedRepeatHeight = config.pattern.rows * stepY;

    expect(layout.repeatWidth).toBeCloseTo(expectedRepeatWidth);
    expect(layout.repeatHeight).toBeCloseTo(expectedRepeatHeight);
    expect((layout.repeatWidth ?? 1) / Math.max(layout.repeatHeight ?? 1, 1)).toBeGreaterThan(0.6);
    expect(Number.isFinite(layout.repeatOffsetX ?? 0)).toBe(true);
    expect(Number.isFinite(layout.repeatOffsetY ?? 0)).toBe(true);

    const neg45Tiles = layout.tiles.filter((tile) => tile.rotation === -45);
    const pos45Tiles = layout.tiles.filter((tile) => tile.rotation === 45);
    expect(neg45Tiles.length).toBe(pos45Tiles.length);

    const repeatCenterX = ((layout.repeatWidth ?? layout.totalWidth) / 2) + (layout.repeatOffsetX ?? 0);
    const repeatCenterY = ((layout.repeatHeight ?? layout.totalHeight) / 2) + (layout.repeatOffsetY ?? 0);
    const tileMinX = Math.min(...layout.tiles.map((tile) => tile.x));
    const tileMaxX = Math.max(...layout.tiles.map((tile) => tile.x + tile.width));
    const tileMinY = Math.min(...layout.tiles.map((tile) => tile.y));
    const tileMaxY = Math.max(...layout.tiles.map((tile) => tile.y + tile.height));
    const visualCenterX = (tileMinX + tileMaxX) / 2;
    const visualCenterY = (tileMinY + tileMaxY) / 2;
    expect(visualCenterX).toBeCloseTo(repeatCenterX, 1);
    expect(visualCenterY).toBeCloseTo(repeatCenterY, 1);

    const leftMargin = repeatCenterX - tileMinX;
    const rightMargin = tileMaxX - repeatCenterX;
    const topMargin = repeatCenterY - tileMinY;
    const bottomMargin = tileMaxY - repeatCenterY;
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(stepX * 0.5);
    expect(Math.abs(topMargin - bottomMargin)).toBeLessThan(stepY * 0.5);
    expect((layout.repeatWidth ?? 1) / Math.max(layout.repeatHeight ?? 1, 1)).toBeLessThan(2.5);

    const minOpposingCenterDistance = neg45Tiles.reduce((minDistance, tile) => {
      const centerX = tile.x + tile.width / 2;
      const centerY = tile.y + tile.height / 2;
      const nearest = pos45Tiles.reduce((nearestDistance, other) => {
        const otherX = other.x + other.width / 2;
        const otherY = other.y + other.height / 2;
        const distance = Math.hypot(centerX - otherX, centerY - otherY);
        return Math.min(nearestDistance, distance);
      }, Number.POSITIVE_INFINITY);
      return Math.min(minDistance, nearest);
    }, Number.POSITIVE_INFINITY);

    expect(minOpposingCenterDistance).toBeGreaterThan(projectedSpan * 0.45);
    expect(layout.tiles.every((tile) => tile.applyJointInset === false)).toBe(true);
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

    expect(getPatternSidebarSchema('chevron').layoutSource).toBe('procedural');
    expect(baseLayout.repeatWidth).toBeCloseTo(changedLayout.repeatWidth ?? 0);
    expect(changedLayout.repeatHeight).toBeGreaterThan(baseLayout.repeatHeight ?? 0);
  });

  it('keeps running-bond on authored svg-module repeat sizing', () => {
    const base = createPatternConfig('running_bond');
    base.pattern.rows = 6;
    base.pattern.columns = 2;
    base.materials[0]!.width = SVG_PATTERN_MODULES.running_bond.referenceTileWidth;
    base.materials[0]!.height = SVG_PATTERN_MODULES.running_bond.referenceTileHeight;
    base.pattern.stretchers = 2;

    const denser = createPatternConfig('running_bond');
    denser.pattern.rows = 6;
    denser.pattern.columns = 2;
    denser.materials[0]!.width = SVG_PATTERN_MODULES.running_bond.referenceTileWidth;
    denser.materials[0]!.height = SVG_PATTERN_MODULES.running_bond.referenceTileHeight;
    denser.pattern.stretchers = 4;

    const baseLayout = getPatternLayout(base);
    const denserLayout = getPatternLayout(denser);

    expect(getPatternSidebarSchema('running_bond').layoutSource).toBe('procedural');
    expect(baseLayout.repeatWidth).toBeCloseTo(denserLayout.repeatWidth ?? 0);
    expect(baseLayout.repeatHeight).toBeCloseTo(denserLayout.repeatHeight ?? 0);
    expect(baseLayout.totalWidth).toBeGreaterThanOrEqual(baseLayout.repeatWidth ?? 0);
    expect(baseLayout.totalHeight).toBeGreaterThanOrEqual(baseLayout.repeatHeight ?? 0);
  });

  it('changes running-bond row offsets when stretchers changes while keeping repeat size stable', () => {
    const base = createPatternConfig('running_bond');
    base.pattern.rows = 6;
    base.pattern.columns = 4;
    base.pattern.stretchers = 1;

    const changed = createPatternConfig('running_bond');
    changed.pattern.rows = 6;
    changed.pattern.columns = 4;
    changed.pattern.stretchers = 3;

    const baseLayout = getPatternLayout(base);
    const changedLayout = getPatternLayout(changed);

    expect(baseLayout.repeatWidth).toBeCloseTo(changedLayout.repeatWidth ?? 0);
    expect(baseLayout.repeatHeight).toBeCloseTo(changedLayout.repeatHeight ?? 0);
    expect(baseLayout.tiles[4]?.x).not.toBeCloseTo(changedLayout.tiles[4]?.x ?? 0);
  });

  it('maps running-bond visible rows and columns directly onto procedural repeat bounds', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.materials[0]!.width = SVG_PATTERN_MODULES.running_bond.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.running_bond.referenceTileHeight;
    config.pattern.stretchers = 1;

    const repeatCounts = getPatternRepeatCounts(config);
    const layout = getPatternLayout(config);

    expect(repeatCounts).toEqual({ rows: 6, columns: 2 });
    expect(layout.repeatWidth).toBe((config.materials[0]!.width + config.joints.verticalSize) * 2);
    expect(layout.repeatHeight).toBe((config.materials[0]!.height + config.joints.horizontalSize) * 6);
  });

  it('matches running-bond procedural repeat at its current unit size contract', () => {
    const config = createPatternConfig('running_bond');
    const module = SVG_PATTERN_MODULES.running_bond;
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    config.pattern.rows = 1;
    config.pattern.columns = 1;

    const layout = getPatternLayout(config);

    expect(layout.repeatWidth).toBe(module.referenceTileWidth + config.joints.verticalSize);
    expect(layout.repeatHeight).toBe(module.referenceTileHeight + config.joints.horizontalSize);
    expect(layout.totalWidth).toBeGreaterThanOrEqual(layout.repeatWidth ?? 0);
    expect(layout.totalHeight).toBeGreaterThanOrEqual(layout.repeatHeight ?? 0);
  });

  it('scales running-bond procedural repeat counts directly with visible rows and columns', () => {
    const config = createPatternConfig('running_bond');
    const module = SVG_PATTERN_MODULES.running_bond;
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    config.pattern.rows = 2;
    config.pattern.columns = 3;

    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);

    expect(repeatCounts).toEqual({ rows: 2, columns: 3 });
    expect(layout.repeatWidth).toBe((module.referenceTileWidth + config.joints.verticalSize) * repeatCounts.columns);
    expect(layout.repeatHeight).toBe((module.referenceTileHeight + config.joints.horizontalSize) * repeatCounts.rows);
  });

  it('keeps stretcher layout as fixed half-offset alternating rows', () => {
    const config = createPatternConfig('stretcher_bond');
    config.pattern.rows = 2;
    config.pattern.columns = 2;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.verticalSize = 5;

    const layout = getPatternLayout(config);
    const firstRowLeft = layout.tiles.find((tile) => tile.y === 0 && tile.x >= 0);
    const secondRowLeft = layout.tiles.find((tile) => tile.y > 0 && tile.x >= 0);

    expect(firstRowLeft?.x).toBeCloseTo(0);
    expect(secondRowLeft?.x).toBeCloseTo((400 + 5) / 2);
    expect(layout.tiles.every((tile) => tile.rotation === 0)).toBe(true);
  });
});
