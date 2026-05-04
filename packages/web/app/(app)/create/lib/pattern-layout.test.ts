import { describe, expect, it } from 'vitest';
import { getPatternLayout } from './pattern-layout';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import venzowood2Module from '../engine/generated/svg-pattern-modules/modules/venzowood_2';
import venzowood3Module from '../engine/generated/svg-pattern-modules/modules/venzowood_3';
import chequerPatternModule from '../engine/generated/svg-pattern-modules/modules/chequer_pattern';
import concavePatternModule from '../engine/generated/svg-pattern-modules/modules/concave_pattern';
import convexPatternModule from '../engine/generated/svg-pattern-modules/modules/convex_pattern';
import gratePatternModule from '../engine/generated/svg-pattern-modules/modules/grate_pattern';
import rhombusPatternModule from '../engine/generated/svg-pattern-modules/modules/rhombus_pattern';
import ripplePatternModule from '../engine/generated/svg-pattern-modules/modules/ripple_pattern';
import weavePatternModule from '../engine/generated/svg-pattern-modules/modules/weave_pattern';
import venzowood4Module from '../engine/generated/svg-pattern-modules/modules/venzowood_4';
import venzowood5Module from '../engine/generated/svg-pattern-modules/modules/venzowood_5';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';

const SVG_TEST_MODULES: Record<string, SvgPatternModule> = {
  venzowood_2: venzowood2Module,
  venzowood_3: venzowood3Module,
  chequer_pattern: chequerPatternModule,
  concave_pattern: concavePatternModule,
  convex_pattern: convexPatternModule,
  grate_pattern: gratePatternModule,
  rhombus_pattern: rhombusPatternModule,
  ripple_pattern: ripplePatternModule,
  weave_pattern: weavePatternModule,
  venzowood_4: venzowood4Module,
  venzowood_5: venzowood5Module,
};

