import { describe, expect, it } from 'vitest';
import { getPatternByType, type TextureConfig } from '@textura/shared';
import { SVG_PATTERN_MODULES } from '../engine/generated/svg-pattern-modules';
import { getPatternLayout } from '../engine/pattern-layouts';
import { DEFAULT_TEXTURE_CONFIG } from '../store/defaults';
import {
  getCanonicalPatternRepeatBox,
  getPatternDimensionsHintSize,
  getPatternRepeatCounts,
  resolvePatternRepeatFrame,
} from './pattern-repeat-semantics';

function createPatternConfig(type: 'flemish_bond' | 'chevron' | 'running_bond' | 'herringbone' | 'cubic'): TextureConfig {
  const pattern = getPatternByType(type);
  if (!pattern) {
    throw new Error(`Missing pattern definition for ${type}`);
  }

  return {
    ...DEFAULT_TEXTURE_CONFIG,
    pattern: {
      type: pattern.type,
      category: pattern.category,
      orientation: 'horizontal',
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
  it('uses the visible running-bond bounds as the canonical common-pattern frame', () => {
    const config = createPatternConfig('running_bond');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 6;
    config.pattern.columns = 2;

    const layout = getPatternLayout(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(canonical).toBeNull();
    expect(frame.repeatWidth).toBe(2 * (400 + config.joints.verticalSize));
    expect(frame.repeatHeight).toBe(6 * (100 + config.joints.horizontalSize));
    expect(hint).toEqual({
      width: 2 * (400 + config.joints.verticalSize),
      height: 6 * (100 + config.joints.horizontalSize),
    });
  });

  it('swaps the repeat frame dimensions when pattern orientation is vertical', () => {
    const config = createPatternConfig('running_bond');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.pattern.orientation = 'vertical';

    const layout = getPatternLayout(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(frame.repeatWidth).toBe(6 * (100 + config.joints.horizontalSize));
    expect(frame.repeatHeight).toBe(2 * (400 + config.joints.verticalSize));
    expect(hint).toEqual({
      width: 6 * (100 + config.joints.horizontalSize),
      height: 2 * (400 + config.joints.verticalSize),
    });
  });

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
      repeatWidth: 2 * SVG_PATTERN_MODULES.flemish_bond.viewBoxWidth,
      repeatHeight: SVG_PATTERN_MODULES.flemish_bond.viewBoxHeight,
    });
    expect(frame.repeatWidth).toBe(canonical?.repeatWidth);
    expect(frame.repeatHeight).toBe(canonical?.repeatHeight);
    expect(hint).toEqual({
      width: canonical?.repeatWidth,
      height: canonical?.repeatHeight,
    });
  });

  it('maps visible herringbone counts onto authored module repeat counts', () => {
    const config = createPatternConfig('herringbone');
    config.materials[0]!.width = SVG_PATTERN_MODULES.herringbone.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.herringbone.referenceTileHeight;
    config.pattern.rows = 6;
    config.pattern.columns = 4;

    const repeatCounts = getPatternRepeatCounts(config);
    const canonical = getCanonicalPatternRepeatBox(config);

    expect(repeatCounts).toEqual({ rows: 6, columns: 2 });
    expect(canonical).toEqual({
      repeatWidth: 2 * (SVG_PATTERN_MODULES.herringbone.repeatWidth ?? SVG_PATTERN_MODULES.herringbone.viewBoxWidth),
      repeatHeight: 6 * (SVG_PATTERN_MODULES.herringbone.repeatHeight ?? SVG_PATTERN_MODULES.herringbone.viewBoxHeight),
    });
  });

  it('maps visible cubic counts onto authored module repeat counts', () => {
    const config = createPatternConfig('cubic');
    config.materials[0]!.width = SVG_PATTERN_MODULES.cubic.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.cubic.referenceTileHeight;
    config.pattern.rows = 6;
    config.pattern.columns = 6;

    const repeatCounts = getPatternRepeatCounts(config);
    const canonical = getCanonicalPatternRepeatBox(config);

    expect(repeatCounts).toEqual({ rows: 3, columns: 2 });
    expect(canonical).toEqual({
      repeatWidth: 2 * (SVG_PATTERN_MODULES.cubic.repeatWidth ?? SVG_PATTERN_MODULES.cubic.viewBoxWidth),
      repeatHeight: 3 * (SVG_PATTERN_MODULES.cubic.repeatHeight ?? SVG_PATTERN_MODULES.cubic.viewBoxHeight),
    });
  });

  it('keeps chevron rows and columns as visible counts while angle changes the repeat height', () => {
    const shallow = createPatternConfig('chevron');
    shallow.pattern.rows = 6;
    shallow.pattern.columns = 2;
    shallow.pattern.angle = 10;
    shallow.materials[0]!.width = 400;
    shallow.materials[0]!.height = 100;
    shallow.joints.horizontalSize = 5;
    shallow.joints.verticalSize = 5;

    const steep = createPatternConfig('chevron');
    steep.pattern.rows = 6;
    steep.pattern.columns = 2;
    steep.pattern.angle = 45;
    steep.materials[0]!.width = 400;
    steep.materials[0]!.height = 100;
    steep.joints.horizontalSize = 5;
    steep.joints.verticalSize = 5;

    const shallowLayout = getPatternLayout(shallow);
    const steepLayout = getPatternLayout(steep);
    const shallowFrame = resolvePatternRepeatFrame(shallow, shallowLayout);
    const steepFrame = resolvePatternRepeatFrame(steep, steepLayout);
    const canonical = getCanonicalPatternRepeatBox(shallow);
    const repeatCounts = getPatternRepeatCounts(shallow);

    expect(repeatCounts).toEqual({ rows: 6, columns: 2 });
    expect(canonical).toBeNull();

  // columns=2 → vPairs=1 → frame=405mm
  expect(shallowFrame.repeatWidth).toBeCloseTo(405);
    expect(shallowFrame.repeatHeight).toBeCloseTo(630.46, 1);
  expect(steepFrame.repeatWidth).toBeCloseTo(405);
    expect(steepFrame.repeatHeight).toBeCloseTo(642.43, 1);

    expect(shallowLayout.repeatOffsetX).toBeGreaterThanOrEqual(0);
    expect(shallowLayout.repeatOffsetY).toBeGreaterThanOrEqual(0);
    expect(shallowLayout.totalWidth).toBeGreaterThanOrEqual(shallowFrame.repeatWidth);
    expect(steepLayout.totalHeight).toBeGreaterThan(steepFrame.repeatHeight);
    expect(shallowLayout.tiles[0]?.clipPath).not.toEqual(steepLayout.tiles[0]?.clipPath);
    expect(shallowFrame.previewOutline).toBeUndefined();
    expect(steepFrame.previewOutline).toBeUndefined();

    expect(getPatternDimensionsHintSize(shallow, shallowLayout)).toEqual({
      // hint size uses displayRepeatWidth when available (ie 810mm for cols=2)
      width: 405,
      height: 630,
    });
    expect(getPatternDimensionsHintSize(steep, steepLayout)).toEqual({
      width: 405,
      height: 642,
    });
  });
});
