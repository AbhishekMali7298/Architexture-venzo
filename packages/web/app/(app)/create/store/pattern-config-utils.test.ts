import { describe, expect, it } from 'vitest';
import { applyPatternTypeSelection, sanitizePatternConfig } from './pattern-config-utils';
import { DEFAULT_TEXTURE_CONFIG } from './defaults';

describe('pattern config utils', () => {
  it('applies pattern default material dimensions when switching patterns', () => {
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

    expect(next.materials[0]?.width).toBe(215);
    expect(next.materials[0]?.height).toBe(65);
    expect(next.pattern.type).toBe('flemish_bond');
  });

  it('applies the Common pattern default half-offset stretcher setting', () => {
    const next = applyPatternTypeSelection(
      {
        ...DEFAULT_TEXTURE_CONFIG,
      },
      'running_bond',
      'brick_bond',
      0,
    );

    expect(next.pattern.type).toBe('running_bond');
    expect(next.pattern.stretchers).toBe(1);
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

  it('snaps pattern counts to the original Architextures multiples', () => {
    const next = sanitizePatternConfig({
      ...DEFAULT_TEXTURE_CONFIG,
      pattern: {
        ...DEFAULT_TEXTURE_CONFIG.pattern,
        type: 'chevron',
        category: 'geometric',
        rows: 5,
        columns: 3,
      },
    });

    expect(next.pattern.rows).toBe(5);
    expect(next.pattern.columns).toBe(2);
  });

  it('clamps chevron angle to the current live maximum', () => {
    const next = sanitizePatternConfig({
      ...DEFAULT_TEXTURE_CONFIG,
      pattern: {
        ...DEFAULT_TEXTURE_CONFIG.pattern,
        type: 'chevron',
        category: 'geometric',
        angle: 80,
      },
    });

    expect(next.pattern.angle).toBe(70);
  });

  it('locks herringbone angle to 45 in create editor', () => {
    const next = sanitizePatternConfig({
      ...DEFAULT_TEXTURE_CONFIG,
      pattern: {
        ...DEFAULT_TEXTURE_CONFIG.pattern,
        type: 'herringbone',
        category: 'paving',
        angle: 90,
      },
    });

    expect(next.pattern.angle).toBe(45);
  });
});
