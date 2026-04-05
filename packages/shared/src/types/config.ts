// ======= Core Value Objects =======

/**
 * Complete texture configuration — source of truth for rendering.
 * Immutable per version. Stored as JSONB in project_versions.
 */
export interface TextureConfig {
  version: 1;
  seed: number;
  units: 'mm' | 'inches';

  pattern: PatternConfig;
  materials: MaterialConfig[];
  joints: JointsConfig;

  hatch: HatchConfig | null;
  surfaceProfile: string | null;
  surfaceFinish: string | null;

  output: {
    widthPx: number;
    heightPx: number;
  };
}

// ======= Pattern =======

export type PatternCategory =
  | 'brick_bond'
  | 'paving'
  | 'parquetry'
  | 'geometric'
  | 'organic'
  | 'random'
  | 'roofing';

export type PatternType = string;
export type PatternOrientation = 'horizontal' | 'vertical';

export interface PatternConfig {
  type: PatternType;
  category: PatternCategory;
  orientation: PatternOrientation;
  rows: number;
  columns: number;
  angle: number;
  stretchers: number;
  weaves: number;
}

// ======= Material =======

export interface MaterialAssetRef {
  path: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export type MaterialSource =
  | { type: 'library'; assetId: string }
  | { type: 'upload'; uploadId: string }
  | { type: 'solid'; color: string }
  | { type: 'image'; asset: MaterialAssetRef; fallbackColor: string }
  | { type: 'generated'; recipe: string; asset: MaterialAssetRef | null; fallbackColor: string };

export type SurfaceType = 'none' | 'vermiculated' | 'rough' | 'grooved' | 'voids';

export type EdgeStyle =
  | 'none'
  | 'fine'
  | 'handmade'
  | 'rough_brick'
  | 'long_brick'
  | 'rough'
  | 'uneven'
  | 'chamfer'
  | 'fillet'
  | 'cove'
  | 'standing_seam'
  | 'ogee'
  | 'waterfall'
  | 'double_bullnose'
  | 'wirecut'
  | 'recessed'
  | 'protruding'
  | 'rough_stone'
  | 'parged';

export type PlacementMode = 'random' | 'defined' | 'manual';

export interface MaterialConfig {
  id: string;
  definitionId: string | null;
  source: MaterialSource;
  uploadWidth: number | null;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;

  appearance: {
    lightIntensity: number;
    surface: SurfaceType;
    surfaceScale: number;
  };

  adjustments: ImageAdjustments;
  tint: string | null;

  edges: {
    style: EdgeStyle;
    perimeterScale: number;
    profileWidth: number;
    excludeSides: number[];
  };

  profile: string | null;
  finish: string | null;
  toneVariation: number;
  randomiseFillAngle: boolean;

  placement: {
    mode: PlacementMode;
    frequency: number;
    rules: PlacementRules | null;
  };

  pbr: PBRConfig;
}

// ======= Adjustments =======

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  hue: number;
  saturation: number;
  invertColors: boolean;
}

export interface ImageAdjustmentsWithOpacity extends ImageAdjustments {
  opacity: number;
}

// ======= Placement =======

export interface PlacementRules {
  rows: RuleSequence[];
  columns: RuleSequence[];
}

export interface RuleSequence {
  pattern: ('hit' | 'miss')[];
  shift: number;
}

// ======= PBR =======

export interface PBRMapConfig {
  geometry: boolean;
  edgeDepth: number;
  imageSource: 'none' | 'grayscale' | 'find_edges';
  adjustments: ImageAdjustmentsWithOpacity;
}

export interface PBRConfig {
  bump: PBRMapConfig;
  specular: PBRMapConfig;
  normal: PBRMapConfig;
  displacement: PBRMapConfig;
  roughness: PBRMapConfig & { baseRoughness: number };
  metalness: PBRMapConfig & { baseMetalness: number };
}

export type MapType = 'diffuse' | 'bump' | 'specular' | 'normal' | 'displacement' | 'roughness' | 'metalness';

// ======= Joints =======

export interface JointsConfig {
  materialSource: MaterialSource;
  tint: string | null;
  horizontalSize: number;
  verticalSize: number;
  linkedDimensions: boolean;
  recessJoints: boolean;
  concaveJoints: boolean;
  adjustments: ImageAdjustments;
}

// ======= Hatch =======

export type HatchFormat = 'autocad' | 'revit_model' | 'revit_drafting' | 'dxf' | 'svg' | 'png';

export interface HatchConfig {
  format: HatchFormat;
  expressJoints: boolean;
  depth: number;
}

// ======= Surface Definitions =======

export interface SurfaceProfile {
  id: string;
  name: string;
  repetitions: number;
  gradient: {
    start: string;
    end: string;
    size: number;
    angle: number;
    mode: 'linear' | 'radial';
  };
  targetMap: 'texture' | 'bump' | 'displacement' | 'bump_normal' | 'roughness' | 'metalness';
}

export interface SurfaceFinish {
  id: string;
  name: string;
  scale: number;
  textureUrl: string;
}

// ======= Rendering =======

export interface TilePlacement {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  materialIndex: number;
  clipPath: Float32Array | null;
  flipX: boolean;
  flipY: boolean;
}

export interface PatternOutput {
  tiles: TilePlacement[];
  totalWidth: number;
  totalHeight: number;
  seamlessPeriodX: number;
  seamlessPeriodY: number;
  jointSegments: JointSegment[];
}

export interface JointSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  isHorizontal: boolean;
}

// ======= Editor UI State (not persisted) =======

export type EditorTab =
  | 'texture'
  | 'bump'
  | 'specular'
  | 'hatch'
  | 'displacement'
  | 'normal'
  | 'roughness'
  | 'metalness'
  | '3d'
  | 'scene';

export type EditorSection = 'pattern' | 'material' | 'joints';

export interface EditorUIState {
  activeTab: EditorTab;
  activeMaterialIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeSection: EditorSection;
  colorPickerOpen: string | null;
  showBorder: boolean;
  tileBackground: boolean;
}

// ======= Render Worker Protocol =======
// Note: ImageBitmap and Blob are browser-only globals.
// We use generic placeholders here so the shared package compiles on both Node and browser.
// The web package narrows these to the actual browser types.

export type WorkerMessage =
  | { type: 'init'; wasmUrl: string }
  | { type: 'loadMaterial'; materialId: string; imageBitmap: unknown }
  | { type: 'render'; config: TextureConfig; width: number; height: number; mapType: MapType }
  | {
      type: 'exportLocal';
      config: TextureConfig;
      width: number;
      height: number;
      maps: MapType[];
      format: 'png' | 'jpg';
    };

export type WorkerResponse =
  | { type: 'initComplete' }
  | { type: 'materialLoaded'; materialId: string }
  | { type: 'renderComplete'; bitmap: unknown; renderTimeMs: number }
  | { type: 'exportComplete'; files: { name: string; blob: unknown }[] }
  | { type: 'progress'; percent: number }
  | { type: 'error'; message: string };

// ======= Export =======

export type ExportFormat = 'png' | 'jpg' | 'tiff' | 'exr';
export type ExportStatus = 'queued' | 'processing' | 'complete' | 'failed';
