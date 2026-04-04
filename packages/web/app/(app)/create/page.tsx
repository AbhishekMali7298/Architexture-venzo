'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMaterialById, getMaterialCategory, type TextureConfig } from '@textura/shared';
import { SvgPatternBackground } from './components/svg-pattern-background';
import styles from './components/create-editor.module.css';
import { CreateEditorShell } from './components/create-editor-shell';
import { JointMaterialPickerModal } from './components/joint-material-picker-modal';
import { MaterialPickerModal } from './components/material-picker-modal';
import { MaterialSettingsSection } from './components/material-settings-section';
import { PatternPickerModal } from './components/pattern-picker-modal';
import { PatternSettingsSection } from './components/pattern-settings-section';
import { SaveExportModal, type ExportFormat } from './components/save-export-modal';
import { SettingsModal } from './components/settings-modal';
import { getMaterialRenderableColor, getMaterialThumbnailUrl } from './lib/material-assets';
import { buildJointMaterialAsset, getJointMaterialName, getJointMaterialPreviewUrl } from './lib/joint-material-library';
import { getPatternLayout } from './engine/pattern-layouts';
import { getPatternDimensionsHintSize } from './lib/pattern-repeat-semantics';
import { getPatternSidebarSchema } from './lib/pattern-sidebar-schema';
import {
  exportPreviewJpg,
  exportPreviewPdf,
  exportPreviewPng,
  exportPreviewSvg,
} from './lib/project-export';
import { clearProjectFromStorage, formatSavedAt, loadProjectFromStorage, saveProjectToStorage } from './lib/project-storage';
import { useEditorStore } from './store/editor-store';

function encodeConfig(config: TextureConfig) {
  return btoa(encodeURIComponent(JSON.stringify(config)));
}

function decodeConfig(encoded: string): TextureConfig {
  return JSON.parse(decodeURIComponent(atob(encoded))) as TextureConfig;
}

