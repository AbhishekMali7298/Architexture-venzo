import { describe, expect, it } from 'vitest';
import { getPatternSidebarSchema } from './pattern-sidebar-schema';

describe('pattern sidebar schema', () => {
  it('hides irrelevant controls for the none pattern', () => {
    const schema = getPatternSidebarSchema('none');
    expect(schema.fields).toHaveLength(0);
    expect(schema.materialWidthLabel).toBe('Field Width');
    expect(schema.materialHeightLabel).toBe('Field Height');
  });

  it('hides stretcher-specific controls for authored stretcher module parity', () => {
    const schema = getPatternSidebarSchema('stretcher_bond');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields.map((field) => field.id)).toEqual(['rows', 'columns']);
  });

  it('keeps common pattern rows and columns as visible counts', () => {
    const schema = getPatternSidebarSchema('running_bond');

    expect(schema.layoutSource).toBe('procedural');
    expect(schema.fields.find((field) => field.id === 'rows')?.label).toBe('Rows');
    expect(schema.fields.find((field) => field.id === 'columns')?.label).toBe('Columns');
    expect(schema.fields.map((field) => field.id)).toContain('stretchers');
    expect(schema.rowsMeaning).toContain('visible brick courses');
    expect(schema.columnsMeaning).toContain('visible brick slots');
  });

  it('treats stack bond rows and columns as visible counts', () => {
    const schema = getPatternSidebarSchema('stack_bond');

    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields.find((field) => field.id === 'rows')?.label).toBe('Rows');
    expect(schema.fields.find((field) => field.id === 'columns')?.label).toBe('Columns');
    expect(schema.fields.map((field) => field.id)).not.toContain('angle');
    expect(schema.rowsMeaning).toContain('visible stacked brick courses');
    expect(schema.columnsMeaning).toContain('visible stacked bricks');
  });

  it('keeps plain row and column labels for svg-module patterns', () => {
    const schema = getPatternSidebarSchema('cubic');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields[0]?.label).toBe('Rows');
    expect(schema.fields[1]?.label).toBe('Columns');
    expect(schema.rowsMeaning).toContain('2 visible rows');
    expect(schema.columnsMeaning).toContain('3 visible columns');
  });

  it('uses row/column controls only for authored basketweave module parity', () => {
    const schema = getPatternSidebarSchema('basketweave');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields.map((field) => field.id)).toEqual(['rows', 'columns']);
  });

  it('hides angle for module-backed patterns that do not use it', () => {
    const staggered = getPatternSidebarSchema('staggered');
    const french = getPatternSidebarSchema('french');

    expect(staggered.fields.map((field) => field.id)).not.toContain('angle');
    expect(french.fields.map((field) => field.id)).not.toContain('angle');
    expect(staggered.layoutSource).toBe('svg-module');
  });

  it('hides herringbone angle to keep create parity with the authored module', () => {
    const schema = getPatternSidebarSchema('herringbone');
    expect(schema.fields.map((field) => field.id)).not.toContain('angle');
  });

  it('describes chevron rows and columns as visible counts with authored module parity', () => {
    const schema = getPatternSidebarSchema('chevron');

    expect(schema.rowsMeaning).toContain('visible chevron bands');
    expect(schema.columnsMeaning).toContain('V-pair');
    expect(schema.fields.find((field) => field.id === 'rows')?.label).toBe('Rows');
    expect(schema.fields.find((field) => field.id === 'columns')?.label).toBe('Columns');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields.map((field) => field.id)).not.toContain('angle');
    expect(schema.angleMeaning).toContain('fixed');
  });
});
