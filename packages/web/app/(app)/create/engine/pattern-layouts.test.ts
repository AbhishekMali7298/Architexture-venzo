import { describe, expect, it } from 'vitest';
import { getPatternByType, type TextureConfig } from '@textura/shared';
import { getPatternSidebarSchema } from '../lib/pattern-sidebar-schema';
import { getPatternLayout } from './pattern-layouts';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';

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
    taller.pattern.rows += 1;

    expect(getPatternLayout(taller).totalHeight).toBeGreaterThan(getPatternLayout(base).totalHeight);
  });

  it.each(PATTERNS.filter((type) => type !== 'none'))('grows horizontally when columns increase for %s', (type) => {
    const base = createPatternConfig(type);
    const wider = createPatternConfig(type);
    wider.pattern.columns += 1;

    expect(getPatternLayout(wider).totalWidth).toBeGreaterThan(getPatternLayout(base).totalWidth);
  });

  it('uses the expected half-pair repeat width for flemish bond', () => {
    const config = createPatternConfig('flemish_bond');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;
    config.pattern.columns = 2;

    const layout = getPatternLayout(config);
    expect(layout.totalWidth).toBe(610);
  });

  it('keeps the hexagonal outline aligned to the repeat bounds', () => {
    const layout = getPatternLayout(createPatternConfig('hexagonal'));
    expect(layout.previewOutline).toHaveLength(6);
    expect(layout.totalWidth).toBeGreaterThan(0);
    expect(layout.totalHeight).toBeGreaterThan(0);
  });

  it('renders fishscale as a stroked field rather than discrete clipped tiles', () => {
    const layout = getPatternLayout(createPatternConfig('fishscale'));
    expect(layout.tiles).toHaveLength(1);
    expect(layout.strokes.length).toBeGreaterThan(0);
  });
});
