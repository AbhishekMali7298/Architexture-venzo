import { getPatternByType, type PatternType, type TextureConfig } from '@textura/shared';
import { SVG_PATTERN_MODULES, type SvgPatternModule } from '../engine/generated/svg-pattern-modules';
import { orientDimensions, orientNormalizedOutline } from './pattern-orientation';

export type PatternLayoutSource = 'procedural' | 'svg-module';
export type PatternCountMode = 'visible-counts' | 'module-counts';

export interface PatternRepeatSemantics {
  patternType: PatternType;
  layoutSource: PatternLayoutSource;
  countMode: PatternCountMode;
  rowsMeaning: string;
  columnsMeaning: string;
  angleMeaning: string;
  dimensionsMeaning: string;
  semanticHint: string;
  materialWidthLabel: string;
  materialHeightLabel: string;
  rowFieldLabel: string;
  columnFieldLabel: string;
}

export interface PatternRepeatBox {
  repeatWidth: number;
  repeatHeight: number;
}

export interface PatternRepeatFrame extends PatternRepeatBox {
  repeatOffsetX: number;
  repeatOffsetY: number;
  previewOutline?: ReadonlyArray<{ x: number; y: number }>;
}

export interface PatternRepeatCounts {
  rows: number;
  columns: number;
}

export interface SvgModuleScale {
  scaleX: number;
  scaleY: number;
}

export function getChevronRepeatPitch(config: TextureConfig) {
  const material = config.materials[0]!;
  const clampedAngle = Math.max(0, Math.min(45, config.pattern.angle ?? 0));
  const angleRadians = (clampedAngle * Math.PI) / 180;
  const projectedJointHeight = (config.joints.horizontalSize * 2) / Math.max(Math.cos(angleRadians), 0.01);

  return {
    width: material.width + config.joints.verticalSize * 2,
    height: material.height + projectedJointHeight,
  };
}

