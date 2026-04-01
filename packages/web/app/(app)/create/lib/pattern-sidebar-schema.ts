import { getPatternByType, type PatternDefinition, type PatternType } from '@textura/shared';

export type PatternLayoutSource = 'procedural' | 'svg-module';
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

const DEFAULT_DIMENSION_LABELS = {
  width: 'Unit Width',
  height: 'Unit Height',
} as const;

const PATTERN_LAYOUT_SOURCE: Record<string, PatternLayoutSource> = {
  none: 'procedural',
  running_bond: 'svg-module',
  stack_bond: 'svg-module',
  stretcher_bond: 'procedural',
  flemish_bond: 'svg-module',
  herringbone: 'svg-module',
  chevron: 'procedural',
  staggered: 'svg-module',
  ashlar: 'svg-module',
  cubic: 'svg-module',
  hexagonal: 'svg-module',
  basketweave: 'procedural',
  hopscotch: 'svg-module',
  diamond: 'svg-module',
  intersecting_circle: 'svg-module',
  fishscale: 'svg-module',
  french: 'svg-module',
};

const PATTERN_SCHEMA_OVERRIDES: Record<string, Omit<PatternSidebarSchema, 'patternType'>> = {
  none: {
    layoutSource: 'procedural',
    rowsMeaning: 'Not used. The pattern renders as a single uninterrupted field.',
    columnsMeaning: 'Not used. The pattern renders as a single uninterrupted field.',
    angleMeaning: 'Not meaningful for the none pattern.',
    dimensionsMeaning: 'Width and height define the exported field size.',
    semanticHint: 'This pattern has no repeat grid, so rows, columns, and angle are hidden.',
    materialWidthLabel: 'Field Width',
    materialHeightLabel: 'Field Height',
    materialHint: 'Defines the size of the uninterrupted field before export scaling.',
    fields: [],
  },
  running_bond: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored running-bond module vertically.',
    columnsMeaning: 'Columns repeat the authored running-bond module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived running-bond module.',
    dimensionsMeaning: 'Width and height describe the reference brick used to scale the authored module.',
    semanticHint: 'Rows and columns repeat one running-bond module; edge bleed is built into the module geometry.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  stack_bond: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored stack-bond module vertically.',
    columnsMeaning: 'Columns repeat the authored stack-bond module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived stack-bond module.',
    dimensionsMeaning: 'Width and height describe the reference brick used to scale the authored module.',
    semanticHint: 'The authored stack-bond module is one brick wide, so module counts still read like direct rows and columns.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Rows' },
      { id: 'columns', label: 'Columns' },
    ],
  },
  stretcher_bond: {
    layoutSource: 'procedural',
    rowsMeaning: 'Rows count visible brick courses inside the repeat.',
    columnsMeaning: 'Columns count visible brick slots before bleed tiles are clipped.',
    angleMeaning: 'Angle rotates each stretcher unit.',
    dimensionsMeaning: 'Width and height describe the stretcher brick size.',
    semanticHint: 'Rows and columns control the visible repeat; stretchers controls the offset cycle between courses.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Rows' },
      { id: 'columns', label: 'Columns' },
      { id: 'stretchers', label: 'Stretchers' },
      { id: 'angle', label: 'Angle', commitOnChange: true },
    ],
  },
  flemish_bond: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored Flemish bond module vertically.',
    columnsMeaning: 'Columns repeat the authored Flemish bond module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived Flemish module.',
    dimensionsMeaning: 'Width and height describe the reference brick used to scale the authored Flemish module.',
    semanticHint: 'Rows and columns repeat one Flemish module that already contains the stretcher and header mix with bleed.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  herringbone: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored herringbone module vertically.',
    columnsMeaning: 'Columns repeat the authored herringbone module horizontally.',
    angleMeaning: 'Angle selects between the diagonal module-backed layout and the orthogonal procedural fallback.',
    dimensionsMeaning: 'Width and height size the reference piece that the module or orthogonal fallback scales from.',
    semanticHint: '45° uses the authored Architextures herringbone module; 90° falls back to an orthogonal procedural layout.',
    materialWidthLabel: 'Paver Width',
    materialHeightLabel: 'Paver Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
      { id: 'angle', label: 'Angle', commitOnChange: true },
    ],
  },
  chevron: {
    layoutSource: 'procedural',
    rowsMeaning: 'Rows count visible chevron bands inside the repeat.',
    columnsMeaning: 'Columns count visible chevron pairs across the repeat.',
    angleMeaning: 'Angle changes the mitre angle of the chevron cut.',
    dimensionsMeaning: 'Width and height describe the chevron piece size before clipping.',
    semanticHint: 'Rows and columns control visible chevron pairs; angle changes the cut geometry.',
    materialWidthLabel: 'Piece Width',
    materialHeightLabel: 'Piece Height',
    fields: [
      { id: 'rows', label: 'Rows' },
      { id: 'columns', label: 'Columns' },
      { id: 'angle', label: 'Angle', commitOnChange: true },
    ],
  },
  staggered: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored staggered module vertically.',
    columnsMeaning: 'Columns repeat the authored staggered module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived staggered module.',
    dimensionsMeaning: 'Width and height size the reference brick that the authored module scales from.',
    semanticHint: 'Rows and columns repeat the staggered module rather than directly counting visible tiles.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  ashlar: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored ashlar module vertically.',
    columnsMeaning: 'Columns repeat the authored ashlar module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived ashlar module.',
    dimensionsMeaning: 'Width and height define the reference stone size that the authored ashlar module scales from.',
    semanticHint: 'Rows and columns repeat a varied ashlar module whose stone proportions come from the authored geometry.',
    materialWidthLabel: 'Stone Width',
    materialHeightLabel: 'Stone Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  cubic: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored cubic illusion module vertically.',
    columnsMeaning: 'Columns repeat the authored cubic illusion module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the cubic SVG module.',
    dimensionsMeaning: 'Width and height define the reference rhombus size used to scale the authored module.',
    semanticHint: 'Rows and columns repeat a cube module, not a direct count of visible cube faces.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  hexagonal: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored hexagonal module vertically.',
    columnsMeaning: 'Columns repeat the authored hexagonal module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived hexagonal module.',
    dimensionsMeaning: 'Width and height define the reference hex tile size that the authored module scales from.',
    semanticHint: 'Rows and columns repeat a staggered hex module rather than counting each visible hex by eye.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  basketweave: {
    layoutSource: 'procedural',
    rowsMeaning: 'Rows count basket modules vertically.',
    columnsMeaning: 'Columns count basket modules horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the basketweave layout.',
    dimensionsMeaning: 'Width and height define the base brick used to assemble each basket.',
    semanticHint: 'Rows and columns count basket modules; weaves controls how many bricks are grouped in each basket direction.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
      { id: 'weaves', label: 'Weaves' },
    ],
  },
  hopscotch: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored hopscotch paving module vertically.',
    columnsMeaning: 'Columns repeat the authored hopscotch paving module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the hopscotch SVG module.',
    dimensionsMeaning: 'Width and height size the reference tile that the module scales from.',
    semanticHint: 'Rows and columns repeat a multi-piece paving module, not a direct visible tile count.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  diamond: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored diamond module vertically.',
    columnsMeaning: 'Columns repeat the authored diamond module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the diamond SVG module.',
    dimensionsMeaning: 'Width and height scale the reference diamond unit.',
    semanticHint: 'Rows and columns repeat a diamond module, not the individual diamonds you can count by eye.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  intersecting_circle: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored circular lattice module vertically.',
    columnsMeaning: 'Columns repeat the authored circular lattice module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the circular SVG module.',
    dimensionsMeaning: 'Width and height scale the reference tile used by the circular lattice module.',
    semanticHint: 'Rows and columns repeat the circular lattice module rather than directly counting visible arcs.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  fishscale: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored fishscale module vertically.',
    columnsMeaning: 'Columns repeat the authored fishscale module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived fishscale module.',
    dimensionsMeaning: 'Width and height define the reference tile used to scale the authored fishscale module.',
    semanticHint: 'Rows and columns repeat the authored fishscale module; the module has an explicit half-height repeat.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
  french: {
    layoutSource: 'svg-module',
    rowsMeaning: 'Rows repeat the authored French bond module vertically.',
    columnsMeaning: 'Columns repeat the authored French bond module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived French module.',
    dimensionsMeaning: 'Width and height define the base brick size used to scale the French module.',
    semanticHint: 'Rows and columns repeat a French bond module rather than directly counting visible bricks.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    fields: [
      { id: 'rows', label: 'Module Rows' },
      { id: 'columns', label: 'Module Cols' },
    ],
  },
};

