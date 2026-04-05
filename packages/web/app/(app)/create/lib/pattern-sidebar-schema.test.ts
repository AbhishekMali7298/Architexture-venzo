import { describe, expect, it } from 'vitest';
import { PATTERN_CATALOG } from '@textura/shared';
import { getPatternSidebarSchema } from './pattern-sidebar-schema';

describe('pattern sidebar schema', () => {
  it('uses the expected layout source for every repeatable pattern', () => {
    const nonNonePatterns = PATTERN_CATALOG.filter((pattern) => pattern.type !== 'none');

    for (const pattern of nonNonePatterns) {
      const proceduralTypes = new Set(['chevron', 'running_bond', 'stack_bond', 'stretcher_bond', 'flemish_bond']);
      const expectedLayoutSource = proceduralTypes.has(pattern.type) ? 'procedural' : 'svg-module';
      expect(getPatternSidebarSchema(pattern.type).layoutSource).toBe(expectedLayoutSource);
    }
  });

  it('hides irrelevant controls for the none pattern', () => {
    const schema = getPatternSidebarSchema('none');
    expect(schema.fields).toHaveLength(0);
    expect(schema.materialWidthLabel).toBe('Field Width');
    expect(schema.materialHeightLabel).toBe('Field Height');
  });

  it('shows stretchers only for the Common pattern', () => {
    const common = getPatternSidebarSchema('running_bond');
    const stretcher = getPatternSidebarSchema('stretcher_bond');

    expect(common.layoutSource).toBe('procedural');
    expect(common.fields.map((field) => field.id)).toContain('stretchers');
    expect(stretcher.fields.map((field) => field.id)).not.toContain('stretchers');
  });

  it('hides angle for stretcher pattern to match competitor sidebar behavior', () => {
    const stretcher = getPatternSidebarSchema('stretcher_bond');
    expect(stretcher.fields.map((field) => field.id)).not.toContain('angle');
    expect(stretcher.fields.map((field) => field.id)).not.toContain('stretchers');
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

    expect(schema.layoutSource).toBe('procedural');
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
    expect(schema.singleDimensionInput).toBe(true);
  });

  it('shows weaves for basketweave pattern controls', () => {
    const schema = getPatternSidebarSchema('basketweave');
    expect(schema.layoutSource).toBe('svg-module');
    expect(schema.fields.map((field) => field.id)).toContain('weaves');
    expect(schema.singleDimensionInput).toBe(true);
  });

  it('shows ashlar min-dimension controls', () => {
    const schema = getPatternSidebarSchema('ashlar');
    expect(schema.showMinDimensions).toBe(true);
  });

  it('uses diameter label for circular-derived modules', () => {
    const circular = getPatternSidebarSchema('intersecting_circle');
    const fishscale = getPatternSidebarSchema('fishscale');

    expect(circular.materialWidthLabel).toBe('Diameter');
    expect(fishscale.materialWidthLabel).toBe('Diameter');
    expect(circular.singleDimensionInput).toBe(true);
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
    expect(schema.layoutSource).toBe('procedural');
    expect(schema.fields.map((field) => field.id)).toContain('angle');
  });
});
