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
  'stack_bond',
  'stretcher_bond',
  'herringbone',
  'flemish_bond',
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

    expect(getPatternSidebarSchema('chevron').layoutSource).toBe('svg-module');
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

    expect(getPatternSidebarSchema('running_bond').layoutSource).toBe('svg-module');
    expect(baseLayout.repeatWidth).toBeCloseTo(denserLayout.repeatWidth ?? 0);
    expect(baseLayout.repeatHeight).toBeCloseTo(denserLayout.repeatHeight ?? 0);
    expect(baseLayout.totalWidth).toBeGreaterThanOrEqual(baseLayout.repeatWidth ?? 0);
    expect(baseLayout.totalHeight).toBeGreaterThanOrEqual(baseLayout.repeatHeight ?? 0);
  });

  it('maps running-bond visible rows onto authored module repeat rows', () => {
    const config = createPatternConfig('running_bond');
    const module = SVG_PATTERN_MODULES.running_bond;
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.materials[0]!.width = SVG_PATTERN_MODULES.running_bond.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.running_bond.referenceTileHeight;
    config.pattern.stretchers = 1;

    const repeatCounts = getPatternRepeatCounts(config);
    const layout = getPatternLayout(config);

    expect(repeatCounts).toEqual({ rows: 3, columns: 2 });
    expect(layout.repeatWidth).toBe((module.repeatWidth ?? module.viewBoxWidth) * (config.materials[0]!.width / 300) * 2);
    expect(layout.repeatHeight).toBe((module.repeatHeight ?? module.viewBoxHeight) * 3);
  });

  it('matches running-bond authored module repeat at its current reference scale contract', () => {
    const config = createPatternConfig('running_bond');
    const module = SVG_PATTERN_MODULES.running_bond;
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    config.pattern.rows = 1;
    config.pattern.columns = 1;

    const layout = getPatternLayout(config);

    expect(layout.repeatWidth).toBe((module.repeatWidth ?? module.viewBoxWidth) * (module.referenceTileWidth / 300));
    expect(layout.repeatHeight).toBe(module.repeatHeight ?? module.viewBoxHeight);
    expect(layout.totalWidth).toBeGreaterThanOrEqual(layout.repeatWidth ?? 0);
    expect(layout.totalHeight).toBeGreaterThanOrEqual(layout.repeatHeight ?? 0);
  });

  it('scales running-bond authored repeat counts with its special X scale', () => {
    const config = createPatternConfig('running_bond');
    const module = SVG_PATTERN_MODULES.running_bond;
    config.materials[0]!.width = module.referenceTileWidth;
    config.materials[0]!.height = module.referenceTileHeight;
    config.pattern.rows = 2;
    config.pattern.columns = 3;

    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);

    expect(repeatCounts).toEqual({ rows: 1, columns: 3 });
    expect(layout.repeatWidth).toBe((module.repeatWidth ?? module.viewBoxWidth) * (module.referenceTileWidth / 300) * repeatCounts.columns);
    expect(layout.repeatHeight).toBe((module.repeatHeight ?? module.viewBoxHeight) * repeatCounts.rows);
  });
});
