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
  'flemish_bond',
  'ashlar',
  'cubic',
  'hopscotch',
  'diamond',
  'intersecting_circle',
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

  it('uses horizontal and vertical joint sizes directly for stack bond', () => {
    const config = createPatternConfig('stack_bond');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.joints.horizontalSize = 12;
    config.joints.verticalSize = 18;

    const layout = getPatternLayout(config);

    expect(layout.repeatWidth).toBe(4 * (400 + 18));
    expect(layout.repeatHeight).toBe(6 * (100 + 12));
  });

  it('keeps stack bond geometry horizontal before orientation transforms are applied', () => {
    const config = createPatternConfig('stack_bond');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 6;
    config.pattern.columns = 4;

    const layout = getPatternLayout(config);

    expect(layout.repeatWidth).toBe(4 * (400 + config.joints.verticalSize));
    expect(layout.repeatHeight).toBe(6 * (100 + config.joints.horizontalSize));
    expect(layout.tiles[0]).toMatchObject({ width: 400, height: 100, x: 0, y: 0 });
    expect(layout.tiles[1]).toMatchObject({ width: 400, height: 100, x: 400 + config.joints.verticalSize, y: 0 });
  });

  it('starts running bond on the offset row so the first visible course clips at the frame edge', () => {
    const config = createPatternConfig('running_bond');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 2;
    config.pattern.columns = 4;

    const layout = getPatternLayout(config);
    const firstRow = layout.tiles.filter((tile) => tile.y === 0);
    const secondRow = layout.tiles.filter((tile) => tile.y === 100 + config.joints.horizontalSize);

    expect(firstRow).toHaveLength(6);
    expect(secondRow).toHaveLength(4);
    expect(firstRow[0]?.x).toBeCloseTo(-(400 + config.joints.verticalSize) / 2);
    expect(firstRow.at(-1)?.x).toBeCloseTo(4 * (400 + config.joints.verticalSize) + (400 + config.joints.verticalSize) / 2);
    expect(secondRow[0]?.x).toBe(0);
    expect(layout.totalWidth).toBe(4 * (400 + config.joints.verticalSize));
  });

  it('uses the expected half-pair repeat width for flemish bond', () => {
    const config = createPatternConfig('flemish_bond');
    config.materials[0]!.width = 150;
    config.materials[0]!.height = 100;
    config.pattern.rows = 1;
    config.pattern.columns = 1;

    const layout = getPatternLayout(config);
    expect(layout.repeatWidth).toBe(SVG_PATTERN_MODULES.flemish_bond.viewBoxWidth);
    expect(layout.repeatHeight).toBe(SVG_PATTERN_MODULES.flemish_bond.viewBoxHeight);
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

  it('grows basketweave modules when the weave count increases', () => {
    const base = createPatternConfig('basketweave');
    base.pattern.rows = 1;
    base.pattern.columns = 1;
    base.pattern.weaves = 1;

    const denser = createPatternConfig('basketweave');
    denser.pattern.rows = 1;
    denser.pattern.columns = 1;
    denser.pattern.weaves = 3;

    const baseLayout = getPatternLayout(base);
    const denserLayout = getPatternLayout(denser);

    expect(denserLayout.totalWidth).toBeGreaterThan(baseLayout.totalWidth);
    expect(denserLayout.totalHeight).toBeGreaterThan(baseLayout.totalHeight);
    expect(denserLayout.tiles.length).toBeGreaterThan(baseLayout.tiles.length);
  });

  it('falls back to the orthogonal herringbone layout at 90 degrees', () => {
    const diagonal = createPatternConfig('herringbone');
    diagonal.pattern.rows = 1;
    diagonal.pattern.columns = 1;
    diagonal.pattern.angle = 45;

    const orthogonal = createPatternConfig('herringbone');
    orthogonal.pattern.rows = 1;
    orthogonal.pattern.columns = 1;
    orthogonal.pattern.angle = 90;

    const diagonalLayout = getPatternLayout(diagonal);
    const orthogonalLayout = getPatternLayout(orthogonal);

    expect(diagonalLayout.repeatWidth).not.toBe(orthogonalLayout.repeatWidth);
    expect(diagonalLayout.repeatHeight).not.toBe(orthogonalLayout.repeatHeight);
  });

  it('uses visible chevron counts directly in the procedural repeat box', () => {
    const config = createPatternConfig('chevron');
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;
    config.pattern.angle = 45;

    const layout = getPatternLayout(config);

    expect(getPatternSidebarSchema('chevron').layoutSource).toBe('procedural');
    expect(layout.repeatWidth).toBeCloseTo(405);
    expect(layout.displayRepeatWidth).toBeCloseTo(810);
    expect(layout.repeatHeight).toBeCloseTo(642.43, 1);
    expect(layout.repeatOffsetX ?? 0).toBeGreaterThanOrEqual(0);
    expect(layout.repeatOffsetX ?? 0).toBeLessThan(405);
    expect(layout.repeatOffsetY ?? 0).toBeGreaterThanOrEqual(0);
    expect(layout.repeatOffsetY ?? 0).toBeLessThan(layout.repeatHeight ?? Number.POSITIVE_INFINITY);
  });

  it('changes chevron clip geometry and repeat height when angle changes', () => {
    const shallow = createPatternConfig('chevron');
    shallow.pattern.rows = 6;
    shallow.pattern.columns = 2;
    shallow.pattern.angle = 10;
    shallow.materials[0]!.width = 400;
    shallow.materials[0]!.height = 100;

    const steep = createPatternConfig('chevron');
    steep.pattern.rows = 6;
    steep.pattern.columns = 2;
    steep.pattern.angle = 45;
    steep.materials[0]!.width = 400;
    steep.materials[0]!.height = 100;

    const shallowLayout = getPatternLayout(shallow);
    const steepLayout = getPatternLayout(steep);

    expect(shallowLayout.repeatWidth).toBeCloseTo(steepLayout.repeatWidth);
    expect(shallowLayout.repeatHeight).toBeLessThan(steepLayout.repeatHeight ?? 0);
    expect(steepLayout.repeatOffsetX).toBeCloseTo(shallowLayout.repeatOffsetX ?? 0, 6);
    expect(steepLayout.repeatOffsetX ?? 0).toBeGreaterThanOrEqual(0);
    expect(steepLayout.repeatOffsetX ?? 0).toBeLessThan(steep.materials[0]!.width + steep.joints.verticalSize);
    expect(shallowLayout.tiles[0]?.clipPath).not.toEqual(steepLayout.tiles[0]?.clipPath);
  });

  it('keeps chevron repeat counts equal to the visible row and column counts', () => {
    const config = createPatternConfig('chevron');
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.pattern.angle = 45;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const repeatCounts = getPatternRepeatCounts(config);
    const layout = getPatternLayout(config);

    expect(repeatCounts).toEqual({ rows: 6, columns: 2 });
    // columns=2 → vPairs=1 → frame=1×405; display hint stays at 2×405
    expect(layout.repeatWidth).toBeCloseTo(1 * 405);
    expect(layout.displayRepeatWidth).toBeCloseTo(2 * 405);
    expect(layout.repeatHeight).toBeCloseTo(6 * (100 + 5 / Math.cos(Math.PI / 4)), 1);
    // vPairs=1 → tile loop uses column -1..1 (3 cols) × row -1..rows+1 (rows+2 rows) × 2 pieces
    const vPairs = Math.max(1, Math.floor(config.pattern.columns / 2));
    expect(layout.tiles).toHaveLength((config.pattern.rows + 2) * (vPairs + 2) * 2);
  });

  it('keeps Chevron deterministic with the procedural layout', () => {
    const config = createPatternConfig('chevron');
    config.pattern.rows = 2;
    config.pattern.columns = 1;
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.angle = 30;

    const layout = getPatternLayout(config);

    expect(getPatternSidebarSchema('chevron').layoutSource).toBe('procedural');
    expect(layout.repeatWidth).toBeCloseTo(config.materials[0]!.width + config.joints.verticalSize);
    expect(layout.repeatHeight).toBeCloseTo(2 * (config.materials[0]!.height + config.joints.horizontalSize / Math.cos(Math.PI / 6)), 1);
    expect(layout.repeatOffsetX ?? 0).toBeGreaterThanOrEqual(0);
    expect(layout.repeatOffsetX ?? 0).toBeLessThan(config.materials[0]!.width + config.joints.verticalSize);
    expect(layout.repeatOffsetY ?? 0).toBeGreaterThanOrEqual(0);
    expect(layout.repeatOffsetY ?? 0).toBeLessThan(layout.repeatHeight ?? Number.POSITIVE_INFINITY);
    expect(layout.previewOutline).toBeUndefined();
  });
});
