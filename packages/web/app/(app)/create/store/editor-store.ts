'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  TextureConfig,
  EditorTab,
  PatternType,
  ImageAdjustments,
  MaterialAssetRef,
  MaterialDefinition,
} from '@textura/shared';
import { getDefaultPatternConfig, getMaterialById, getPatternByType } from '@textura/shared';
import { isImpressPattern, isVitaComponentPattern, supportsEmbossPattern } from '../lib/pattern-capabilities';
import type { SheetPreviewPreset } from '../lib/production-metrics';
import { getCachedSvgPatternModule } from '../lib/svg-pattern-module-cache';

import { DEFAULT_TEXTURE_CONFIG } from './defaults';

// ======= History (Undo/Redo) =======

interface HistoryEntry {
  config: TextureConfig;
  label: string;
}

const MAX_HISTORY = 50;
const MIN_JOINT_SIZE = -500;
const MAX_JOINT_SIZE = 500;
const PATTERN_JOINT_DEFAULTS: Record<
  string,
  { horizontalSize: number; verticalSize: number; linkedDimensions: boolean }
> = {
  venzowood: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  rhombus_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  venzowood_2: {
    horizontalSize: 30,
    verticalSize: 30,
    linkedDimensions: true,
  },
  chequer_pattern: {
    horizontalSize: 15,
    verticalSize: 15,
    linkedDimensions: true,
  },
  concave_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  convex_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  ripple_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  venzowood_3: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  weave_pattern_2: {
    horizontalSize: 5,
    verticalSize: 5,
    linkedDimensions: true,
  },
  grate_pattern_2: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  chisel_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  matrix_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
  fibra_pattern: {
    horizontalSize: 0,
    verticalSize: 0,
    linkedDimensions: true,
  },
};
const DEFAULT_JOINT_SIZE = 5;
const DEFAULT_EMBOSS_STRENGTH = 100;
const SPECIAL_MODULE_DEFAULTS: Partial<Record<PatternType, { width: number; height: number }>> = {
  concave_pattern: {
    width: 500,
    height: 500,
  },
  convex_pattern: {
    width: 500,
    height: 500,
  },
  ripple_pattern: {
    width: 500,
    height: 500,
  },
  grate_pattern_2: {
    width: 400,
    height: 400,
  },
  boho_pattern: {
    width: 610,
    height: 610,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePatternColumns(patternType: PatternType, columns: number, maxColumns: number) {
  const safeColumns = Math.max(1, Math.min(maxColumns, Math.round(columns)));

  if (patternType !== 'herringbone') {
    return safeColumns;
  }

  if (safeColumns <= 1) {
    return 2;
  }

  return safeColumns % 2 === 0 ? safeColumns : Math.min(maxColumns, safeColumns + 1);
}

function applyPatternJointDefaults(config: TextureConfig, patternType: PatternType) {
  const isVita = isVitaComponentPattern(patternType);
  const isEngraving = ['vita_pattern_9', 'vita_pattern_21'].includes(patternType);
  const defaultSize = isVita && !isEngraving ? 5 : isVita ? 0 : DEFAULT_JOINT_SIZE;

  const jointDefaults = PATTERN_JOINT_DEFAULTS[patternType] ?? {
    horizontalSize: defaultSize,
    verticalSize: defaultSize,
    linkedDimensions: true,
  };

  config.joints.horizontalSize = jointDefaults.horizontalSize;
  config.joints.verticalSize = jointDefaults.verticalSize;
  config.joints.linkedDimensions = jointDefaults.linkedDimensions;
}


function getPatternModuleDefaults(patternType: PatternType) {
  const patternDefinition = getPatternByType(patternType);
  const cachedModule = getCachedSvgPatternModule(patternType);

  if (
    isVitaComponentPattern(patternType) &&
    cachedModule?.referenceTileWidth &&
    cachedModule.referenceTileHeight
  ) {
    const baseHeight =
      patternDefinition?.defaultUnitHeight ?? DEFAULT_TEXTURE_CONFIG.materials[0]!.height;
    const width =
      (baseHeight * cachedModule.referenceTileWidth) / Math.max(1, cachedModule.referenceTileHeight);

    return {
      width: roundMeasurement(width),
      height: baseHeight,
    };
  }

  return (
    SPECIAL_MODULE_DEFAULTS[patternType] ?? {
      width: patternDefinition?.defaultUnitWidth ?? DEFAULT_TEXTURE_CONFIG.materials[0]!.width,
      height: patternDefinition?.defaultUnitHeight ?? DEFAULT_TEXTURE_CONFIG.materials[0]!.height,
    }
  );
}

// ======= Store Interface =======

export interface EditorState {
  // Core config
  config: TextureConfig;

  // UI state
  activeTab: EditorTab;
  activeMaterialIndex: number;
  leftPanelOpen: boolean;
  zoom: number;
  showBorder: boolean;
  tileBackground: boolean;
  embossMode: boolean;
  embossStrength: number;
  embossIntensity: number;
  embossDepth: number;
  sheetPreviewPreset: SheetPreviewPreset;
  customSheetWidth: number;
  customSheetHeight: number;

  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Render trigger
  renderVersion: number;

  // ===== Actions =====

  // Pattern
  setPatternType: (type: PatternType) => void;
  setPatternRows: (rows: number) => void;
  setPatternColumns: (columns: number) => void;
  setPatternAngle: (angle: number) => void;

  // Material
  setMaterialColor: (color: string) => void;
  setMaterialById: (materialId: string) => void;
  setMaterialDefinition: (material: MaterialDefinition) => void;

  setMaterialWidth: (width: number) => void;
  setMaterialHeight: (height: number) => void;
  setMaterialSize: (width: number, height: number) => void;
  setMaterialMinWidth: (width: number) => void;
  setMaterialMinHeight: (height: number) => void;

  // Joints

  setJointMaterialAsset: (asset: MaterialAssetRef | null) => void;
  setJointHorizontalSize: (size: number) => void;
  setJointVerticalSize: (size: number) => void;
  setLinkedDimensions: (linked: boolean) => void;

  setJointAdjustment: (key: keyof ImageAdjustments, value: number | boolean) => void;

  // Output
  setOutputSize: (width: number, height: number) => void;
  setUnits: (units: 'mm' | 'inches') => void;
  loadProjectConfig: (
    config: TextureConfig,
    options?: { resetHistory?: boolean; label?: string },
  ) => void;
  resetProject: () => void;

  // UI
  setActiveTab: (tab: EditorTab) => void;
  setActiveMaterialIndex: (index: number) => void;
  toggleLeftPanel: () => void;
  setZoom: (zoom: number) => void;
  setShowBorder: (show: boolean) => void;
  setTileBackground: (show: boolean) => void;
  setEmbossMode: (value: boolean) => void;
  setEmbossStrength: (value: number) => void;
  setEmbossIntensity: (value: number) => void;
  setEmbossDepth: (value: number) => void;
  setSheetPreviewPreset: (preset: SheetPreviewPreset) => void;
  setCustomSheetWidth: (value: number) => void;
  setCustomSheetHeight: (value: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// ======= Helper: Push to undo stack =======

function pushHistory(state: EditorState, label: string) {
  state.undoStack.push({
    config: JSON.parse(JSON.stringify(state.config)),
    label,
  });
  if (state.undoStack.length > MAX_HISTORY) {
    state.undoStack.shift();
  }
  state.redoStack = [];
}

function bumpRender(state: EditorState) {
  state.renderVersion++;
}

function roundMeasurement(value: number) {
  return Math.round(value * 1000) / 1000;
}

function cloneMaterialSource(source: MaterialDefinition['source']) {
  return JSON.parse(JSON.stringify(source)) as MaterialDefinition['source'];
}

function applyMaterialLibrarySelection(
  mat: TextureConfig['materials'][number],
  definition: MaterialDefinition,
) {
  // Switching library material should only swap the underlying image source.
  // User-edited sizing, tint, edges, joints, and other overrides stay intact.
  mat.definitionId = definition.id;
  mat.source = cloneMaterialSource(definition.source);
}

function applyPatternSheetDefaults(s: EditorState) {
  const type = s.config.pattern.type;
  const preset = s.sheetPreviewPreset;
  const isLargeSheet = preset === '4x8' || preset === '4x10';

  if (!isLargeSheet) return;

  const mat = s.config.materials[s.activeMaterialIndex];
  if (!mat) return;

  if (type === 'venzowood' || type === 'rhombus_pattern') {
    const moduleDefaults = getPatternModuleDefaults(type);
    mat.width = moduleDefaults.width * 0.1;
    mat.height = moduleDefaults.height * 0.1;
    s.embossDepth = 25;
    s.config.joints.horizontalSize = 0;
    s.config.joints.verticalSize = 0;
    s.config.joints.linkedDimensions = true;
  } else if (type === 'venzowood_2') {
    const moduleDefaults = getPatternModuleDefaults(type);
    mat.width = moduleDefaults.width * 0.1;
    mat.height = moduleDefaults.height * 0.1;
    s.embossDepth = 15;
    s.config.joints.horizontalSize = 0;
    s.config.joints.verticalSize = 0;
    s.config.joints.linkedDimensions = true;
  } else if (type === 'venzowood_3') {
    // Venzowood 3's SVG module already contains its interlocking repeat cell.
    // Keep joints at zero so zooming/scaling does not overdrive the overlap.
    const moduleDefaults = getPatternModuleDefaults(type);
    mat.width = moduleDefaults.width;
    mat.height = moduleDefaults.height;
    s.embossDepth = 100;
    s.config.joints.horizontalSize = 0;
    s.config.joints.verticalSize = 0;
    s.config.joints.linkedDimensions = true;
  }
}

// ======= Store =======

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    // Initial state
    config: DEFAULT_TEXTURE_CONFIG,
    activeTab: 'texture',
    activeMaterialIndex: 0,
    leftPanelOpen: true,
    zoom: 1,
    showBorder: true,
    tileBackground: true,
    embossMode: supportsEmbossPattern(DEFAULT_TEXTURE_CONFIG.pattern.type),
    embossStrength: DEFAULT_EMBOSS_STRENGTH,
    embossIntensity: 100,
    embossDepth: 100,
    sheetPreviewPreset: 'none',
    customSheetWidth: 2440,
    customSheetHeight: 1220,
    undoStack: [],
    redoStack: [],
    renderVersion: 0,

    // ===== Pattern Actions =====

    setPatternType: (type) =>
      set((s) => {
        // --- Preserve previous state before applying pattern defaults ---
        const previousEffects = {
          embossStrength: s.embossStrength,
          embossIntensity: s.embossIntensity,
          embossDepth: s.embossDepth,
        };
        const previousJoints = {
          horizontalSize: s.config.joints.horizontalSize,
          verticalSize: s.config.joints.verticalSize,
          linkedDimensions: s.config.joints.linkedDimensions,
        };
        const prevPatternType = s.config.pattern.type;
        const isLargeSheet = s.sheetPreviewPreset === '4x8' || s.sheetPreviewPreset === '4x10';

        let prevExpectedHJoint = PATTERN_JOINT_DEFAULTS[prevPatternType]?.horizontalSize ?? DEFAULT_JOINT_SIZE;
        let prevExpectedVJoint = PATTERN_JOINT_DEFAULTS[prevPatternType]?.verticalSize ?? DEFAULT_JOINT_SIZE;

        if (isLargeSheet && (prevPatternType === 'venzowood' || prevPatternType === 'rhombus_pattern' || prevPatternType === 'venzowood_2' || prevPatternType === 'venzowood_3')) {
          prevExpectedHJoint = 0;
          prevExpectedVJoint = 0;
        }

        const userEditedJoints = previousJoints.horizontalSize !== prevExpectedHJoint || previousJoints.verticalSize !== prevExpectedVJoint;

        console.log('[Pattern Select] before effects', previousEffects);
        console.log('[Pattern Select] selected pattern preset', type);
        // --------------------------------------------------------------

        const nextPattern = getDefaultPatternConfig(type);
        if (!nextPattern) return;
        pushHistory(s, `Pattern → ${nextPattern.type}`);
        s.config.pattern = {
          ...s.config.pattern,
          ...nextPattern,
        };
        applyPatternJointDefaults(s.config, nextPattern.type);
        s.embossMode = supportsEmbossPattern(type);

        const definition = getPatternByType(type);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (definition && mat) {
          // Use pattern-specific module defaults on selection so the initial
          // preview matches the authored SVG/proportions instead of forcing
          // a generic fallback size.
          const moduleDefaults = getPatternModuleDefaults(type);
          mat.width = moduleDefaults.width;
          mat.height = moduleDefaults.height;
        }
        s.embossStrength = definition?.defaults?.embossStrength ?? 100;
        s.embossIntensity = definition?.defaults?.embossIntensity ?? 100;
        s.embossDepth = definition?.defaults?.embossDepth ?? 100;

        applyPatternSheetDefaults(s);

        // --- Restore user adjustments ---
        s.embossStrength = previousEffects.embossStrength;
        s.embossIntensity = previousEffects.embossIntensity;
        s.embossDepth = previousEffects.embossDepth;

        if (userEditedJoints) {
          s.config.joints.horizontalSize = previousJoints.horizontalSize;
          s.config.joints.verticalSize = previousJoints.verticalSize;
          s.config.joints.linkedDimensions = previousJoints.linkedDimensions;
        }

        console.log('[Pattern Select] after effects', {
          embossStrength: s.embossStrength,
          embossIntensity: s.embossIntensity,
          embossDepth: s.embossDepth,
        });
        // --------------------------------

        bumpRender(s);
      }),

    setPatternRows: (rows) =>
      set((s) => {
        pushHistory(s, `Rows → ${rows}`);
        const definition = getPatternByType(s.config.pattern.type);
        const max = definition?.parameterRanges?.rows?.max ?? 10;
        s.config.pattern.rows = Math.max(1, Math.min(max, Math.round(rows)));
        bumpRender(s);
      }),

    setPatternColumns: (columns) =>
      set((s) => {
        pushHistory(s, `Columns → ${columns}`);
        const definition = getPatternByType(s.config.pattern.type);
        const max = definition?.parameterRanges?.columns?.max ?? 10;
        const targetColumns = Math.max(1, Math.min(max, Math.round(columns)));
        s.config.pattern.columns = normalizePatternColumns(
          s.config.pattern.type,
          targetColumns,
          max,
        );
        bumpRender(s);
      }),

    setPatternAngle: (angle) =>
      set((s) => {
        pushHistory(s, `Angle → ${angle}°`);
        s.config.pattern.angle = Math.max(0, Math.min(70, Math.round(angle)));
        bumpRender(s);
      }),

    // ===== Material Actions =====

    setMaterialColor: (color) =>
      set((s) => {
        pushHistory(s, `Color → ${color}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.definitionId = null;
          mat.source = { type: 'solid', color };
        }
        bumpRender(s);
      }),

    setMaterialById: (materialId) =>
      set((s) => {
        const definition = getMaterialById(materialId);
        if (!definition) return;
        pushHistory(s, `Material → ${definition.name}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (!mat) return;
        applyMaterialLibrarySelection(mat, definition);
        bumpRender(s);
      }),

    setMaterialDefinition: (definition) =>
      set((s) => {
        pushHistory(s, `Material → ${definition.name}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (!mat) return;
        applyMaterialLibrarySelection(mat, definition);
        bumpRender(s);
      }),

    setMaterialWidth: (width) =>
      set((s) => {
        const mat = s.config.materials[s.activeMaterialIndex];
        const nextWidth = Math.max(1, width);
        if (mat && mat.width !== nextWidth) {
          pushHistory(s, `Width → ${nextWidth}`);
          mat.width = nextWidth;
          bumpRender(s);
        }
      }),

    setMaterialHeight: (height) =>
      set((s) => {
        const mat = s.config.materials[s.activeMaterialIndex];
        const nextHeight = Math.max(1, height);
        if (mat && mat.height !== nextHeight) {
          pushHistory(s, `Height → ${nextHeight}`);
          mat.height = nextHeight;
          bumpRender(s);
        }
      }),

    setMaterialSize: (width, height) =>
      set((s) => {
        const mat = s.config.materials[s.activeMaterialIndex];
        if (!mat) return;

        const nextWidth = Math.max(1, width);
        const nextHeight = Math.max(1, height);

        if (mat.width === nextWidth && mat.height === nextHeight) {
          return;
        }

        pushHistory(s, `Size → ${nextWidth} × ${nextHeight}`);
        mat.width = nextWidth;
        mat.height = nextHeight;
        bumpRender(s);
      }),

    setMaterialMinWidth: (width) =>
      set((s) => {
        pushHistory(s, `Min width → ${width}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.minWidth = Math.max(1, width);
          mat.width = Math.max(mat.width, mat.minWidth);
        }
        bumpRender(s);
      }),

    setMaterialMinHeight: (height) =>
      set((s) => {
        pushHistory(s, `Min height → ${height}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.minHeight = Math.max(1, height);
          mat.height = Math.max(mat.height, mat.minHeight);
        }
        bumpRender(s);
      }),

    // ===== Joint Actions =====

    setJointMaterialAsset: (asset) =>
      set((s) => {
        pushHistory(s, `Joint material → ${asset?.path ?? 'Solid Fill'}`);
        s.config.joints.materialSource = asset
          ? { type: 'image', asset, fallbackColor: '#e8e6e0' }
          : { type: 'solid', color: '#FFFFFF' };
        bumpRender(s);
      }),

    setJointHorizontalSize: (size) =>
      set((s) => {
        pushHistory(s, `H joint → ${size}`);
        const nextSize = clamp(size, MIN_JOINT_SIZE, MAX_JOINT_SIZE);
        s.config.joints.horizontalSize = nextSize;
        if (s.config.joints.linkedDimensions) {
          s.config.joints.verticalSize = nextSize;
        }
        bumpRender(s);
      }),

    setJointVerticalSize: (size) =>
      set((s) => {
        pushHistory(s, `V joint → ${size}`);
        const nextSize = clamp(size, MIN_JOINT_SIZE, MAX_JOINT_SIZE);
        s.config.joints.verticalSize = nextSize;
        if (s.config.joints.linkedDimensions) {
          s.config.joints.horizontalSize = nextSize;
        }
        bumpRender(s);
      }),

    setLinkedDimensions: (linked) =>
      set((s) => {
        pushHistory(s, `Linked joints → ${linked ? 'on' : 'off'}`);
        s.config.joints.linkedDimensions = linked;
        if (linked) {
          s.config.joints.verticalSize = s.config.joints.horizontalSize;
        }
        bumpRender(s);
      }),

    setJointAdjustment: (key, value) =>
      set((s) => {
        pushHistory(s, `Joint ${key} → ${String(value)}`);
        if (key === 'invertColors') {
          s.config.joints.adjustments.invertColors = Boolean(value);
        } else {
          const nextValue =
            key === 'hue' ? clamp(Number(value), -180, 180) : clamp(Number(value), -100, 100);
          s.config.joints.adjustments[key] = nextValue as never;
        }
        bumpRender(s);
      }),

    // ===== Output Actions =====

    setOutputSize: (width, height) =>
      set((s) => {
        pushHistory(s, `Output → ${width}×${height}`);
        s.config.output.widthPx = Math.max(100, Math.min(8192, width));
        s.config.output.heightPx = Math.max(100, Math.min(8192, height));
        bumpRender(s);
      }),

    setUnits: (units) =>
      set((s) => {
        if (s.config.units === units) return;
        pushHistory(s, `Units → ${units}`);
        const factor = units === 'inches' ? 1 / 25.4 : 25.4;
        s.config.units = units;
        for (const material of s.config.materials) {
          material.width = roundMeasurement(material.width * factor);
          material.height = roundMeasurement(material.height * factor);
          if (material.uploadWidth !== null) {
            material.uploadWidth = roundMeasurement(material.uploadWidth * factor);
          }
        }
        s.config.joints.horizontalSize = roundMeasurement(s.config.joints.horizontalSize * factor);
        s.config.joints.verticalSize = roundMeasurement(s.config.joints.verticalSize * factor);
        s.customSheetWidth = roundMeasurement(s.customSheetWidth * factor);
        s.customSheetHeight = roundMeasurement(s.customSheetHeight * factor);
        bumpRender(s);
      }),

    loadProjectConfig: (config, options) =>
      set((s) => {
        if (options?.resetHistory) {
          s.undoStack = [];
          s.redoStack = [];
        } else {
          pushHistory(s, options?.label ?? 'Load project');
        }

        s.config = JSON.parse(JSON.stringify(config)) as TextureConfig;
        s.embossMode = supportsEmbossPattern(config.pattern.type);
        bumpRender(s);
      }),

    resetProject: () =>
      set((s) => {
        pushHistory(s, 'Reset project');
        s.config = JSON.parse(JSON.stringify(DEFAULT_TEXTURE_CONFIG)) as TextureConfig;
        s.embossMode = supportsEmbossPattern(DEFAULT_TEXTURE_CONFIG.pattern.type);
        s.embossStrength = DEFAULT_EMBOSS_STRENGTH;
        s.embossIntensity = 100;
        s.embossDepth = 100;
        bumpRender(s);
      }),

    // ===== UI Actions =====

    setActiveTab: (tab) =>
      set((s) => {
        s.activeTab = tab;
      }),
    setActiveMaterialIndex: (index) =>
      set((s) => {
        s.activeMaterialIndex = index;
      }),
    toggleLeftPanel: () =>
      set((s) => {
        s.leftPanelOpen = !s.leftPanelOpen;
      }),
    setZoom: (zoom) =>
      set((s) => {
        s.zoom = Math.max(0.1, Math.min(5, zoom));
      }),
    setShowBorder: (show) =>
      set((s) => {
        s.showBorder = show;
        bumpRender(s);
      }),
    setTileBackground: (show) =>
      set((s) => {
        s.tileBackground = show;
        bumpRender(s);
      }),
    setEmbossMode: (value) =>
      set((s) => {
        s.embossMode = value;
        bumpRender(s);
      }),
    setEmbossStrength: (value) =>
      set((s) => {
        s.embossStrength = clamp(Math.round(value), 0, 100);
        bumpRender(s);
      }),
    setEmbossIntensity: (value) =>
      set((s) => {
        s.embossIntensity = clamp(Math.round(value), 0, 100);
        bumpRender(s);
      }),
    setEmbossDepth: (value) =>
      set((s) => {
        s.embossDepth = clamp(Math.round(value), 0, 100);
        bumpRender(s);
      }),
    setSheetPreviewPreset: (preset) =>
      set((s) => {
        s.sheetPreviewPreset = preset;
        applyPatternSheetDefaults(s);
        bumpRender(s);
      }),
    setCustomSheetWidth: (value) =>
      set((s) => {
        s.customSheetWidth = Math.max(1, value);
        bumpRender(s);
      }),
    setCustomSheetHeight: (value) =>
      set((s) => {
        s.customSheetHeight = Math.max(1, value);
        bumpRender(s);
      }),

    // ===== History =====

    undo: () =>
      set((s) => {
        const prev = s.undoStack.pop();
        if (prev) {
          s.redoStack.push({
            config: JSON.parse(JSON.stringify(s.config)),
            label: prev.label,
          });
          s.config = prev.config as TextureConfig;
          bumpRender(s);
        }
      }),

    redo: () =>
      set((s) => {
        const next = s.redoStack.pop();
        if (next) {
          s.undoStack.push({
            config: JSON.parse(JSON.stringify(s.config)),
            label: next.label,
          });
          s.config = next.config as TextureConfig;
          bumpRender(s);
        }
      }),

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,
  })),
);
