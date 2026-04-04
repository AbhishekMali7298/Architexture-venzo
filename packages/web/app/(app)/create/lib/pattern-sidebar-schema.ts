import { getPatternByType, type PatternType } from '@textura/shared';
import {
  getPatternLayoutSource,
  getPatternRepeatSemantics,
  type PatternLayoutSource,
} from './pattern-repeat-semantics';

export type PatternFieldId = 'rows' | 'columns' | 'angle' | 'stretchers' | 'weaves';

export interface PatternFieldSchema {
  id: PatternFieldId;
  label: string;
  semanticLabel?: string;
  commitOnChange?: boolean;
}

export interface PatternSidebarSchema {
  patternType: PatternType;
  layoutSource: PatternLayoutSource;
  rowsMeaning: string;
  columnsMeaning: string;
  angleMeaning: string;
  dimensionsMeaning: string;
  semanticHint: string;
  materialWidthLabel: string;
  materialHeightLabel: string;
  materialHint?: string;
  fields: PatternFieldSchema[];
}

function buildBaseFields(type: PatternType, rowLabel: string, columnLabel: string) {
  if (type === 'none') {
    return [];
  }

  const pattern = getPatternByType(type);
  const canAdjustAngle = Boolean(pattern && pattern.parameterRanges.angle.max > pattern.parameterRanges.angle.min);
  const supportsStretchers = Boolean(pattern?.parameterRanges.stretchers);
  const supportsWeaves = Boolean(pattern?.parameterRanges.weaves);

  return [
    { id: 'rows', label: rowLabel } satisfies PatternFieldSchema,
    { id: 'columns', label: columnLabel } satisfies PatternFieldSchema,
    ...(canAdjustAngle ? [{ id: 'angle', label: 'Angle', commitOnChange: true } satisfies PatternFieldSchema] : []),
    ...(supportsStretchers ? [{ id: 'stretchers', label: 'Stretchers' } satisfies PatternFieldSchema] : []),
    ...(supportsWeaves ? [{ id: 'weaves', label: 'Weaves' } satisfies PatternFieldSchema] : []),
  ] satisfies PatternFieldSchema[];
}

export function getPatternSidebarSchema(type: PatternType): PatternSidebarSchema {
  const semantics = getPatternRepeatSemantics(type);

  return {
    patternType: type,
    layoutSource: getPatternLayoutSource(type),
    rowsMeaning: semantics.rowsMeaning,
    columnsMeaning: semantics.columnsMeaning,
    angleMeaning: semantics.angleMeaning,
    dimensionsMeaning: semantics.dimensionsMeaning,
    semanticHint: semantics.semanticHint,
    materialWidthLabel: semantics.materialWidthLabel,
    materialHeightLabel: semantics.materialHeightLabel,
    fields: buildBaseFields(type, semantics.rowFieldLabel, semantics.columnFieldLabel),
  };
}

export { getPatternLayoutSource };
