'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  TextureConfig,
  EditorTab,
  PatternType,
  EdgeStyle,
  ImageAdjustments,
  MaterialAssetRef,
  MaterialDefinition,
} from '@textura/shared';
import { getDefaultPatternConfig, getMaterialById } from '@textura/shared';
import { getDefaultEdgeScale, getDefaultEdgeWidth, isPresetEdgeStyle } from '../lib/handmade-edge';
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
  PatternType,
  { horizontalSize: number; verticalSize: number; linkedDimensions: boolean }
> = {
  venzowood_3: {
    horizontalSize: -30,
    verticalSize: -120,
    linkedDimensions: false,
  },
};
const DEFAULT_JOINT_SIZE = 5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePatternColumns(patternType: PatternType, columns: number) {
  const safeColumns = Math.max(1, Math.min(50, Math.round(columns)));

  if (patternType !== 'herringbone') {
    return safeColumns;
  }

  if (safeColumns <= 1) {
    return 2;
  }

  return safeColumns % 2 === 0 ? safeColumns : Math.min(50, safeColumns + 1);
}

function applyPatternJointDefaults(config: TextureConfig, patternType: PatternType) {
  const jointDefaults = PATTERN_JOINT_DEFAULTS[patternType] ?? {
    horizontalSize: DEFAULT_JOINT_SIZE,
    verticalSize: DEFAULT_JOINT_SIZE,
    linkedDimensions: true,
  };

  config.joints.horizontalSize = jointDefaults.horizontalSize;
  config.joints.verticalSize = jointDefaults.verticalSize;
  config.joints.linkedDimensions = jointDefaults.linkedDimensions;
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
  setMaterialTint: (tint: string | null) => void;
  setMaterialWidth: (width: number) => void;
  setMaterialHeight: (height: number) => void;
  setMaterialMinWidth: (width: number) => void;
  setMaterialMinHeight: (height: number) => void;
  setEdgeStyle: (style: EdgeStyle) => void;
  setEdgePerimeterScale: (scale: number) => void;
  setEdgeProfileWidth: (width: number) => void;
  setToneVariation: (variation: number) => void;

  // Joints
  setJointTint: (tint: string | null) => void;
  setJointMaterialAsset: (asset: MaterialAssetRef | null) => void;
  setJointHorizontalSize: (size: number) => void;
  setJointVerticalSize: (size: number) => void;
  setLinkedDimensions: (linked: boolean) => void;
  setRecessJoints: (value: boolean) => void;
  setConcaveJoints: (value: boolean) => void;
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
  mat.toneVariation = 0;
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
    embossMode: false,
    undoStack: [],
    redoStack: [],
    renderVersion: 0,

    // ===== Pattern Actions =====

    setPatternType: (type) =>
      set((s) => {
        const nextPattern = getDefaultPatternConfig(type);
        if (!nextPattern) return;
        pushHistory(s, `Pattern → ${nextPattern.type}`);
        s.config.pattern = {
          ...s.config.pattern,
          ...nextPattern,
        };
        applyPatternJointDefaults(s.config, nextPattern.type);
        bumpRender(s);
      }),

    setPatternRows: (rows) =>
      set((s) => {
        pushHistory(s, `Rows → ${rows}`);
        s.config.pattern.rows = Math.max(1, Math.min(50, Math.round(rows)));
        bumpRender(s);
      }),

    setPatternColumns: (columns) =>
      set((s) => {
        pushHistory(s, `Columns → ${columns}`);
        s.config.pattern.columns = normalizePatternColumns(s.config.pattern.type, columns);
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

    setMaterialTint: (tint) =>
      set((s) => {
        pushHistory(s, `Tint → ${tint ?? 'none'}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.tint = tint;
        }
        bumpRender(s);
      }),

    setMaterialWidth: (width) =>
      set((s) => {
        pushHistory(s, `Width → ${width}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.width = Math.max(1, width);
        }
        bumpRender(s);
      }),

    setMaterialHeight: (height) =>
      set((s) => {
        pushHistory(s, `Height → ${height}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.height = Math.max(1, height);
        }
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

    setEdgeStyle: (style) =>
      set((s) => {
        pushHistory(s, `Edges → ${style}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.edges.style = style;
          if (isPresetEdgeStyle(style)) {
            mat.edges.profileWidth = getDefaultEdgeWidth(style);
            mat.edges.perimeterScale = getDefaultEdgeScale(style);
          }
        }
        bumpRender(s);
      }),

    setEdgePerimeterScale: (scale) =>
      set((s) => {
        pushHistory(s, `Edge scale → ${scale}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.edges.perimeterScale = isPresetEdgeStyle(mat.edges.style)
            ? clamp(scale, 0.25, 4)
            : clamp(scale, 0, 100);
        }
        bumpRender(s);
      }),

    setEdgeProfileWidth: (width) =>
      set((s) => {
        pushHistory(s, `Edge width → ${width}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.edges.profileWidth = isPresetEdgeStyle(mat.edges.style)
            ? getDefaultEdgeWidth(mat.edges.style)
            : clamp(width, 0, 100);
        }
        bumpRender(s);
      }),

    setToneVariation: (variation) =>
      set((s) => {
        pushHistory(s, `Tone variation → ${variation}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.toneVariation = clamp(variation, 0, 100);
        }
        bumpRender(s);
      }),

    // ===== Joint Actions =====

    setJointTint: (tint) =>
      set((s) => {
        pushHistory(s, `Joint tint → ${tint ?? 'none'}`);
        s.config.joints.tint = tint;
        bumpRender(s);
      }),

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

    setRecessJoints: (value) =>
      set((s) => {
        pushHistory(s, `Recess joints → ${value ? 'on' : 'off'}`);
        s.config.joints.recessJoints = value;
        bumpRender(s);
      }),

    setConcaveJoints: (value) =>
      set((s) => {
        pushHistory(s, `Concave joints → ${value ? 'on' : 'off'}`);
        s.config.joints.concaveJoints = value;
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
        bumpRender(s);
      }),

    resetProject: () =>
      set((s) => {
        pushHistory(s, 'Reset project');
        s.config = JSON.parse(JSON.stringify(DEFAULT_TEXTURE_CONFIG)) as TextureConfig;
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
