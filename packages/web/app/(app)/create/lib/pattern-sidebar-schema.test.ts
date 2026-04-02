import { describe, expect, it } from 'vitest';
import { USE_SVG_CHEVRON_PARITY } from './pattern-repeat-semantics';
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

  it('keeps common pattern rows and columns as visible counts', () => {
    const schema = getPatternSidebarSchema('running_bond');

    expect(schema.layoutSource).toBe('procedural');
    expect(schema.fields.find((field) => field.id === 'rows')?.label).toBe('Rows');
    expect(schema.fields.find((field) => field.id === 'columns')?.label).toBe('Columns');
    expect(schema.rowsMeaning).toContain('visible brick courses');
    expect(schema.columnsMeaning).toContain('visible brick slots');
  });

  it('treats stack bond rows and columns as visible counts', () => {
    const schema = getPatternSidebarSchema('stack_bond');

    expect(schema.layoutSource).toBe('procedural');
    expect(schema.fields.find((field) => field.id === 'rows')?.label).toBe('Rows');
    expect(schema.fields.find((field) => field.id === 'columns')?.label).toBe('Columns');
    expect(schema.fields.map((field) => field.id)).not.toContain('angle');
    expect(schema.rowsMeaning).toContain('visible stacked brick courses');
    expect(schema.columnsMeaning).toContain('visible stacked bricks');
  });

  it('uses module wording for svg-module patterns', () => {
    const schema = getPatternSidebarSchema('cubic');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields[0]?.label).toContain('Module');
  });

  it('surfaces weaves for basketweave', () => {
    const schema = getPatternSidebarSchema('basketweave');
    expect(schema.fields.map((field) => field.id)).toContain('weaves');
  });

  it('hides angle for module-backed patterns that do not use it', () => {
    const staggered = getPatternSidebarSchema('staggered');
    const french = getPatternSidebarSchema('french');

    expect(staggered.fields.map((field) => field.id)).not.toContain('angle');
    expect(french.fields.map((field) => field.id)).not.toContain('angle');
  });

  it('keeps herringbone angle visible because 90 degrees uses a fallback layout', () => {
    const schema = getPatternSidebarSchema('herringbone');
    expect(schema.fields.map((field) => field.id)).toContain('angle');
  });

  it('describes chevron rows and columns as repeat modules while keeping simple field labels', () => {
    const schema = getPatternSidebarSchema('chevron');

    expect(schema.rowsMeaning).toContain('repeat one chevron band module');
    expect(schema.columnsMeaning).toContain('mirrored chevron pair module');
    expect(schema.fields.find((field) => field.id === 'rows')?.label).toBe('Rows');
    expect(schema.fields.find((field) => field.id === 'columns')?.label).toBe('Columns');
    expect(schema.layoutSource).toBe(USE_SVG_CHEVRON_PARITY ? 'svg-module' : 'procedural');
    expect(schema.angleMeaning).toContain(USE_SVG_CHEVRON_PARITY ? 'cosmetic' : 'procedural');
  });
});
