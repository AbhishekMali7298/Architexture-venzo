import { describe, expect, it } from 'vitest';
import {
  applyImageAdjustmentsToColor,
  getJointRenderableColor,
  getMaterialSourceRenderableImageUrl,
  getPatternPreviewImageUrl,
} from './material-assets';

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

    expect(base).toBe('#E8E6E0');
    expect(adjusted).not.toBe(base);
  });

  it('resolves image-backed joint materials to a renderable asset URL', () => {
    expect(
      getMaterialSourceRenderableImageUrl({
        type: 'image',
        asset: {
          path: 'joints/adobe-main.jpg',
          mimeType: 'image/jpeg',
        },
        fallbackColor: '#b87352',
      }),
    ).toBe('/api/assets/joints/adobe-main.jpg');
  });

  it('resolves pattern preview SVGs from the selected pattern', () => {
    expect(getPatternPreviewImageUrl('venzowood')).toBe('/patterns/impress/venzowood.svg');
    expect(getPatternPreviewImageUrl('chequer_pattern')).toBe('/patterns/impress/chequer_pattern.svg');
    expect(getPatternPreviewImageUrl('venzowood_4')).toBe('/patterns/vita-components/venzowood_4.svg');
    expect(getPatternPreviewImageUrl('venzowood_5')).toBe('/patterns/vita-components/venzowood_5.svg');
    expect(getPatternPreviewImageUrl('vita_pattern_3')).toBe('/patterns/vita-components/pattern 3.svg');
    expect(getPatternPreviewImageUrl('vita_pattern_21')).toBe('/patterns/vita-components/pattern 21.svg');
  });
});
