import { describe, expect, it } from 'vitest';
import { DEFAULT_TEXTURE_CONFIG } from './defaults';
import { useEditorStore } from './editor-store';

describe('editor store', () => {
  it('applies the aligned Venzowood 3 joint defaults when selected', () => {
    useEditorStore
      .getState()
      .loadProjectConfig(structuredClone(DEFAULT_TEXTURE_CONFIG), { resetHistory: true });

    useEditorStore.getState().setPatternType('venzowood_3');

    const { config } = useEditorStore.getState();

    expect(config.pattern.type).toBe('venzowood_3');
    expect(config.joints.horizontalSize).toBe(-30);
    expect(config.joints.verticalSize).toBe(-120);
    expect(config.joints.linkedDimensions).toBe(false);
  });
});
