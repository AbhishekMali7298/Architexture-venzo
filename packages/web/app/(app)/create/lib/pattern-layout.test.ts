import { describe, expect, it } from 'vitest';
import { getPatternLayout } from './pattern-layout';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';

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
});
