import { describe, expect, it } from 'vitest';
import { DEFAULT_TEXTURE_CONFIG } from './defaults';
import { useEditorStore } from './editor-store';

describe('editor store', () => {
  it('restores the default emboss state and strength after reset', () => {
    const store = useEditorStore.getState();

    expect(store.embossMode).toBe(false);
    expect(store.embossStrength).toBe(100);

    store.setEmbossMode(false);
    store.setEmbossStrength(55);
    store.resetProject();

    expect(useEditorStore.getState().embossMode).toBe(false);
    expect(useEditorStore.getState().embossStrength).toBe(100);
  });

  it('clamps emboss strength to the supported range', () => {
    const store = useEditorStore.getState();

    store.setEmbossStrength(260);
    expect(useEditorStore.getState().embossStrength).toBe(100);

    store.setEmbossStrength(-20);
    expect(useEditorStore.getState().embossStrength).toBe(0);
  });

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

  it('resets other patterns to standard linked 5 mm joints', () => {
    useEditorStore
      .getState()
      .loadProjectConfig(structuredClone(DEFAULT_TEXTURE_CONFIG), { resetHistory: true });

    useEditorStore.getState().setPatternType('venzowood_3');
    useEditorStore.getState().setPatternType('stack_bond');

    const { config } = useEditorStore.getState();

    expect(config.pattern.type).toBe('stack_bond');
    expect(config.joints.horizontalSize).toBe(5);
    expect(config.joints.verticalSize).toBe(5);
    expect(config.joints.linkedDimensions).toBe(true);
  });

  it('selects the base Venzowood pattern at 0 degrees', () => {
    useEditorStore
      .getState()
      .loadProjectConfig(structuredClone(DEFAULT_TEXTURE_CONFIG), { resetHistory: true });

    useEditorStore.getState().setPatternType('venzowood');

    const { config } = useEditorStore.getState();

    expect(config.pattern.type).toBe('venzowood');
    expect(config.pattern.angle).toBe(0);
  });

  it('keeps emboss mode enabled for impress SVG patterns', () => {
    useEditorStore
      .getState()
      .loadProjectConfig(structuredClone(DEFAULT_TEXTURE_CONFIG), { resetHistory: true });

    useEditorStore.getState().setPatternType('chequer_pattern');

    expect(useEditorStore.getState().embossMode).toBe(true);
  });

  it('keeps emboss mode enabled for stroke-based impress SVG patterns', () => {
    useEditorStore
      .getState()
      .loadProjectConfig(structuredClone(DEFAULT_TEXTURE_CONFIG), { resetHistory: true });

    useEditorStore.getState().setPatternType('grate_pattern');

    expect(useEditorStore.getState().embossMode).toBe(true);
  });

  it('resets every selected pattern to one row and one column by default', () => {
    useEditorStore
      .getState()
      .loadProjectConfig(structuredClone(DEFAULT_TEXTURE_CONFIG), { resetHistory: true });

    useEditorStore.getState().setPatternRows(7);
    useEditorStore.getState().setPatternColumns(5);
    useEditorStore.getState().setPatternType('venzowood_3');

    const { config } = useEditorStore.getState();

    expect(config.pattern.rows).toBe(1);
    expect(config.pattern.columns).toBe(1);
  });
});
