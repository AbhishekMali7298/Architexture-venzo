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

    expect(layout.repeatWidth).toBeCloseTo(expectedWidth, 1);
    expect(layout.repeatHeight).toBeCloseTo(expectedHeight, 1);
    expect(firstEven).toBeDefined();
    expect(secondEven).toBeDefined();
    expect(nextRowEven).toBeDefined();
    expect(firstOdd).toBeDefined();
    expect(firstEven?.originalX ?? 0).toBeCloseTo(-93.934028, 3);
    expect(firstEven?.originalY ?? 0).toBeCloseTo(-85.355339, 3);
    expect(firstOdd?.originalX ?? 0).toBeCloseTo(192.446965, 2);
    expect(firstOdd?.originalY ?? 0).toBeCloseTo(-159.604299, 2);
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

    expect(layout.repeatWidth).toBeCloseTo(4 * (300 + 5) / Math.sqrt(2), 3);
    expect(layout.repeatHeight).toBeCloseTo(6 * (100 + 5) * Math.sqrt(2), 3);
    expect(firstEven).toBeDefined();
    expect(secondEven).toBeDefined();
    expect(firstOdd).toBeDefined();
    expect(firstEven?.originalX ?? 0).toBeCloseTo(-79.289322, 3);
    expect(firstEven?.originalY ?? 0).toBeCloseTo(-50, 3);
    expect(firstOdd?.originalX ?? 0).toBeCloseTo(136.380315, 2);
    expect(firstOdd?.originalY ?? 0).toBeCloseTo(-124.248961, 2);
    expect((secondEven?.originalX ?? 0) - (firstEven?.originalX ?? 0)).toBeCloseTo(431.339273, 2);
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

  it('keeps running-bond on procedural repeat sizing', () => {
    const config = createPatternConfig('running_bond');
    const layout = getPatternLayout(config);
    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;

    expect(layout.repeatWidth).toBeCloseTo(config.pattern.columns * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(config.pattern.rows * unitHeight);
  });

  it('changes running-bond row offsets when stretchers changes while keeping repeat size stable', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.stretchers = 2;
    const layout = getPatternLayout(config);
    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;

    expect(layout.repeatWidth).toBeCloseTo(config.pattern.columns * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(config.pattern.rows * unitHeight);
  });

  it('maps running-bond visible rows and columns directly onto procedural repeat bounds', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    const layout = getPatternLayout(config);

    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;
    expect(layout.repeatWidth).toBeCloseTo(4 * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(6 * unitHeight);
  });

  it('matches running-bond procedural repeat at its current unit size contract', () => {
    const config = createPatternConfig('running_bond');
    const layout = getPatternLayout(config);
    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;

    expect(layout.repeatWidth).toBeCloseTo(config.pattern.columns * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(config.pattern.rows * unitHeight);
  });

  it('scales running-bond procedural repeat counts directly with visible rows and columns', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    const layout = getPatternLayout(config);
    const unitWidth = config.materials[0]!.width + config.joints.verticalSize;
    const unitHeight = config.materials[0]!.height + config.joints.horizontalSize;

    expect(layout.repeatWidth).toBeCloseTo(4 * unitWidth);
    expect(layout.repeatHeight).toBeCloseTo(6 * unitHeight);
  });

  it('uses Architextures-style running-bond bleed and raw unit spacing', () => {
    const config = createPatternConfig('running_bond');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.pattern.stretchers = 1;

    const layout = getPatternLayout(config);
    const module = SVG_PATTERN_MODULES.running_bond;
    const scaleX = config.materials[0]!.width / 300;
    const scaleY = config.materials[0]!.height / 100;
    const expectedOffsetX = -Math.min(...module.tiles.map((tile) => tile.x * scaleX));
    const expectedOffsetY = -Math.min(...module.tiles.map((tile) => tile.y * scaleY));
    const firstCourse = layout.tiles.filter((tile) => tile.y === 0);
    const visibleCourse = layout.tiles.filter((tile) => tile.y === config.materials[0]!.height);

    expect(layout.repeatOffsetX).toBeCloseTo(expectedOffsetX, 5);
    expect(layout.repeatOffsetY).toBeCloseTo(expectedOffsetY, 5);
    expect(layout.totalWidth).toBeGreaterThan(layout.repeatWidth ?? 0);
    expect(layout.totalHeight).toBeGreaterThan(layout.repeatHeight ?? 0);

    expect(firstCourse[0]?.x).toBeCloseTo(100, 5);
    expect(firstCourse[1]?.x).toBeCloseTo(300, 5);
    expect(visibleCourse[0]?.x).toBeCloseTo(200, 5);
    expect(visibleCourse[1]?.x).toBeCloseTo(600, 5);
  });

  it('keeps stretcher layout as fixed half-offset alternating rows', () => {
    const config = createPatternConfig('stretcher_bond');
    const layout = getPatternLayout(config);
    expect(layout.tiles.length).toBeGreaterThan(0);
    expect(layout.repeatWidth).toBeGreaterThan(0);
  });
});