describe('pattern layout', () => {
  it('builds Venzowood as a repeated nine-piece parquet module', () => {
    const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
    config.pattern = {
      ...config.pattern,
      type: 'venzowood',
      category: 'geometric',
      angle: 45,
      rows: 2,
      columns: 3,
    };

    const layout = getPatternLayout(config);

    expect(layout.tiles).toHaveLength(54);
    expect(layout.totalWidth).toBeGreaterThan(0);
    expect(layout.totalHeight).toBeGreaterThan(0);
    expect(layout.totalWidth).toBeLessThan(3700);
    expect(layout.totalHeight).toBeLessThan(3700);
    expect(layout.tiles.every((tile) => tile.points.length === 4)).toBe(true);
    expect(layout.tiles.every((tile) => tile.bounds.width > 0 && tile.bounds.height > 0)).toBe(
      true,
    );
  });

  it('rotates Venzowood toward a square module when the angle is reduced', () => {
    const angledConfig = structuredClone(DEFAULT_TEXTURE_CONFIG);
    angledConfig.pattern = {
      ...angledConfig.pattern,
      type: 'venzowood',
      category: 'geometric',
      angle: 45,
      rows: 1,
      columns: 1,
    };

    const squareConfig = structuredClone(angledConfig);
    squareConfig.pattern.angle = 0;

    const angledLayout = getPatternLayout(angledConfig);
    const squareLayout = getPatternLayout(squareConfig);
    const angledFirstTile = angledLayout.tiles[0]!;
    const squareFirstTile = squareLayout.tiles[0]!;

    expect(squareFirstTile.points[0]!.x).toBeCloseTo(squareFirstTile.points[1]!.x, 2);
    expect(squareFirstTile.points[2]!.x).toBeCloseTo(squareFirstTile.points[3]!.x, 2);
    expect(squareFirstTile.points[0]!.y).toBeCloseTo(squareFirstTile.points[3]!.y, 2);
    expect(squareFirstTile.points[1]!.y).toBeCloseTo(squareFirstTile.points[2]!.y, 2);
    expect(squareFirstTile.points[0]!.x).not.toBeCloseTo(angledFirstTile.points[0]!.x, 2);
  });

  it('builds the added SVG tile variants as selectable background layouts', () => {
    for (const patternType of [
      'venzowood_2',
      'venzowood_3',
      'chequer_pattern',
      'concave_pattern',
      'convex_pattern',
      'rhombus_pattern',
      'ripple_pattern',
      'weave_pattern',
      'venzowood_4',
      'venzowood_5',
    ]) {
      const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
      config.pattern = {
        ...config.pattern,
        type: patternType,
        category: patternType === 'venzowood_3' ? 'organic' : 'geometric',
        rows: 2,
        columns: 2,
      };

      const layout = getPatternLayout(config, SVG_TEST_MODULES[patternType]);

      expect(layout.tiles.length).toBeGreaterThan(0);
      expect(layout.totalWidth).toBeGreaterThan(0);
      expect(layout.totalHeight).toBeGreaterThan(0);
      expect(layout.tiles.every((tile) => tile.points.length >= 4)).toBe(true);
      expect(layout.tiles.every((tile) => tile.bounds.width > 0 && tile.bounds.height > 0)).toBe(
        true,
      );
    }
  });

  it('builds stroke-based SVG variants without falling back to stack tiles', () => {
    const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
    config.pattern = {
      ...config.pattern,
      type: 'grate_pattern',
      category: 'geometric',
      rows: 1,
      columns: 1,
    };

    const layout = getPatternLayout(config, gratePatternModule);

    expect(layout.tiles).toHaveLength(0);
    expect(layout.strokes.length).toBeGreaterThan(0);
    expect(layout.totalWidth).toBeGreaterThan(0);
    expect(layout.totalHeight).toBeGreaterThan(0);
  });

  it('keeps the full Venzowood 3 module visible while closing repeat seams', () => {
    const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
    config.pattern = {
      ...config.pattern,
      type: 'venzowood_3',
      category: 'organic',
      rows: 1,
      columns: 2,
    };
    config.joints.horizontalSize = 0;
    config.joints.verticalSize = 0;

    const layout = getPatternLayout(config, venzowood3Module);
    const moduleTileCount = layout.tiles.length / config.pattern.columns;
    const firstModuleTiles = layout.tiles.slice(0, moduleTileCount);
    const secondModuleTiles = layout.tiles.slice(moduleTileCount);
    const firstMaxX = Math.max(...firstModuleTiles.map((tile) => tile.bounds.x + tile.bounds.width));
    const secondMinX = Math.min(...secondModuleTiles.map((tile) => tile.bounds.x));

    expect(secondMinX - firstMaxX).toBeLessThan(0);

    const singleConfig = structuredClone(config);
    singleConfig.pattern.columns = 1;
    const singleLayout = getPatternLayout(singleConfig, venzowood3Module);
    const singleMaxX = Math.max(...singleLayout.tiles.map((tile) => tile.bounds.x + tile.bounds.width));

    expect(singleLayout.totalWidth).toBeCloseTo(singleMaxX, 2);
  });

  it('supports negative joint values as overlap between repeated modules', () => {
    const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
    config.pattern = {
      ...config.pattern,
      type: 'venzowood_3',
      category: 'organic',
      rows: 1,
      columns: 2,
    };
    config.joints.horizontalSize = 0;
    config.joints.verticalSize = -50;

    const layout = getPatternLayout(config, venzowood3Module);
    const moduleTileCount = layout.tiles.length / config.pattern.columns;
    const firstModuleTiles = layout.tiles.slice(0, moduleTileCount);
    const secondModuleTiles = layout.tiles.slice(moduleTileCount);
    const firstMaxX = Math.max(...firstModuleTiles.map((tile) => tile.bounds.x + tile.bounds.width));
    const secondMinX = Math.min(...secondModuleTiles.map((tile) => tile.bounds.x));

    expect(secondMinX - firstMaxX).toBeLessThan(0);
  });

  it('preserves rounded rectangle corners from SVG pattern assets', () => {
    const module = venzowood2Module;

    expect(module.tiles.length).toBeGreaterThan(0);
    expect(module.tiles.every((tile) => tile.clipPath.length > 4)).toBe(true);
  });

  it('preserves circular inlay shapes from Venzowood 4', () => {
    const module = venzowood4Module;

    expect(module.tiles).toHaveLength(3);
    expect(module.tiles.filter((tile) => tile.clipPath.length > 4)).toHaveLength(2);
  });

  it('builds Venzowood 5 from closed SVG paths', () => {
    const module = venzowood5Module;

    expect(module.tiles).toHaveLength(2);
    expect(module.tiles.every((tile) => tile.clipPath.length > 4)).toBe(true);
  });

  it('builds Chequer Pattern from SVG rectangles', () => {
    const module = chequerPatternModule;

    expect(module.tiles).toHaveLength(4);
    expect(module.tiles.every((tile) => tile.clipPath.length === 4)).toBe(true);
  });

  it('preserves the authored SVG seam gap for repeated Chequer Pattern modules', () => {
    const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
    config.pattern = {
      ...config.pattern,
      type: 'chequer_pattern',
      category: 'geometric',
      rows: 1,
      columns: 2,
    };
    config.joints.horizontalSize = 0;
    config.joints.verticalSize = 0;

    const layout = getPatternLayout(config, chequerPatternModule);
    const moduleTileCount = layout.tiles.length / config.pattern.columns;
    const firstModuleTiles = layout.tiles.slice(0, moduleTileCount);
    const secondModuleTiles = layout.tiles.slice(moduleTileCount);
    const firstLeftGap = Math.min(...firstModuleTiles.map((tile) => tile.bounds.x));
    const firstRightGap =
      layout.totalWidth / config.pattern.columns -
      Math.max(...firstModuleTiles.map((tile) => tile.bounds.x + tile.bounds.width));
    const secondLeftGap =
      Math.min(...secondModuleTiles.map((tile) => tile.bounds.x)) -
      layout.totalWidth / config.pattern.columns;

    expect(firstLeftGap).toBeGreaterThan(0);
    expect(firstRightGap).toBeGreaterThan(0);
    expect(secondLeftGap).toBeCloseTo(firstLeftGap, 2);
  });

  it('preserves transformed rhombus geometry from SVG rectangles', () => {
    const module = rhombusPatternModule;

    expect(module.tiles).toHaveLength(2);
    expect(module.tiles.every((tile) => tile.clipPath.length === 4)).toBe(true);
    expect(module.strokes.length).toBeGreaterThan(0);
  });
});
