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
      rows: 2,
      columns: 3,
    };

    const layout = getPatternLayout(config);

    expect(layout.tiles).toHaveLength(54);
    expect(layout.totalWidth).toBeGreaterThan(0);
    expect(layout.totalHeight).toBeGreaterThan(0);
    expect(layout.tiles.every((tile) => tile.points.length === 4)).toBe(true);
    expect(layout.tiles.every((tile) => tile.bounds.width > 0 && tile.bounds.height > 0)).toBe(
      true,
    );
  });
});
