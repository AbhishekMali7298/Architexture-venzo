import { describe, expect, it } from 'vitest';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import { useEditorStore } from '../store/editor-store';
import { buildPreviewSvg } from './vector-export';

describe('vector export', () => {
  it('renders stroke-based emboss markup for grate pattern previews', async () => {
    const config = structuredClone(DEFAULT_TEXTURE_CONFIG);
    config.pattern = {
      ...config.pattern,
      type: 'grate_pattern',
      category: 'geometric',
      rows: 1,
      columns: 1,
    };

    useEditorStore.getState().setEmbossMode(true);
    useEditorStore.getState().setEmbossStrength(100);

    const svg = await buildPreviewSvg(config);

    expect(svg).toContain('<polyline');
    expect(svg).toContain('stroke="#fff8ef"');
    expect(svg).toContain('stroke="#000000"');
  });
});
