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
import { SettingsModal } from './components/settings-modal';
import { getMaterialRenderableColor, getMaterialThumbnailUrl } from './lib/material-assets';
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
  const setMaterialTint = useEditorStore((state) => state.setMaterialTint);
  const setMaterialWidth = useEditorStore((state) => state.setMaterialWidth);
  const setMaterialHeight = useEditorStore((state) => state.setMaterialHeight);
  const setEdgeStyle = useEditorStore((state) => state.setEdgeStyle);
  const setToneVariation = useEditorStore((state) => state.setToneVariation);
  const setJointTint = useEditorStore((state) => state.setJointTint);
  const setJointHorizontalSize = useEditorStore((state) => state.setJointHorizontalSize);
  const setJointVerticalSize = useEditorStore((state) => state.setJointVerticalSize);
  const setLinkedDimensions = useEditorStore((state) => state.setLinkedDimensions);
  const setJointAdjustment = useEditorStore((state) => state.setJointAdjustment);
  const setJointRecess = useEditorStore((state) => state.setJointRecess);
  const setJointConcave = useEditorStore((state) => state.setJointConcave);
  const setUnits = useEditorStore((state) => state.setUnits);
  const setShowBorder = useEditorStore((state) => state.setShowBorder);
  const setTileBackground = useEditorStore((state) => state.setTileBackground);
  const loadProjectConfig = useEditorStore((state) => state.loadProjectConfig);
  const showBorder = useEditorStore((state) => state.showBorder);
  const tileBackground = useEditorStore((state) => state.tileBackground);

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [footerStatus, setFooterStatus] = useState('Ready');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const material = config.materials[0]!;

  useEffect(() => {
    const savedProject = loadProjectFromStorage();
    if (savedProject) {
      loadProjectConfig(savedProject.config, { resetHistory: true, label: 'Restore saved project' });
      setLastSavedAt(savedProject.savedAt);
      setFooterStatus(`Restored ${formatSavedAt(savedProject.savedAt)}.`);
    }

    setIsReady(true);
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
  const unitLabel = config.units === 'inches' ? 'in' : 'mm';
  const dimensionsHint = `${config.pattern.rows * (material.height + config.joints.horizontalSize)} × ${config.pattern.columns * (material.width + config.joints.verticalSize)} ${unitLabel}`;

  if (!isReady) {
    return null;
  }

  const handleSaveProject = () => {
    const savedProject = saveProjectToStorage(config);
    if (!savedProject) {
      setFooterStatus('Local save unavailable.');
      return;
    }

    setLastSavedAt(savedProject.savedAt);
    setFooterStatus('Saved.');
  };

  return (
    <div className={styles.page}>
      <BackgroundCanvas />

      <CreateEditorShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setShowSettingsModal(true)}
        footer={
          <>
            <button className={styles.primaryButton} type="button" onClick={handleSaveProject}>
              Save
            </button>
            <div className={styles.footerMeta}>
              <p className={styles.statusText}>{footerStatus}</p>
              <p className={styles.footerCopy}>
                {lastSavedAt ? `Saved ${formatSavedAt(lastSavedAt)}.` : 'No local save yet.'}
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
          dimensionsHint={dimensionsHint}
          onOpenPicker={() => setShowPatternModal(true)}
          onRowsChange={setPatternRows}
          onColumnsChange={setPatternColumns}
          onAngleChange={setPatternAngle}
        />

        <MaterialSettingsSection
          materialName={selectedMaterial?.name ?? 'Custom material'}
          materialCategory={materialCategory}
          materialColor={materialColor}
          materialThumbnailUrl={materialThumbnailUrl}
          units={config.units}
          materialTint={material.tint}
          width={material.width}
          height={material.height}
          toneVariation={material.toneVariation}
          edgeStyle={material.edges.style}
          jointTint={config.joints.tint}
          jointHorizontal={config.joints.horizontalSize}
          jointVertical={config.joints.verticalSize}
          linkedJoints={config.joints.linkedDimensions}
          jointAdjustments={config.joints.adjustments}
          jointRecess={config.joints.recess}
          jointConcave={config.joints.concave}
          onOpenPicker={() => setShowMaterialModal(true)}
          onMaterialTintChange={setMaterialTint}
          onWidthChange={setMaterialWidth}
          onHeightChange={setMaterialHeight}
          onToneVariationChange={setToneVariation}
          onEdgeStyleChange={setEdgeStyle}
          onJointTintChange={setJointTint}
          onJointHorizontalChange={setJointHorizontalSize}
          onJointVerticalChange={setJointVerticalSize}
          onLinkedJointsChange={setLinkedDimensions}
          onJointAdjustmentChange={setJointAdjustment}
          onJointRecessChange={setJointRecess}
          onJointConcaveChange={setJointConcave}
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

      {showSettingsModal ? (
        <SettingsModal
          units={config.units}
          tileBackground={tileBackground}
          showBorder={showBorder}
          onClose={() => setShowSettingsModal(false)}
          onUnitsChange={setUnits}
          onTileBackgroundChange={setTileBackground}
          onShowBorderChange={setShowBorder}
        />
      ) : null}
    </div>
  );
}
