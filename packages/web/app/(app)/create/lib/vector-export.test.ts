import { describe, expect, it } from 'vitest';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import { buildPreviewSvg } from './vector-export';

describe('vector export', () => {
  it('clips preview SVG content to the repeat bounds', async () => {
    const svg = await buildPreviewSvg({
      ...DEFAULT_TEXTURE_CONFIG,
      pattern: {
        ...DEFAULT_TEXTURE_CONFIG.pattern,
        type: 'running_bond',
        category: 'brick_bond',
        rows: 1,
        columns: 1,
        angle: 0,
      },
      materials: [
        {
          ...DEFAULT_TEXTURE_CONFIG.materials[0]!,
          definitionId: null,
          source: { type: 'solid', color: '#b8b0a8' },
          width: 225,
          height: 100,
        },
      ],
    });

    expect(svg).toContain('clipPath id="pattern-repeat-clip"');
    expect(svg).toContain('clip-path="url(#pattern-repeat-clip)"');
  });
});
