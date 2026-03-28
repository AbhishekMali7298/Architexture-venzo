'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMaterialById, getMaterialCategory } from '@textura/shared';
import { BackgroundCanvas } from './components/background-canvas';
import styles from './components/create-editor.module.css';
import { CreateEditorShell } from './components/create-editor-shell';
import { MaterialPickerModal } from './components/material-picker-modal';
import { MaterialSettingsSection } from './components/material-settings-section';
import { PatternPickerModal } from './components/pattern-picker-modal';
import { PatternSettingsSection } from './components/pattern-settings-section';
import { getMaterialRenderableColor, getMaterialThumbnailUrl } from './lib/material-assets';
import {
  exportAlbedoPng,
  exportBumpPlaceholderPng,
  exportPreviewPng,
  exportProjectJson,
  exportRoughnessPlaceholderPng,
} from './lib/project-export';
import { formatSavedAt, loadProjectFromStorage, saveProjectToStorage } from './lib/project-storage';
import { useEditorStore } from './store/editor-store';

export default function CreatePage() {
  const config = useEditorStore((state) => state.config);
  const activeTab = useEditorStore((state) => state.activeTab);
  const setActiveTab = useEditorStore((state) => state.setActiveTab);
  const setPatternType = useEditorStore((state) => state.setPatternType);
  const setPatternRows = useEditorStore((state) => state.setPatternRows);
  const setPatternColumns = useEditorStore((state) => state.setPatternColumns);
  const setPatternAngle = useEditorStore((state) => state.setPatternAngle);
  const setMaterialById = useEditorStore((state) => state.setMaterialById);
  const setMaterialWidth = useEditorStore((state) => state.setMaterialWidth);
  const setMaterialHeight = useEditorStore((state) => state.setMaterialHeight);
  const setEdgeStyle = useEditorStore((state) => state.setEdgeStyle);
  const setToneVariation = useEditorStore((state) => state.setToneVariation);
  const setJointHorizontalSize = useEditorStore((state) => state.setJointHorizontalSize);
  const setJointVerticalSize = useEditorStore((state) => state.setJointVerticalSize);
  const setUnits = useEditorStore((state) => state.setUnits);
  const loadProjectConfig = useEditorStore((state) => state.loadProjectConfig);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.undoStack.length > 0);
  const canRedo = useEditorStore((state) => state.redoStack.length > 0);

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [footerStatus, setFooterStatus] = useState('Local save and export are ready.');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingMaps, setIsExportingMaps] = useState(false);

  const material = config.materials[0]!;

  useEffect(() => {
    const savedProject = loadProjectFromStorage();
    if (!savedProject) return;

    loadProjectConfig(savedProject.config, { resetHistory: true, label: 'Restore saved project' });
    setLastSavedAt(savedProject.savedAt);
    setFooterStatus(`Restored local project from ${formatSavedAt(savedProject.savedAt)}.`);
  }, [loadProjectConfig]);

  const selectedMaterial = useMemo(() => {
    if (!material.definitionId) return null;
    return getMaterialById(material.definitionId) ?? null;
  }, [material.definitionId]);

  const materialCategory = selectedMaterial
    ? getMaterialCategory(selectedMaterial.categoryId)?.displayName ?? selectedMaterial.categoryId
    : 'Custom material';

  const materialThumbnailUrl = getMaterialThumbnailUrl(selectedMaterial);
  const materialColor = getMaterialRenderableColor(material.source, selectedMaterial?.swatchColor ?? '#c8c8c8');

  const dimensionsHint = `${config.pattern.rows * (material.height + config.joints.horizontalSize)} × ${config.pattern.columns * (material.width + config.joints.verticalSize)} ${config.units}`;

  const handleSaveProject = () => {
    const savedProject = saveProjectToStorage(config);
    if (!savedProject) {
      setFooterStatus('Local save is unavailable in this environment.');
      return;
    }

    setLastSavedAt(savedProject.savedAt);
    setFooterStatus(`Saved locally on ${formatSavedAt(savedProject.savedAt)}.`);
  };

  const handleLoadLast = () => {
    const savedProject = loadProjectFromStorage();
    if (!savedProject) {
      setFooterStatus('No saved local project found yet.');
      return;
    }

    loadProjectConfig(savedProject.config, { label: 'Load saved project' });
    setLastSavedAt(savedProject.savedAt);
    setFooterStatus(`Loaded local project from ${formatSavedAt(savedProject.savedAt)}.`);
  };

  const handleExportJson = async () => {
    await exportProjectJson(config);
    setFooterStatus('Downloaded project JSON.');
  };

  const handleExportPng = async () => {
    setIsExportingPng(true);

    try {
      await exportPreviewPng(config);
      setFooterStatus('Downloaded preview PNG.');
    } catch {
      setFooterStatus('Preview export failed. Please try again.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportMaps = async () => {
    setIsExportingMaps(true);

    try {
      await exportAlbedoPng(config);
      exportBumpPlaceholderPng(config);
      exportRoughnessPlaceholderPng(config);
      setFooterStatus('Downloaded albedo, bump placeholder, and roughness placeholder PNGs.');
    } catch {
      setFooterStatus('Map export failed. Please try again.');
    } finally {
      setIsExportingMaps(false);
    }
  };

  return (
    <div className={styles.page}>
      <BackgroundCanvas />

      <CreateEditorShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footer={
          <>
            <button className={styles.primaryButton} type="button" onClick={handleSaveProject}>
              Save Project
            </button>
            <div className={styles.secondaryRow}>
              <button className={styles.secondaryButton} type="button" onClick={handleLoadLast}>
                Load Last
              </button>
              <button className={styles.secondaryButton} type="button" onClick={handleExportJson}>
                Export JSON
              </button>
            </div>
            <div className={styles.secondaryRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={handleExportPng}
                disabled={isExportingPng}
              >
                {isExportingPng ? 'Exporting…' : 'Export PNG'}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={undo} disabled={!canUndo}>
                Undo
              </button>
            </div>
            <div className={styles.secondaryRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={handleExportMaps}
                disabled={isExportingMaps}
              >
                {isExportingMaps ? 'Exporting Maps…' : 'Export Maps'}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={redo} disabled={!canRedo}>
                Redo
              </button>
            </div>
            <div className={styles.footerMeta}>
              <p className={styles.statusText}>{footerStatus}</p>
              <p className={styles.footerCopy}>
                {lastSavedAt ? `Last local save: ${formatSavedAt(lastSavedAt)}.` : 'No local save yet.'}
              </p>
            </div>
          </>
        }
      >
        <PatternSettingsSection
          patternType={config.pattern.type}
          rows={config.pattern.rows}
          columns={config.pattern.columns}
          angle={config.pattern.angle}
          units={config.units}
          dimensionsHint={dimensionsHint}
          onOpenPicker={() => setShowPatternModal(true)}
          onRowsChange={setPatternRows}
          onColumnsChange={setPatternColumns}
          onAngleChange={setPatternAngle}
          onUnitsChange={setUnits}
        />

        <MaterialSettingsSection
          materialName={selectedMaterial?.name ?? 'Custom material'}
          materialCategory={materialCategory}
          materialColor={materialColor}
          materialThumbnailUrl={materialThumbnailUrl}
          width={material.width}
          height={material.height}
          toneVariation={material.toneVariation}
          edgeStyle={material.edges.style}
          jointHorizontal={config.joints.horizontalSize}
          jointVertical={config.joints.verticalSize}
          onOpenPicker={() => setShowMaterialModal(true)}
          onWidthChange={setMaterialWidth}
          onHeightChange={setMaterialHeight}
          onToneVariationChange={setToneVariation}
          onEdgeStyleChange={setEdgeStyle}
          onJointHorizontalChange={setJointHorizontalSize}
          onJointVerticalChange={setJointVerticalSize}
        />
      </CreateEditorShell>

      {showPatternModal ? (
        <PatternPickerModal
          currentPattern={config.pattern.type}
          onClose={() => setShowPatternModal(false)}
          onSelect={setPatternType}
        />
      ) : null}

      {showMaterialModal ? (
        <MaterialPickerModal
          currentMaterialId={material.definitionId}
          onClose={() => setShowMaterialModal(false)}
          onSelect={(nextMaterial) => {
            setMaterialById(nextMaterial.id);
          }}
        />
      ) : null}
    </div>
  );
}