export default function CreatePage() {
  const config = useEditorStore((state) => state.config);
  const setPatternType = useEditorStore((state) => state.setPatternType);
  const setPatternRows = useEditorStore((state) => state.setPatternRows);
  const setPatternColumns = useEditorStore((state) => state.setPatternColumns);
  const setPatternAngle = useEditorStore((state) => state.setPatternAngle);
  const togglePatternOrientation = useEditorStore((state) => state.togglePatternOrientation);
  const setPatternStretchers = useEditorStore((state) => state.setPatternStretchers);
  const setPatternWeaves = useEditorStore((state) => state.setPatternWeaves);
  const setMaterialById = useEditorStore((state) => state.setMaterialById);
  const setMaterialTint = useEditorStore((state) => state.setMaterialTint);
  const setMaterialWidth = useEditorStore((state) => state.setMaterialWidth);
  const setMaterialHeight = useEditorStore((state) => state.setMaterialHeight);
  const setEdgeStyle = useEditorStore((state) => state.setEdgeStyle);
  const setEdgePerimeterScale = useEditorStore((state) => state.setEdgePerimeterScale);
  const setEdgeProfileWidth = useEditorStore((state) => state.setEdgeProfileWidth);
  const setToneVariation = useEditorStore((state) => state.setToneVariation);
  const setJointTint = useEditorStore((state) => state.setJointTint);
  const setJointMaterialAsset = useEditorStore((state) => state.setJointMaterialAsset);
  const setJointHorizontalSize = useEditorStore((state) => state.setJointHorizontalSize);
  const setJointVerticalSize = useEditorStore((state) => state.setJointVerticalSize);
  const setLinkedDimensions = useEditorStore((state) => state.setLinkedDimensions);
  const setJointAdjustment = useEditorStore((state) => state.setJointAdjustment);
  const setJointRecess = useEditorStore((state) => state.setJointRecess);
  const setJointConcave = useEditorStore((state) => state.setJointConcave);
  const setJointShadowOpacity = useEditorStore((state) => state.setJointShadowOpacity);
  const setUnits = useEditorStore((state) => state.setUnits);
  const setShowBorder = useEditorStore((state) => state.setShowBorder);
  const setTileBackground = useEditorStore((state) => state.setTileBackground);
  const loadProjectConfig = useEditorStore((state) => state.loadProjectConfig);
  const resetProject = useEditorStore((state) => state.resetProject);
  const showBorder = useEditorStore((state) => state.showBorder);
  const tileBackground = useEditorStore((state) => state.tileBackground);

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showJointMaterialModal, setShowJointMaterialModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [footerStatus, setFooterStatus] = useState('Ready');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const material = config.materials[0]!;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sharedConfig = query.get('config');

    if (sharedConfig) {
      try {
        loadProjectConfig(decodeConfig(sharedConfig), { resetHistory: true, label: 'Open shared texture' });
        setFooterStatus('Loaded from shared link.');
      } catch {
        setFooterStatus('Could not open shared link.');
      }
    } else {
      const savedProject = loadProjectFromStorage();
      if (savedProject) {
        loadProjectConfig(savedProject.config, { resetHistory: true, label: 'Restore saved project' });
        setLastSavedAt(savedProject.savedAt);
        setFooterStatus(`Restored ${formatSavedAt(savedProject.savedAt)}.`);
      }
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
  const jointMaterialColor = getMaterialRenderableColor(
    config.joints.materialSource,
    '#e8e6e0',
  );
  const jointMaterialName = useMemo(() => getJointMaterialName(config.joints.materialSource), [config.joints.materialSource]);
  const jointMaterialThumbnailUrl = useMemo(() => getJointMaterialPreviewUrl(config.joints.materialSource), [config.joints.materialSource]);
  const unitLabel = config.units === 'inches' ? 'in' : 'mm';
  const patternSidebarSchema = getPatternSidebarSchema(config.pattern.type);
  const dimensionsHint = useMemo(() => {
    const layout = getPatternLayout(config);
    const { width, height } = getPatternDimensionsHintSize(config, layout);
    return `${width} × ${height} ${unitLabel}`;
  }, [config, unitLabel]);

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

  const handleDownloadPreview = async (format: ExportFormat) => {
    try {
      if (format === 'png') await exportPreviewPng(config);
      if (format === 'svg') await exportPreviewSvg(config);
      if (format === 'jpg') await exportPreviewJpg(config);
      if (format === 'pdf') await exportPreviewPdf(config);
      setFooterStatus(`Downloaded ${format.toUpperCase()}.`);
      setShowSaveModal(false);
    } catch {
      setFooterStatus('Download failed.');
    }
  };

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('config', encodeConfig(config));
      await navigator.clipboard.writeText(url.toString());
      setFooterStatus('Share link copied.');
    } catch {
      setFooterStatus('Could not copy share link.');
    }
  };

  const handleReset = () => {
    resetProject();
    clearProjectFromStorage();
    setLastSavedAt(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('config');
    window.history.replaceState({}, '', url.toString());
    setFooterStatus('Reset project.');
  };

  return (
    <div className={styles.page}>
      <SvgPatternBackground />

      <CreateEditorShell
        onOpenSettings={() => setShowSettingsModal(true)}
        footer={
          <div className={styles.footerActions}>
            <button className={styles.primaryButton} type="button" onClick={() => setShowSaveModal(true)}>
              Save
            </button>
            <button className={styles.secondaryButton} type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        }
      >
        <PatternSettingsSection
          patternType={config.pattern.type}
          orientation={config.pattern.orientation}
          rows={config.pattern.rows}
          columns={config.pattern.columns}
          angle={config.pattern.angle}
          stretchers={config.pattern.stretchers}
          weaves={config.pattern.weaves}
          fields={patternSidebarSchema.fields}
          dimensionsHint={dimensionsHint}
          semanticsHint={patternSidebarSchema.semanticHint}
          onOpenPicker={() => setShowPatternModal(true)}
          onRowsChange={setPatternRows}
          onColumnsChange={setPatternColumns}
          onAngleChange={setPatternAngle}
          onToggleOrientation={togglePatternOrientation}
          onStretchersChange={setPatternStretchers}
          onWeavesChange={setPatternWeaves}
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
          widthLabel={patternSidebarSchema.materialWidthLabel}
          heightLabel={patternSidebarSchema.materialHeightLabel}
          dimensionHint={patternSidebarSchema.dimensionsMeaning}
          toneVariation={material.toneVariation}
          edgeStyle={material.edges.style}
          edgeScale={material.edges.perimeterScale}
          edgeProfileWidth={material.edges.profileWidth}
          jointTint={config.joints.tint}
          jointMaterialName={jointMaterialName}
          jointMaterialColor={jointMaterialColor}
          jointMaterialThumbnailUrl={jointMaterialThumbnailUrl}
          jointHorizontal={config.joints.horizontalSize}
          jointVertical={config.joints.verticalSize}
          linkedJoints={config.joints.linkedDimensions}
          jointAdjustments={config.joints.adjustments}
          jointRecess={config.joints.recess}
          jointConcave={config.joints.concave}
          jointShadowOpacity={config.joints.shadowOpacity}
          onOpenPicker={() => setShowMaterialModal(true)}
          onMaterialTintChange={setMaterialTint}
          onWidthChange={setMaterialWidth}
          onHeightChange={setMaterialHeight}
          onToneVariationChange={setToneVariation}
          onEdgeStyleChange={setEdgeStyle}
          onEdgeScaleChange={setEdgePerimeterScale}
          onEdgeProfileWidthChange={setEdgeProfileWidth}
          onJointTintChange={setJointTint}
          onOpenJointMaterialPicker={() => setShowJointMaterialModal(true)}
          onJointHorizontalChange={setJointHorizontalSize}
          onJointVerticalChange={setJointVerticalSize}
          onLinkedJointsChange={setLinkedDimensions}
          onJointAdjustmentChange={setJointAdjustment}
          onJointRecessChange={setJointRecess}
          onJointConcaveChange={setJointConcave}
          onJointShadowOpacityChange={setJointShadowOpacity}
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

      {showJointMaterialModal ? (
        <JointMaterialPickerModal
          currentAssetPath={
            config.joints.materialSource.type === 'image' || config.joints.materialSource.type === 'generated'
              ? config.joints.materialSource.asset?.path ?? null
              : null
          }
          isSolidFill={config.joints.materialSource.type === 'solid'}
          onClose={() => setShowJointMaterialModal(false)}
          onSelectSolid={() => setJointMaterialAsset(null)}
          onSelectMaterial={(nextMaterial) => {
            setJointMaterialAsset(buildJointMaterialAsset(nextMaterial));
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

      {showSaveModal ? (
        <SaveExportModal
          onClose={() => setShowSaveModal(false)}
          onSaveLocal={handleSaveProject}
          onShare={handleShare}
          onDownload={handleDownloadPreview}
        />
      ) : null}
    </div>
  );
}
