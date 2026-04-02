import { describe, expect, it } from 'vitest';
import { applyImageAdjustmentsToColor, getJointRenderableColor } from './material-assets';

describe('material asset color helpers', () => {
  it('darkens colors when brightness is reduced', () => {
    expect(
      applyImageAdjustmentsToColor('#FFFFFF', {
        brightness: -60,
        contrast: 0,
        hue: 0,
        saturation: 0,
        invertColors: false,
      }),
    ).not.toBe('#ffffff');
  });

  it('keeps joint adjustments visible even when the joint tint is white', () => {
    const source = { type: 'solid', color: '#e8e6e0' } as const;
    const base = getJointRenderableColor(source, '#FFFFFF');
    const adjusted = getJointRenderableColor(source, '#FFFFFF', {
      brightness: -25,
      contrast: 20,
      hue: 25,
      saturation: 60,
      invertColors: false,
    });

    expect(base).not.toBe('#FFFFFF');
    expect(adjusted).not.toBe(base);
  });
});
