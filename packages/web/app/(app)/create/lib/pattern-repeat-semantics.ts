import { getPatternByType, type PatternType, type TextureConfig } from '@textura/shared';
import { SVG_PATTERN_MODULES, type SvgPatternModule } from '../engine/generated/svg-pattern-modules';

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

// Temporary A/B switch for Chevron parity work. Keep the procedural path intact
// until we decide whether the authored module is a better long-term match.
export const USE_SVG_CHEVRON_PARITY = true;

const PATTERN_LAYOUT_SOURCE: Record<string, PatternLayoutSource> = {
  none: 'procedural',
  running_bond: 'procedural',
  stack_bond: 'procedural',
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
    angleMeaning: 'Angle is not used by the stack pattern.',
    dimensionsMeaning: 'Width and height describe the visible brick size used by the stack-bond repeat.',
    semanticHint: 'Rows and columns count the visible stacked bricks shown inside the dashed frame.',
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
    rowsMeaning: 'Rows repeat one authored Flemish bond module vertically.',
    columnsMeaning: 'Columns repeat one authored Flemish bond module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived Flemish module.',
    dimensionsMeaning: 'Width and height describe the reference brick used to scale the authored Flemish module.',
    semanticHint:
      'Rows and columns count full Flemish repeat modules. Bleed bricks extend outside the frame for seamless tiling, but the dashed border still frames the canonical module repeat.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  herringbone: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored herringbone module vertically.',
    columnsMeaning: 'Columns repeat the authored herringbone module horizontally.',
    angleMeaning: 'Angle selects between the diagonal module-backed layout and the orthogonal procedural fallback.',
    dimensionsMeaning: 'Width and height size the reference piece that the module or orthogonal fallback scales from.',
    semanticHint: '45° uses the authored Architextures herringbone module; 90° falls back to an orthogonal procedural layout.',
    materialWidthLabel: 'Paver Width',
    materialHeightLabel: 'Paver Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  chevron: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat one chevron band module vertically.',
    columnsMeaning: 'Columns repeat one mirrored chevron pair module horizontally.',
    angleMeaning: 'Angle changes the mitre cut inside each chevron module without changing the repeat box.',
    dimensionsMeaning: 'Width defines the chevron pair span; height defines the repeat band height used by the bordered repeat box.',
    semanticHint:
      'Rows and columns count chevron repeat modules. Bleed pieces extend beyond the border for seamless clipping, but only the bordered repeat box drives preview framing and export size.',
    materialWidthLabel: 'Pair Width',
    materialHeightLabel: 'Band Height',
    rowFieldLabel: 'Rows',
    columnFieldLabel: 'Columns',
  },
  staggered: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored staggered module vertically.',
    columnsMeaning: 'Columns repeat the authored staggered module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived staggered module.',
    dimensionsMeaning: 'Width and height size the reference brick that the authored module scales from.',
    semanticHint: 'Rows and columns repeat the staggered module rather than directly counting visible tiles.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  ashlar: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored ashlar module vertically.',
    columnsMeaning: 'Columns repeat the authored ashlar module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived ashlar module.',
    dimensionsMeaning: 'Width and height define the reference stone size that the authored ashlar module scales from.',
    semanticHint: 'Rows and columns repeat a varied ashlar module whose stone proportions come from the authored geometry.',
    materialWidthLabel: 'Stone Width',
    materialHeightLabel: 'Stone Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  cubic: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored cubic illusion module vertically.',
    columnsMeaning: 'Columns repeat the authored cubic illusion module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the cubic SVG module.',
    dimensionsMeaning: 'Width and height define the reference rhombus size used to scale the authored module.',
    semanticHint: 'Rows and columns repeat a cube module, not a direct count of visible cube faces.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  hexagonal: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored hexagonal module vertically.',
    columnsMeaning: 'Columns repeat the authored hexagonal module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived hexagonal module.',
    dimensionsMeaning: 'Width and height define the reference hex tile size that the authored module scales from.',
    semanticHint: 'Rows and columns repeat a staggered hex module rather than counting each visible hex by eye.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  basketweave: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows count basket modules vertically.',
    columnsMeaning: 'Columns count basket modules horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the basketweave layout.',
    dimensionsMeaning: 'Width and height define the base brick used to assemble each basket.',
    semanticHint: 'Rows and columns count basket modules; weaves controls how many bricks are grouped in each basket direction.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  hopscotch: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored hopscotch paving module vertically.',
    columnsMeaning: 'Columns repeat the authored hopscotch paving module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the hopscotch SVG module.',
    dimensionsMeaning: 'Width and height size the reference tile that the module scales from.',
    semanticHint: 'Rows and columns repeat a multi-piece paving module, not a direct visible tile count.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  diamond: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored diamond module vertically.',
    columnsMeaning: 'Columns repeat the authored diamond module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the diamond SVG module.',
    dimensionsMeaning: 'Width and height scale the reference diamond unit.',
    semanticHint: 'Rows and columns repeat a diamond module, not the individual diamonds you can count by eye.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  intersecting_circle: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored circular lattice module vertically.',
    columnsMeaning: 'Columns repeat the authored circular lattice module horizontally.',
    angleMeaning: 'Angle is not currently meaningful for the circular SVG module.',
    dimensionsMeaning: 'Width and height scale the reference tile used by the circular lattice module.',
    semanticHint: 'Rows and columns repeat the circular lattice module rather than directly counting visible arcs.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  fishscale: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored fishscale module vertically.',
    columnsMeaning: 'Columns repeat the authored fishscale module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived fishscale module.',
    dimensionsMeaning: 'Width and height define the reference tile used to scale the authored fishscale module.',
    semanticHint: 'Rows and columns repeat the authored fishscale module; the module has an explicit half-height repeat.',
    materialWidthLabel: 'Tile Width',
    materialHeightLabel: 'Tile Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
  },
  french: {
    countMode: 'module-counts',
    rowsMeaning: 'Rows repeat the authored French bond module vertically.',
    columnsMeaning: 'Columns repeat the authored French bond module horizontally.',
    angleMeaning: 'Angle is not used by the Architextures-derived French module.',
    dimensionsMeaning: 'Width and height define the base brick size used to scale the French module.',
    semanticHint: 'Rows and columns repeat a French bond module rather than directly counting visible bricks.',
    materialWidthLabel: 'Brick Width',
    materialHeightLabel: 'Brick Height',
    rowFieldLabel: 'Module Rows',
    columnFieldLabel: 'Module Cols',
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

function getSvgModuleRepeatBox(config: TextureConfig, module: SvgPatternModule): PatternRepeatBox {
  const material = config.materials[0]!;
  const scale = Math.max(
    0.01,
    Math.min(material.width / Math.max(module.referenceTileWidth, 1), material.height / Math.max(module.referenceTileHeight, 1)),
  );

  return {
    repeatWidth: Math.max(1, config.pattern.columns) * (module.repeatWidth ?? module.viewBoxWidth) * scale,
    repeatHeight: Math.max(1, config.pattern.rows) * (module.repeatHeight ?? module.viewBoxHeight) * scale,
  };
}

function buildFallbackSemantics(type: PatternType): PatternRepeatSemantics {
  const pattern = getPatternByType(type);
  const countMode = pattern?.rowColMode === 'module' ? 'module-counts' : 'visible-counts';
  const rowFieldLabel = countMode === 'module-counts' ? 'Module Rows' : DEFAULT_LABELS.row;
  const columnFieldLabel = countMode === 'module-counts' ? 'Module Cols' : DEFAULT_LABELS.column;

  return {
    patternType: type,
    layoutSource: getPatternLayoutSource(type),
    countMode,
    rowsMeaning:
      countMode === 'module-counts'
        ? 'Rows repeat the authored pattern module vertically.'
        : 'Rows count visible repeats vertically.',
    columnsMeaning:
      countMode === 'module-counts'
        ? 'Columns repeat the authored pattern module horizontally.'
        : 'Columns count visible repeats horizontally.',
    angleMeaning:
      pattern && pattern.parameterRanges.angle.max > pattern.parameterRanges.angle.min
        ? 'Angle rotates or reorients the pattern where supported.'
        : 'Angle is not used.',
    dimensionsMeaning: 'Width and height define the base unit used by the pattern.',
    semanticHint:
      countMode === 'module-counts'
        ? 'Rows and columns repeat a module for this pattern.'
        : 'Rows and columns directly control the visible repeat count for this pattern.',
    materialWidthLabel: DEFAULT_LABELS.width,
    materialHeightLabel: DEFAULT_LABELS.height,
    rowFieldLabel,
    columnFieldLabel,
  };
}

export function getPatternLayoutSource(type: PatternType): PatternLayoutSource {
  if (type === 'chevron' && USE_SVG_CHEVRON_PARITY) {
    return 'svg-module';
  }

  return PATTERN_LAYOUT_SOURCE[type] ?? 'procedural';
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

  if (type === 'chevron') {
    return {
      ...semantics,
      angleMeaning: USE_SVG_CHEVRON_PARITY
        ? 'Angle stays visible for comparison, but it is currently cosmetic relative to the authored SVG Chevron module.'
        : 'Angle changes the procedural mitre cut. This fallback path is kept for parity comparison against the authored Chevron module.',
      semanticHint: USE_SVG_CHEVRON_PARITY
        ? 'Temporary A/B mode: Chevron is using the authored SVG module for parity comparison. Rows and columns size the authored repeat, while angle is still only an approximate comparison control.'
        : 'Temporary A/B mode: Chevron is using the procedural fallback. Rows and columns size the bordered repeat box while angle changes the procedural mitre geometry.',
    };
  }

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

  if (config.pattern.type === 'chevron' && !USE_SVG_CHEVRON_PARITY) {
    return {
      repeatWidth: Math.max(1, config.pattern.columns) * (material.width + config.joints.verticalSize),
      repeatHeight: Math.max(1, config.pattern.rows) * (material.height + config.joints.horizontalSize),
    };
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

  return {
    repeatWidth: canonical?.repeatWidth ?? layout.repeatWidth ?? layout.totalWidth,
    repeatHeight: canonical?.repeatHeight ?? layout.repeatHeight ?? layout.totalHeight,
    repeatOffsetX: layout.repeatOffsetX ?? 0,
    repeatOffsetY: layout.repeatOffsetY ?? 0,
    previewOutline: layout.previewOutline,
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
  return {
    width: Math.round(canonical?.repeatWidth ?? layout.repeatWidth ?? layout.totalWidth),
    height: Math.round(canonical?.repeatHeight ?? layout.repeatHeight ?? layout.totalHeight),
  };
}
