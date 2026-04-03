import { describe, expect, it } from 'vitest';
import type { TextureConfig } from '@textura/shared';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import type { PatternTile } from './pattern-layouts';
import { getTileRenderBox } from './render-geometry';

function createConfig(): TextureConfig {
  return JSON.parse(JSON.stringify(DEFAULT_TEXTURE_CONFIG)) as TextureConfig;
}

function createTile(): PatternTile {
  return {
    x: 0,
    y: 0,
    width: 400,
    height: 100,
    rotation: 0,
    materialIndex: 0,
  };
}

describe('tile edge geometry', () => {
  it('builds an irregular clip path for rough brick edges', () => {
    const config = createConfig();
    config.materials[0]!.edges.style = 'rough_brick';
    config.materials[0]!.edges.perimeterScale = 72;

    const box = getTileRenderBox(createTile(), config, 1);
    const topEdge = Math.min(...(box.clipPath ?? []).map((point) => point.y));

    expect(box.clipPath?.length ?? 0).toBeGreaterThan(20);
    expect(topEdge).toBeLessThan(box.tileY);
  });

  it('uses radius-based geometry for double bullnose edges', () => {
    const config = createConfig();
    config.materials[0]!.edges.style = 'double_bullnose';
    config.materials[0]!.edges.profileWidth = 25;

    const box = getTileRenderBox(createTile(), config, 1);

    expect(box.clipPath).toBeUndefined();
    expect(box.cornerRadius).toBeGreaterThan(20);
  });

  it('pulls the profile inward for recessed edges', () => {
    const config = createConfig();
    config.materials[0]!.edges.style = 'recessed';
    config.materials[0]!.edges.profileWidth = 60;

    const box = getTileRenderBox(createTile(), config, 1);
    const xs = (box.clipPath ?? []).map((point) => point.x);
    const ys = (box.clipPath ?? []).map((point) => point.y);

    expect(box.clipPath?.length ?? 0).toBeGreaterThan(12);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(box.tileX);
    expect(Math.max(...xs)).toBeLessThanOrEqual(box.tileX + box.tileWidth);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(box.tileY);
    expect(Math.max(...ys)).toBeLessThanOrEqual(box.tileY + box.tileHeight);
  });
});
