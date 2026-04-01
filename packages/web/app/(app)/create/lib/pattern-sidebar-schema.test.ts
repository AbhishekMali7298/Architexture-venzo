import { describe, expect, it } from 'vitest';
import { getPatternSidebarSchema } from './pattern-sidebar-schema';

describe('pattern sidebar schema', () => {
  it('hides irrelevant controls for the none pattern', () => {
    const schema = getPatternSidebarSchema('none');
    expect(schema.fields).toHaveLength(0);
    expect(schema.materialWidthLabel).toBe('Field Width');
    expect(schema.materialHeightLabel).toBe('Field Height');
  });

  it('shows stretchers for stretcher bond', () => {
    const schema = getPatternSidebarSchema('stretcher_bond');
    expect(schema.fields.map((field) => field.id)).toContain('stretchers');
  });

  it('uses module wording for svg-module patterns', () => {
    const schema = getPatternSidebarSchema('cubic');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields[0]?.label).toContain('Module');
  });

  it('keeps basketweave scoped to supported controls only', () => {
    const schema = getPatternSidebarSchema('basketweave');
    expect(schema.fields.map((field) => field.id)).not.toContain('weaves');
  });
});