const PATTERN_LAYOUT_SOURCE: Record<string, PatternLayoutSource> = {
  none: 'procedural',
  running_bond: 'procedural',
  stack_bond: 'procedural',
  stretcher_bond: 'procedural',
  flemish_bond: 'svg-module',
  herringbone: 'procedural',
  chevron: 'procedural',
  staggered: 'procedural',
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

const DEFAULT_LABELS = {
  width: 'Unit Width',
  height: 'Unit Height',
  row: 'Rows',
  column: 'Columns',
} as const;

const PATTERN_SEMANTICS_OVERRIDES: Partial<Record<PatternType, Omit<PatternRepeatSemantics, 'patternType' | 'layoutSource'>>> = {
  none: {
    countMode: 'module-counts',
    rowsMeaning: 'Not used. The pattern renders as a single uninterrupted field.',
    columnsMeaning: 'Not used. The pattern renders as a single uninterrupted field.',
    angleMeaning: 'Not meaningful for the none pattern.',
    dimensionsMeaning: 'Width and height define the exported field size.',
    semanticHint: 'This pattern has no repeat grid, so rows, columns, and angle are hidden.',
    materialWidthLabel: 'Field Width',
    materialHeightLabel: 'Field Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  running_bond: {
    countMode: 'visible-counts',
    rowsMeaning: 'Rows count visible brick courses inside the bordered repeat.',
    columnsMeaning: 'Columns count visible brick slots across the bordered repeat.',
    angleMeaning: 'Angle is not used by the common pattern.',
    dimensionsMeaning: 'Width and height describe the visible brick size used by the running-bond repeat.',
    semanticHint: 'Rows and columns count the visible running-bond bricks shown inside the dashed frame.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  stack_bond: {
    countMode: 'visible-counts',
    rowsMeaning: 'Rows count visible stacked brick courses inside the bordered repeat.',
    columnsMeaning: 'Columns count visible stacked bricks across the bordered repeat.',
    angleMeaning: 'Orientation can flip the stack between horizontal and vertical courses.',
    dimensionsMeaning: 'Width and height describe the visible brick size used by the stack-bond repeat.',
    semanticHint: 'Rows and columns count the visible stacked bricks shown inside the dashed frame. Use the orientation toggle to switch between horizontal and vertical stacking.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  stretcher_bond: {
    countMode: 'visible-counts',
    rowsMeaning: 'Rows count visible brick courses inside the repeat.',
    columnsMeaning: 'Columns count visible brick slots before bleed tiles are clipped.',
    angleMeaning: 'Angle rotates each stretcher unit.',
    dimensionsMeaning: 'Width and height describe the stretcher brick size.',
    semanticHint: 'Rows and columns control the visible repeat; stretchers controls the offset cycle between courses.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  flemish_bond: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored Flemish bond repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored Flemish bond repeat horizontally. Each repeat adds 2 visible columns.',
    angleMeaning: 'Angle is not used by the Architextures-derived Flemish module.',
    dimensionsMeaning: 'Width and height describe the reference brick used to scale the authored Flemish module.',
    semanticHint:
      'Rows and columns count full Flemish repeat modules. Bleed bricks extend outside the frame for seamless tiling, but the dashed border still frames the canonical module repeat.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  herringbone: {
    countMode: 'visible-counts',
    rowsMeaning: 'Rows count visible herringbone bands vertically inside the bordered repeat.',
    columnsMeaning: 'Columns count herringbone half-modules horizontally. Two columns form one full herringbone pair.',
    angleMeaning: 'Angle is fixed for herringbone in the create editor.',
    dimensionsMeaning: 'Width and height size the herringbone piece used by the procedural 45-degree layout.',
    semanticHint: 'Herringbone uses a fixed 45-degree procedural layout in the create editor for consistent row and column adaptation.',
    materialWidthLabel: 'Paver Width',
    materialHeightLabel: 'Paver Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  chevron: {
    countMode: 'visible-counts',
    rowsMeaning: 'Rows count visible chevron bands inside the bordered repeat.',
    columnsMeaning: 'Columns count visible chevron half-arms across the bordered repeat. Two columns form one full V-pair.',
    angleMeaning: 'Angle changes the chevron mitre geometry inside the rectangular repeat frame.',
    dimensionsMeaning: 'Width defines the chevron pair span; height defines the visible band height used by the bordered repeat box.',
    semanticHint:
      'Rows count horizontal chevron bands. Columns count individual angled half-arms inside the frame, where two columns make one full V-pair. Horizontal spacing is projected along the angled cuts so the frame height tracks the live Chevron geometry.',
    materialWidthLabel: 'Width',
    materialHeightLabel: 'Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  staggered: {
    countMode: 'visible-counts',
    rowsMeaning: 'Rows count visible staggered courses inside the bordered repeat.',
    columnsMeaning: 'Columns count visible brick slots across the bordered repeat.',
    angleMeaning: 'Angle is not used by the staggered layout.',
    dimensionsMeaning: 'Width and height define the staggered brick size used by the repeat box.',
    semanticHint: 'Rows and columns directly control the visible staggered repeat count.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  ashlar: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored ashlar repeat vertically. Each repeat adds 1 visible row.',
    columnsMeaning: 'Columns size the authored ashlar repeat horizontally. Each repeat adds 1 visible column.',
    angleMeaning: 'Angle is not used by the Architextures-derived ashlar module.',
    dimensionsMeaning: 'Width and height define the reference stone size that the authored ashlar module scales from.',
    semanticHint: 'Rows and columns repeat a varied ashlar module whose stone proportions come from the authored geometry.',
    materialWidthLabel: 'Stone Width',
    materialHeightLabel: 'Stone Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  cubic: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored cubic illusion repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored cubic illusion repeat horizontally. Each repeat adds 3 visible columns.',
    angleMeaning: 'Angle is not currently meaningful for the cubic SVG module.',
    dimensionsMeaning: 'Width and height define the reference rhombus size used to scale the authored module.',
    semanticHint: 'Rows and columns repeat a cube module, not a direct count of visible cube faces.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  hexagonal: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored hexagonal repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored hexagonal repeat horizontally. Each repeat adds 1 visible column.',
    angleMeaning: 'Angle is not used by the Architextures-derived hexagonal module.',
    dimensionsMeaning: 'Width and height define the reference hex tile size that the authored module scales from.',
    semanticHint: 'Rows and columns repeat a staggered hex module rather than counting each visible hex by eye.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  basketweave: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the basketweave repeat vertically. Each repeat adds 6 visible rows.',
    columnsMeaning: 'Columns size the basketweave repeat horizontally. Each repeat adds 6 visible columns.',
    angleMeaning: 'Angle is not currently meaningful for the basketweave layout.',
    dimensionsMeaning: 'Width and height define the base brick used to assemble each basket.',
    semanticHint: 'Rows and columns count basket modules; weaves controls how many bricks are grouped in each basket direction.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  hopscotch: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored hopscotch repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored hopscotch repeat horizontally. Each repeat adds 2 visible columns.',
    angleMeaning: 'Angle is not currently meaningful for the hopscotch SVG module.',
    dimensionsMeaning: 'Width and height size the reference tile that the module scales from.',
    semanticHint: 'Rows and columns repeat a multi-piece paving module, not a direct visible tile count.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  diamond: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored diamond repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored diamond repeat horizontally. Each repeat adds 1 visible column.',
    angleMeaning: 'Angle is not currently meaningful for the diamond SVG module.',
    dimensionsMeaning: 'Width and height scale the reference diamond unit.',
    semanticHint: 'Rows and columns repeat a diamond module, not the individual diamonds you can count by eye.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  intersecting_circle: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored circular lattice repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored circular lattice repeat horizontally. Each repeat adds 1 visible column.',
    angleMeaning: 'Angle is not currently meaningful for the circular SVG module.',
    dimensionsMeaning: 'Width and height scale the reference tile used by the circular lattice module.',
    semanticHint: 'Rows and columns repeat the circular lattice module rather than directly counting visible arcs.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  fishscale: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored fishscale repeat vertically. Each repeat adds 2 visible rows.',
    columnsMeaning: 'Columns size the authored fishscale repeat horizontally. Each repeat adds 1 visible column.',
    angleMeaning: 'Angle is not used by the Architextures-derived fishscale module.',
    dimensionsMeaning: 'Width and height define the reference tile used to scale the authored fishscale module.',
    semanticHint: 'Rows and columns repeat the authored fishscale module; the module has an explicit half-height repeat.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  french: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows size the authored French bond repeat vertically. Each repeat adds 3 visible rows.',
    columnsMeaning: 'Columns size the authored French bond repeat horizontally. Each repeat adds 3 visible columns.',
    angleMeaning: 'Angle is not used by the Architextures-derived French module.',
    dimensionsMeaning: 'Width and height define the base brick size used to scale the French module.',
    semanticHint: 'Rows and columns repeat a French bond module rather than directly counting visible bricks.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
};

function isUsableSvgModule(module: SvgPatternModule | undefined) {
  return Boolean(
    module &&
      Number.isFinite(module.referenceTileWidth) &&
      Number.isFinite(module.referenceTileHeight) &&
      module.referenceTileWidth > 1 &&
      module.referenceTileHeight > 1 &&
      module.viewBoxWidth > 0 &&
      module.viewBoxHeight > 0 &&
      (module.tiles.length > 0 || module.strokes.length > 0),
  );
}

export function getSvgModuleScale(config: TextureConfig, module: SvgPatternModule): SvgModuleScale {
  const material = config.materials[0]!;
  const repeatWidth = Math.max(module.repeatWidth ?? module.viewBoxWidth, 1);
  const repeatHeight = Math.max(module.repeatHeight ?? module.viewBoxHeight, 1);

  const uniformScale = Math.max(
    0.01,
    Math.min(material.width / Math.max(module.referenceTileWidth, 1), material.height / Math.max(module.referenceTileHeight, 1)),
  );

  return {
    scaleX: uniformScale,
    scaleY: uniformScale,
  };
}

function getSvgModuleRepeatBox(config: TextureConfig, module: SvgPatternModule): PatternRepeatBox {
  const repeatCounts = getPatternRepeatCounts(config);
  const { scaleX, scaleY } = getSvgModuleScale(config, module);

  return {
    repeatWidth: repeatCounts.columns * (module.repeatWidth ?? module.viewBoxWidth) * scaleX,
    repeatHeight: repeatCounts.rows * (module.repeatHeight ?? module.viewBoxHeight) * scaleY,
  };
}

function formatMultipleMeaning(axis: 'row' | 'column', multiple: number) {
  if (multiple <= 1) {
    return axis === 'row' ? 'Each repeat adds one visible row.' : 'Each repeat adds one visible column.';
  }

  return axis === 'row'
    ? `Each repeat adds ${multiple} visible rows.`
    : `Each repeat adds ${multiple} visible columns.`;
}

function buildFallbackSemantics(type: PatternType): PatternRepeatSemantics {
  const pattern = getPatternByType(type);
  const countMode = pattern?.rowColMode === 'module' ? 'module-counts' : 'visible-counts';
  const rowFieldLabel = DEFAULT_LABELS.row;
  const columnFieldLabel = DEFAULT_LABELS.column;
  const rowMultiple = Math.max(1, pattern?.rowMultiple ?? 1);
  const columnMultiple = Math.max(1, pattern?.columnMultiple ?? 1);

  return {
    patternType: type,
    layoutSource: getPatternLayoutSource(type),
    countMode,
    rowsMeaning:
      countMode === 'module-counts'
        ? `Rows size the authored pattern repeat vertically. ${formatMultipleMeaning('row', rowMultiple)}`
        : 'Rows count visible repeats vertically.',
    columnsMeaning:
      countMode === 'module-counts'
        ? `Columns size the authored pattern repeat horizontally. ${formatMultipleMeaning('column', columnMultiple)}`
        : 'Columns count visible repeats horizontally.',
    angleMeaning:
      pattern && pattern.parameterRanges.angle.max > pattern.parameterRanges.angle.min
        ? 'Angle rotates or reorients the pattern where supported.'
        : 'Angle is not used.',
    dimensionsMeaning: 'Width and height define the base unit used by the pattern.',
    semanticHint:
      countMode === 'module-counts'
        ? `Rows and columns size the repeat using the authored module geometry. One repeat covers ${rowMultiple} visible row${rowMultiple === 1 ? '' : 's'} by ${columnMultiple} visible column${columnMultiple === 1 ? '' : 's'}.`
        : 'Rows and columns directly control the visible repeat count for this pattern.',
    materialWidthLabel: DEFAULT_LABELS.width,
    materialHeightLabel: DEFAULT_LABELS.height,
    rowFieldLabel,
    columnFieldLabel,
  };
}

export function getPatternLayoutSource(type: PatternType): PatternLayoutSource {
  return PATTERN_LAYOUT_SOURCE[type] ?? 'procedural';
}

export function getPatternRepeatCounts(config: TextureConfig): PatternRepeatCounts {
  const pattern = getPatternByType(config.pattern.type);
  if (pattern?.rowColMode !== 'module') {
    return {
      rows: Math.max(1, config.pattern.rows),
      columns: Math.max(1, config.pattern.columns),
    };
  }

  const rowMultiple = Math.max(1, pattern?.rowMultiple ?? 1);
  const columnMultiple = Math.max(1, pattern?.columnMultiple ?? 1);

  return {
    rows: Math.max(1, Math.ceil(config.pattern.rows / rowMultiple)),
    columns: Math.max(1, Math.ceil(config.pattern.columns / columnMultiple)),
  };
}

export function getPatternRepeatSemantics(type: PatternType): PatternRepeatSemantics {
  const override = PATTERN_SEMANTICS_OVERRIDES[type];
  if (!override) {
    return buildFallbackSemantics(type);
  }

  const semantics: PatternRepeatSemantics = {
    patternType: type,
    layoutSource: getPatternLayoutSource(type),
    ...override,
  };
  return semantics;
}

export function getCanonicalPatternRepeatBox(config: TextureConfig): PatternRepeatBox | null {
  const material = config.materials[0]!;

  if (config.pattern.type === 'none') {
    return {
      repeatWidth: material.width,
      repeatHeight: material.height,
    };
  }

  if (config.pattern.type === 'herringbone') {
    const normalizedAngle = ((config.pattern.angle % 180) + 180) % 180;
    if (Math.abs(normalizedAngle - 90) < 0.001) {
      return null;
    }
  }

  const module = SVG_PATTERN_MODULES[config.pattern.type];
  if (getPatternLayoutSource(config.pattern.type) === 'svg-module' && isUsableSvgModule(module)) {
    return getSvgModuleRepeatBox(config, module);
  }

  return null;
}

export function resolvePatternRepeatFrame(
  config: TextureConfig,
  layout: {
    totalWidth: number;
    totalHeight: number;
    repeatWidth?: number;
    repeatHeight?: number;
    repeatOffsetX?: number;
    repeatOffsetY?: number;
    previewOutline?: ReadonlyArray<{ x: number; y: number }>;
  },
): PatternRepeatFrame {
  const canonical = getCanonicalPatternRepeatBox(config);
  const rawWidth = canonical?.repeatWidth ?? layout.repeatWidth ?? layout.totalWidth;
  const rawHeight = canonical?.repeatHeight ?? layout.repeatHeight ?? layout.totalHeight;
  const oriented = orientDimensions(rawWidth, rawHeight, config.pattern.orientation);

  return {
    repeatWidth: oriented.width,
    repeatHeight: oriented.height,
    repeatOffsetX: layout.repeatOffsetX ?? 0,
    repeatOffsetY: layout.repeatOffsetY ?? 0,
    previewOutline: orientNormalizedOutline(layout.previewOutline, config.pattern.orientation),
  };
}

export function getPatternDimensionsHintSize(
  config: TextureConfig,
  layout: {
    totalWidth: number;
    totalHeight: number;
    repeatWidth?: number;
    repeatHeight?: number;
  },
) {
  const canonical = getCanonicalPatternRepeatBox(config);
  const rawWidth = canonical?.repeatWidth ?? layout.repeatWidth ?? layout.totalWidth;
  const rawHeight = canonical?.repeatHeight ?? layout.repeatHeight ?? layout.totalHeight;
  const oriented = orientDimensions(rawWidth, rawHeight, config.pattern.orientation);
  return {
    width: Math.round(oriented.width),
    height: Math.round(oriented.height),
  };
}
