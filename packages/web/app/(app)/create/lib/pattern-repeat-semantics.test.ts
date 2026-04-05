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

function createPatternConfig(type: 'flemish_bond' | 'chevron' | 'running_bond' | 'herringbone' | 'cubic' | 'staggered' | 'ashlar'): TextureConfig {
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
  it('maps staggered visible counts to procedural repeat bounds', () => {
    const config = createPatternConfig('staggered');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 6;
    config.pattern.columns = 4;

    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(repeatCounts).toEqual({ rows: 6, columns: 4 });
    expect(canonical).toBeNull();
    expect(frame.repeatWidth).toBe((config.materials[0]!.width + config.joints.verticalSize) * 4);
    expect(frame.repeatHeight).toBe((config.materials[0]!.height + config.joints.horizontalSize) * 6);
    expect(hint).toEqual({ width: 1620, height: 630 });
  });

  it('maps running-bond visible counts onto procedural repeat bounds', () => {
    const config = createPatternConfig('running_bond');
    config.materials[0]!.width = SVG_PATTERN_MODULES.running_bond.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.running_bond.referenceTileHeight;
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.pattern.stretchers = 2;

    const layout = getPatternLayout(config);
    const repeatCounts = getPatternRepeatCounts(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(repeatCounts).toEqual({ rows: 6, columns: 2 });
    expect(canonical).toBeNull();
    expect(frame.repeatWidth).toBe((config.materials[0]!.width + config.joints.verticalSize) * 2);
    expect(frame.repeatHeight).toBe((config.materials[0]!.height + config.joints.horizontalSize) * 6);
    expect(hint).toEqual({
      width: Math.round(frame.repeatWidth),
      height: Math.round(frame.repeatHeight),
    });
  });

  it('swaps the repeat frame dimensions when pattern orientation is vertical', () => {
    const config = createPatternConfig('running_bond');
    config.materials[0]!.width = SVG_PATTERN_MODULES.running_bond.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.running_bond.referenceTileHeight;
    config.pattern.rows = 6;
    config.pattern.columns = 2;
    config.pattern.orientation = 'vertical';
    config.pattern.stretchers = 2;

    const layout = getPatternLayout(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);
    const horizontalCanonical = {
      repeatWidth: (config.materials[0]!.width + config.joints.verticalSize) * 2,
      repeatHeight: (config.materials[0]!.height + config.joints.horizontalSize) * 6,
    };

    expect(canonical).toBeNull();
    expect(frame.repeatWidth).toBe(horizontalCanonical.repeatHeight);
    expect(frame.repeatHeight).toBe(horizontalCanonical.repeatWidth);
    expect(hint).toEqual({
      width: horizontalCanonical.repeatHeight,
      height: horizontalCanonical.repeatWidth,
    });
  });

  it('uses procedural layout repeat as the frame for flemish bond', () => {
    const config = createPatternConfig('flemish_bond');
    config.materials[0]!.width = SVG_PATTERN_MODULES.flemish_bond.referenceTileWidth;
    config.materials[0]!.height = SVG_PATTERN_MODULES.flemish_bond.referenceTileHeight;
    config.pattern.rows = 2;
    config.pattern.columns = 3;

    const layout = getPatternLayout(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const frame = resolvePatternRepeatFrame(config, layout);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(canonical).toBeNull();
    expect(frame.repeatWidth).toBeCloseTo(layout.repeatWidth ?? layout.totalWidth);
    expect(frame.repeatHeight).toBeCloseTo(layout.repeatHeight ?? layout.totalHeight);
    expect(hint.width).toBe(Math.round(frame.repeatWidth));
    expect(hint.height).toBe(Math.round(frame.repeatHeight));
  });

  it('maps visible herringbone counts onto procedural diagonal repeat bounds', () => {
    const config = createPatternConfig('herringbone');
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.materials[0]!.width = 200;
    config.materials[0]!.height = 100;
    config.joints.horizontalSize = 10;
    config.joints.verticalSize = 10;

    const repeatCounts = getPatternRepeatCounts(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const layout = getPatternLayout(config);
    const frame = resolvePatternRepeatFrame(config, layout);

    expect(repeatCounts).toEqual({ rows: 6, columns: 2 });
    expect(canonical).toEqual({
      repeatWidth: 4 * (200 + 10) / Math.sqrt(2),
      repeatHeight: 6 * 2 * (100 + 10) / Math.sqrt(2),
    });
    expect(frame.repeatWidth).toBeCloseTo(canonical!.repeatWidth, 1);
    expect(frame.repeatHeight).toBeCloseTo(canonical!.repeatHeight, 1);
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

  it('maps ashlar visible counts into grouped authored module repeats', () => {
    const config = createPatternConfig('ashlar');
    config.materials[0]!.width = 400;
    config.materials[0]!.height = 100;
    config.pattern.rows = 6;
    config.pattern.columns = 4;
    config.joints.horizontalSize = 5;
    config.joints.verticalSize = 5;

    const repeatCounts = getPatternRepeatCounts(config);
    const canonical = getCanonicalPatternRepeatBox(config);
    const layout = getPatternLayout(config);
    const hint = getPatternDimensionsHintSize(config, layout);

    expect(repeatCounts).toEqual({ rows: 6, columns: 4 });
    expect(canonical?.repeatWidth).toBeCloseTo(1620);
    expect(canonical?.repeatHeight).toBeCloseTo(630);
    expect(hint).toEqual({ width: 1620, height: 630 });
  });

  it('keeps chevron columns mapped to visible half-arms while angle changes vertical repeat pitch', () => {
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
    const steepCanonical = getCanonicalPatternRepeatBox(steep);
    const repeatCounts = getPatternRepeatCounts(shallow);

    expect(repeatCounts).toEqual({ rows: 6, columns: 1 });
  expect(canonical).toBeNull();
  expect(steepCanonical).toBeNull();

  expect(shallowFrame.repeatWidth).toBeCloseTo(shallowLayout.repeatWidth ?? shallowLayout.totalWidth);
  expect(shallowFrame.repeatHeight).toBeCloseTo(shallowLayout.repeatHeight ?? shallowLayout.totalHeight);
  expect(steepFrame.repeatWidth).toBeCloseTo(steepLayout.repeatWidth ?? steepLayout.totalWidth);
  expect(steepFrame.repeatHeight).toBeCloseTo(steepLayout.repeatHeight ?? steepLayout.totalHeight);
  expect(steepFrame.repeatWidth).toBeCloseTo(shallowFrame.repeatWidth);
  expect(steepFrame.repeatHeight).toBeGreaterThan(shallowFrame.repeatHeight);

    expect(shallowLayout.repeatOffsetX).toBeGreaterThanOrEqual(0);
    expect(shallowLayout.repeatOffsetY).toBeGreaterThanOrEqual(0);
    expect(shallowLayout.totalWidth).toBeGreaterThanOrEqual(shallowFrame.repeatWidth);
    expect(steepLayout.totalHeight).toBeGreaterThan(steepFrame.repeatHeight);
    expect(shallowLayout.tiles[0]?.clipPath).not.toEqual(steepLayout.tiles[0]?.clipPath);
    expect(shallowFrame.previewOutline).toBeUndefined();
    expect(steepFrame.previewOutline).toBeUndefined();

    expect(getPatternDimensionsHintSize(shallow, shallowLayout)).toEqual({
      width: Math.round(shallowFrame.repeatWidth),
      height: Math.round(shallowFrame.repeatHeight),
    });
    expect(getPatternDimensionsHintSize(steep, steepLayout)).toEqual({
      width: Math.round(steepFrame.repeatWidth),
      height: Math.round(steepFrame.repeatHeight),
    });
  });
});
