'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  TextureConfig,
  EditorTab,
  PatternType,
  PatternCategory,
  EdgeStyle,
  MaterialDefinition,
} from '@textura/shared';
import { getMaterialById } from '@textura/shared';
import { DEFAULT_TEXTURE_CONFIG } from './defaults';

// ======= History (Undo/Redo) =======

interface HistoryEntry {
  config: TextureConfig;
  label: string;
}

const MAX_HISTORY = 50;

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

  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Render trigger
  renderVersion: number;

  // ===== Actions =====

  // Pattern
  setPatternType: (type: PatternType, category: PatternCategory) => void;
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
  setEdgeStyle: (style: EdgeStyle) => void;
  setToneVariation: (variation: number) => void;

  // Joints
  setJointTint: (tint: string | null) => void;
  setJointHorizontalSize: (size: number) => void;
  setJointVerticalSize: (size: number) => void;
  setLinkedDimensions: (linked: boolean) => void;

  // Output
  setOutputSize: (width: number, height: number) => void;
  setUnits: (units: 'mm' | 'inches') => void;
  loadProjectConfig: (config: TextureConfig, options?: { resetHistory?: boolean; label?: string }) => void;
  resetProject: () => void;

  // UI
  setActiveTab: (tab: EditorTab) => void;
  setActiveMaterialIndex: (index: number) => void;
  toggleLeftPanel: () => void;
  setZoom: (zoom: number) => void;

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
    undoStack: [],
    redoStack: [],
    renderVersion: 0,

    // ===== Pattern Actions =====

    setPatternType: (type, category) =>
      set((s) => {
        pushHistory(s, `Pattern → ${type}`);
        s.config.pattern.type = type;
        s.config.pattern.category = category;
        bumpRender(s);
      }),

    setPatternRows: (rows) =>
      set((s) => {
        pushHistory(s, `Rows → ${rows}`);
        s.config.pattern.rows = Math.max(1, Math.min(100, rows));
        bumpRender(s);
      }),

    setPatternColumns: (columns) =>
      set((s) => {
        pushHistory(s, `Columns → ${columns}`);
        s.config.pattern.columns = Math.max(1, Math.min(100, columns));
        bumpRender(s);
      }),

    setPatternAngle: (angle) =>
      set((s) => {
        pushHistory(s, `Angle → ${angle}°`);
        s.config.pattern.angle = ((angle % 360) + 360) % 360;
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
        mat.definitionId = definition.id;
        mat.source = definition.source;
        mat.width = definition.defaults.width;
        mat.height = definition.defaults.height;
        if (definition.metadata?.toneVariation !== undefined) {
          mat.toneVariation = definition.metadata.toneVariation;
        }
        bumpRender(s);
      }),

    setMaterialDefinition: (definition) =>
      set((s) => {
        pushHistory(s, `Material → ${definition.name}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (!mat) return;
        mat.definitionId = definition.id;
        mat.source = definition.source;
        mat.width = definition.defaults.width;
        mat.height = definition.defaults.height;
        if (definition.metadata?.toneVariation !== undefined) {
          mat.toneVariation = definition.metadata.toneVariation;
        }
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

    setEdgeStyle: (style) =>
      set((s) => {
        pushHistory(s, `Edges → ${style}`);
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.edges.style = style;
        }
        bumpRender(s);
      }),

    setToneVariation: (variation) =>
      set((s) => {
        const mat = s.config.materials[s.activeMaterialIndex];
        if (mat) {
          mat.toneVariation = Math.max(0, Math.min(100, variation));
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

    setJointHorizontalSize: (size) =>
      set((s) => {
        pushHistory(s, `H joint → ${size}`);
        s.config.joints.horizontalSize = Math.max(0, size);
        if (s.config.joints.linkedDimensions) {
          s.config.joints.verticalSize = Math.max(0, size);
        }
        bumpRender(s);
      }),

    setJointVerticalSize: (size) =>
      set((s) => {
        pushHistory(s, `V joint → ${size}`);
        s.config.joints.verticalSize = Math.max(0, size);
        if (s.config.joints.linkedDimensions) {
          s.config.joints.horizontalSize = Math.max(0, size);
        }
        bumpRender(s);
      }),

    setLinkedDimensions: (linked) =>
      set((s) => {
        s.config.joints.linkedDimensions = linked;
        if (linked) {
          s.config.joints.verticalSize = s.config.joints.horizontalSize;
        }
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
        s.config.units = units;
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

    setActiveTab: (tab) => set((s) => { s.activeTab = tab; }),
    setActiveMaterialIndex: (index) => set((s) => { s.activeMaterialIndex = index; }),
    toggleLeftPanel: () => set((s) => { s.leftPanelOpen = !s.leftPanelOpen; }),
    setZoom: (zoom) => set((s) => { s.zoom = Math.max(0.1, Math.min(5, zoom)); }),

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
