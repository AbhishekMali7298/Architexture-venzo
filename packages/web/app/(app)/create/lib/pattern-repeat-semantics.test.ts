import { describe, expect, it } from 'vitest';
import { getPatternByType, type TextureConfig } from '@textura/shared';
import { SVG_PATTERN_MODULES } from '../engine/generated/svg-pattern-modules';
import { getPatternLayout } from '../engine/pattern-layouts';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import {
  getCanonicalPatternRepeatBox,
  getPatternDimensionsHintSize,
  resolvePatternRepeatFrame,
} from './pattern-repeat-semantics';

function createPatternConfig(type: 'flemish_bond' | 'chevron'): TextureConfig {
  const pattern = getPatternByType(type);
  if (!pattern) {
    throw new Error(`Missing pattern definition for ${type}`);
  }

  return {
    ...DEFAULT_TEXTURE_CONFIG,
    pattern: {
      type: pattern.type,
      category: pattern.category,
      rows: pattern.defaults.rows,
      columns: pattern.defaults.columns,
      angle: pattern.defaults.angle,
      stretchers: pattern.defaults.stretchers,
      weaves: pattern.defaults.weaves,
    },
    materials: [
      {
        ...DEFAULT_TEXTURE_CONFIG.materials[0]!,
        width: pattern.defaultUnitWidth,
        height: pattern.defaultUnitHeight,
      },
    ],
  };
}

describe('pattern repeat semantics', () => {
  it('uses the authored Flemish module repeat as the canonical frame', () => {
    const config = createPatternConfig('flemish_bond');
    config.materials[0]!.width = SVG_PATTERN_MODULES.flemish_bond.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.flemish_bond.referenceTileHeight;
    config.pattern.rows = 2;
    config.pattern.columns = 3;

    const layout = getPatternLayout(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(canonical).toEqual({
      repeatWidth: 3 * SVG_PATTERN_MODULES.flemish_bond.viewBoxWidth,
      repeatHeight: 2 * SVG_PATTERN_MODULES.flemish_bond.viewBoxHeight,
    });
    expect(frame.repeatWidth).toBe(canonical?.repeatWidth);
    expect(frame.repeatHeight).toBe(canonical?.repeatHeight);
    expect(hint).toEqual({
      width: canonical?.repeatWidth,
      height: canonical?.repeatHeight,
    });
  });

  it('keeps the chevron repeat frame stable while angle changes the piece geometry', () => {
    const shallow = createPatternConfig('chevron');
    shallow.pattern.rows = 2;
    shallow.pattern.columns = 3;
    shallow.pattern.angle = 25;
    shallow.materials[0]!.width = 400;
    shallow.materials[0]!.height = 100;

    const steep = createPatternConfig('chevron');
    steep.pattern.rows = 2;
    steep.pattern.columns = 3;
    steep.pattern.angle = 65;
    steep.materials[0]!.width = 400;
    steep.materials[0]!.height = 100;

    const shallowLayout = getPatternLayout(shallow);
    const steepLayout = getPatternLayout(steep);
    const shallowFrame = resolvePatternRepeatFrame(shallow, shallowLayout);
    const steepFrame = resolvePatternRepeatFrame(steep, steepLayout);
    const canonical = getCanonicalPatternRepeatBox(shallow);

    expect(canonical).toEqual({
      repeatWidth: 3 * (400 + shallow.joints.verticalSize),
      repeatHeight: 2 * (100 + shallow.joints.horizontalSize),
    });
    expect(shallowFrame.repeatWidth).toBe(canonical?.repeatWidth);
    expect(shallowFrame.repeatHeight).toBe(canonical?.repeatHeight);
    expect(steepFrame.repeatWidth).toBe(canonical?.repeatWidth);
    expect(steepFrame.repeatHeight).toBe(canonical?.repeatHeight);
    expect(shallowLayout.repeatOffsetX).toBeGreaterThan(0);
    expect(shallowLayout.repeatOffsetY).toBeGreaterThan(0);
    expect(shallowLayout.totalWidth).toBeGreaterThan(shallowFrame.repeatWidth);
    expect(shallowLayout.totalHeight).toBeGreaterThan(shallowFrame.repeatHeight);
    expect(shallowLayout.tiles[0]?.clipPath).not.toEqual(steepLayout.tiles[0]?.clipPath);
    expect(getPatternDimensionsHintSize(shallow, shallowLayout)).toEqual({
      width: shallowFrame.repeatWidth,
      height: shallowFrame.repeatHeight,
    });
  });
});