export function getPatternLayoutSource(type: PatternType): PatternLayoutSource {
  return PATTERN_LAYOUT_SOURCE[type] ?? 'procedural';
}

function buildFallbackSchema(pattern: PatternDefinition): PatternSidebarSchema {
  const canAdjustAngle = pattern.parameterRanges.angle.max > pattern.parameterRanges.angle.min;
  return {
    patternType: pattern.type,
    layoutSource: getPatternLayoutSource(pattern.type),
    rowsMeaning:
      pattern.rowColMode === 'module'
        ? 'Rows repeat the authored pattern module vertically.'
        : 'Rows count visible repeats vertically.',
    columnsMeaning:
      pattern.rowColMode === 'module'
        ? 'Columns repeat the authored pattern module horizontally.'
        : 'Columns count visible repeats horizontally.',
    angleMeaning: canAdjustAngle ? 'Angle rotates or reorients the pattern where supported.' : 'Angle is not used.',
    dimensionsMeaning: 'Width and height define the base unit used by the pattern.',
    semanticHint:
      pattern.rowColMode === 'module'
        ? 'Rows and columns repeat a module for this pattern.'
        : 'Rows and columns directly control the visible repeat count for this pattern.',
    materialWidthLabel: DEFAULT_DIMENSION_LABELS.width,
    materialHeightLabel: DEFAULT_DIMENSION_LABELS.height,
    fields: [
      { id: 'rows', label: pattern.rowColMode === 'module' ? 'Module Rows' : 'Rows' },
      { id: 'columns', label: pattern.rowColMode === 'module' ? 'Module Cols' : 'Columns' },
      ...(canAdjustAngle ? [{ id: 'angle', label: 'Angle', commitOnChange: true } satisfies PatternFieldSchema] : []),
    ],
  };
}

export function getPatternSidebarSchema(type: PatternType): PatternSidebarSchema {
  const pattern = getPatternByType(type);
  if (!pattern) {
    return {
      patternType: type,
      layoutSource: 'procedural',
      rowsMeaning: 'Rows count visible repeats vertically.',
      columnsMeaning: 'Columns count visible repeats horizontally.',
      angleMeaning: 'Angle rotates the pattern where supported.',
      dimensionsMeaning: 'Width and height define the base unit used by the pattern.',
      semanticHint: 'Rows and columns control the current repeat.',
      materialWidthLabel: DEFAULT_DIMENSION_LABELS.width,
      materialHeightLabel: DEFAULT_DIMENSION_LABELS.height,
      fields: [
        { id: 'rows', label: 'Rows' },
        { id: 'columns', label: 'Columns' },
        { id: 'angle', label: 'Angle', commitOnChange: true },
      ],
    };
  }

  const override = PATTERN_SCHEMA_OVERRIDES[type];
  if (override) {
    return {
      patternType: type,
      ...override,
    };
  }

  return buildFallbackSchema(pattern);
}
