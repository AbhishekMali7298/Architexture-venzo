import { describe, expect, it } from 'vitest';
import { applyPatternTypeSelection, sanitizePatternConfig } from './pattern-config-utils';
import { DEFAULT_TEXTURE_CONFIG } from './defaults';

describe('pattern config utils', () => {
  it('preserves current material dimensions when switching patterns', () => {
    const next = applyPatternTypeSelection(
      {
        ...DEFAULT_TEXTURE_CONFIG,
        materials: [
          {
            ...DEFAULT_TEXTURE_CONFIG.materials[0]!,
            width: 400,
            height: 100,
          },
        ],
      },
      'flemish_bond',
      'brick_bond',
      0,
    );

    expect(next.materials[0]?.width).toBe(400);
    expect(next.materials[0]?.height).toBe(100);
    expect(next.pattern.type).toBe('flemish_bond');
  });

  it('sanitizes unsupported none config without dropping the pattern', () => {
    const next = sanitizePatternConfig({
      ...DEFAULT_TEXTURE_CONFIG,
      pattern: {
        ...DEFAULT_TEXTURE_CONFIG.pattern,
        type: 'none',
        category: 'random',
        rows: 1,
        columns: 1,
      },
    });

    expect(next.pattern.type).toBe('none');
    expect(next.pattern.rows).toBe(1);
    expect(next.pattern.columns).toBe(1);
  });

  it('preserves a saved pattern orientation when sanitizing project config', () => {
    const next = sanitizePatternConfig({
      ...DEFAULT_TEXTURE_CONFIG,
      pattern: {
        ...DEFAULT_TEXTURE_CONFIG.pattern,
        type: 'stack_bond',
        category: 'brick_bond',
        orientation: 'vertical',
      },
    });

    expect(next.pattern.type).toBe('stack_bond');
    expect(next.pattern.orientation).toBe('vertical');
  });
});
