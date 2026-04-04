import { describe, expect, it } from 'vitest';
import { supportsPatternOrientationToggle } from './pattern-orientation';

describe('pattern orientation support', () => {
  it('hides orientation toggle for common running bond', () => {
    expect(supportsPatternOrientationToggle('running_bond')).toBe(false);
  });

  it('keeps orientation toggle enabled for stack bond', () => {
    expect(supportsPatternOrientationToggle('stack_bond')).toBe(true);
  });
});
