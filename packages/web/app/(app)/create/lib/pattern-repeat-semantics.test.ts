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
  it('maps running-bond visible counts onto authored module repeat counts', () => {
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

    expect(repeatCounts).toEqual({ rows: 3, columns: 2 });
    expect(canonical).toEqual({
      repeatWidth: 2 * ((SVG_PATTERN_MODULES.running_bond.repeatWidth ?? SVG_PATTERN_MODULES.running_bond.viewBoxWidth) * (config.materials[0]!.width / 300)),
      repeatHeight: 3 * (SVG_PATTERN_MODULES.running_bond.repeatHeight ?? SVG_PATTERN_MODULES.running_bond.viewBoxHeight),
    });
    expect(frame.repeatWidth).toBe(canonical?.repeatWidth);
    expect(frame.repeatHeight).toBe(canonical?.repeatHeight);
    expect(hint).toEqual({
      width: Math.round(canonical?.repeatWidth ?? 0),
      height: Math.round(canonical?.repeatHeight ?? 0),
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
      repeatWidth: 2 * ((SVG_PATTERN_MODULES.running_bond.repeatWidth ?? SVG_PATTERN_MODULES.running_bond.viewBoxWidth) * (config.materials[0]!.width / 300)),
      repeatHeight: 3 * (SVG_PATTERN_MODULES.running_bond.repeatHeight ?? SVG_PATTERN_MODULES.running_bond.viewBoxHeight),
    };

    expect(canonical).toEqual(horizontalCanonical);
    expect(frame.repeatWidth).toBe(horizontalCanonical.repeatHeight);
    expect(frame.repeatHeight).toBe(horizontalCanonical.repeatWidth);
    expect(hint).toEqual({
      width: horizontalCanonical.repeatHeight,
      height: horizontalCanonical.repeatWidth,
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

  it('keeps herringbone rows and columns as visible counts', () => {
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
    expect(canonical).not.toBeNull();
    expect(steepCanonical).not.toBeNull();

    expect(shallowFrame.repeatWidth).toBeCloseTo(canonical!.repeatWidth);
    expect(shallowFrame.repeatHeight).toBeCloseTo(canonical!.repeatHeight);
    expect(steepFrame.repeatWidth).toBeCloseTo(steepCanonical!.repeatWidth);
    expect(steepFrame.repeatHeight).toBeCloseTo(steepCanonical!.repeatHeight);
    expect(steepCanonical!.repeatWidth).toBeCloseTo(canonical!.repeatWidth);
    expect(steepCanonical!.repeatHeight).toBeGreaterThan(canonical!.repeatHeight);

    expect(shallowLayout.repeatOffsetX).toBeGreaterThanOrEqual(0);
    expect(shallowLayout.repeatOffsetY).toBeGreaterThanOrEqual(0);
    expect(shallowLayout.totalWidth).toBeGreaterThanOrEqual(shallowFrame.repeatWidth);
    expect(steepLayout.totalHeight).toBeGreaterThan(steepFrame.repeatHeight);
    expect(shallowLayout.tiles[0]?.clipPath).toEqual(steepLayout.tiles[0]?.clipPath);
    expect(shallowFrame.previewOutline).toBeUndefined();
    expect(steepFrame.previewOutline).toBeUndefined();

    expect(getPatternDimensionsHintSize(shallow, shallowLayout)).toEqual({
      width: Math.round(canonical!.repeatWidth),
      height: Math.round(canonical!.repeatHeight),
    });
    expect(getPatternDimensionsHintSize(steep, steepLayout)).toEqual({
      width: Math.round(steepCanonical!.repeatWidth),
      height: Math.round(steepCanonical!.repeatHeight),
    });
  });
});
