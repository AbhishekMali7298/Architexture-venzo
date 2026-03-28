'use client';

import { useMemo, useState } from 'react';
import { getMaterialById, getMaterialCategory, MATERIAL_LIBRARY } from '@textura/shared';
import { BackgroundCanvas } from './components/background-canvas';
import styles from './components/create-editor.module.css';
import { CreateEditorShell } from './components/create-editor-shell';
import { MaterialPickerModal } from './components/material-picker-modal';
import { MaterialSettingsSection } from './components/material-settings-section';
import { PatternPickerModal } from './components/pattern-picker-modal';
import { PatternSettingsSection } from './components/pattern-settings-section';
import { useEditorStore } from './store/editor-store';

function findMaterialIdByColor(color: string): string | null {
  const match = MATERIAL_LIBRARY.find((material) => material.source.color.toLowerCase() === color.toLowerCase());
  return match?.id ?? null;
}

export default function CreatePage() {
  const config = useEditorStore((state) => state.config);
  const activeTab = useEditorStore((state) => state.activeTab);
  const setActiveTab = useEditorStore((state) => state.setActiveTab);
  const setPatternType = useEditorStore((state) => state.setPatternType);
  const setPatternRows = useEditorStore((state) => state.setPatternRows);
  const setPatternColumns = useEditorStore((state) => state.setPatternColumns);
  const setPatternAngle = useEditorStore((state) => state.setPatternAngle);
  const setMaterialColor = useEditorStore((state) => state.setMaterialColor);
  const setMaterialWidth = useEditorStore((state) => state.setMaterialWidth);
  const setMaterialHeight = useEditorStore((state) => state.setMaterialHeight);
  const setEdgeStyle = useEditorStore((state) => state.setEdgeStyle);
  const setToneVariation = useEditorStore((state) => state.setToneVariation);
  const setJointHorizontalSize = useEditorStore((state) => state.setJointHorizontalSize);
  const setJointVerticalSize = useEditorStore((state) => state.setJointVerticalSize);
  const setUnits = useEditorStore((state) => state.setUnits);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.undoStack.length > 0);
  const canRedo = useEditorStore((state) => state.redoStack.length > 0);

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const material = config.materials[0]!;

  const selectedMaterialId = useMemo(() => {
    if (material.source.type !== 'solid') return null;
    return findMaterialIdByColor(material.source.color);
  }, [material.source]);

  const selectedMaterial = useMemo(() => {
    if (!selectedMaterialId) return null;
    return getMaterialById(selectedMaterialId) ?? null;
  }, [selectedMaterialId]);

  const materialCategory = selectedMaterial
    ? getMaterialCategory(selectedMaterial.categoryId)?.displayName ?? selectedMaterial.categoryId
    : 'Custom material';

  const dimensionsHint = `${config.pattern.rows * (material.height + config.joints.horizontalSize)} × ${config.pattern.columns * (material.width + config.joints.verticalSize)} ${config.units}`;

  return (
    <div className={styles.page}>
      <BackgroundCanvas />

      <CreateEditorShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footer={
          <>
            <button className={styles.primaryButton} type="button">
              Save Project
            </button>
            <div className={styles.secondaryRow}>
              <button className={styles.secondaryButton} type="button" onClick={undo} disabled={!canUndo}>
                Undo
              </button>
              <button className={styles.secondaryButton} type="button" onClick={redo} disabled={!canRedo}>
                Redo
              </button>
            </div>
            <p className={styles.footerCopy}>Create editor foundations are now using modular UI and shared registries.</p>
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
          materialColor={material.source.type === 'solid' ? material.source.color : '#c8c8c8'}
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
          currentMaterialId={selectedMaterialId}
          onClose={() => setShowMaterialModal(false)}
          onSelect={(nextMaterial) => {
            setMaterialColor(nextMaterial.source.color);
            setMaterialWidth(nextMaterial.defaults.width);
            setMaterialHeight(nextMaterial.defaults.height);
            setToneVariation(nextMaterial.metadata?.toneVariation ?? material.toneVariation);
          }}
        />
      ) : null}
    </div>
  );
}
