'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getMaterialById,
  getMaterialCategory,
  getPatternByType,
  type TextureConfig,
} from '@textura/shared';
import { BackgroundCanvas } from './components/background-canvas';
import styles from './components/create-editor.module.css';
import { CreateEditorShell } from './components/create-editor-shell';
import { JointMaterialModal } from './components/joint-material-modal';
import { MaterialPickerModal } from './components/material-picker-modal';
import { MaterialSettingsSection } from './components/material-settings-section';
import { PatternPickerModal } from './components/pattern-picker-modal';
import { ProductionPlanningSection } from './components/production-planning-section';
import { SaveExportModal, type ExportFormat } from './components/save-export-modal';
import { SettingsModal } from './components/settings-modal';
import { StackSettingsSection } from './components/stack-settings-section';
import {
  getMaterialRenderableColor,
  getMaterialSourceRenderableImageUrl,
  getMaterialThumbnailUrl,
  getPatternPreviewImageUrl,
} from './lib/material-assets';
import {
  isImpressPattern,
  isVitaComponentPattern,
  supportsEmbossPattern,
} from './lib/pattern-capabilities';
import { getPatternLayout } from './lib/pattern-layout';
import {
  fitPatternToTargetSize,
  formatMeasurement,
  getSheetCoverageSummary,
  getSheetDimensions,
} from './lib/production-metrics';
import {
  exportPreviewJpg,
  exportPreviewPdf,
  exportPreviewPng,
  exportPreviewSvg,
} from './lib/project-export';
import {
  clearProjectFromStorage,
  loadProjectFromStorage,
  saveProjectToStorage,
} from './lib/project-storage';
import { primeSvgPatternModule, useSvgPatternModule } from './lib/svg-pattern-module-cache';
import { useEditorStore } from './store/editor-store';

function encodeConfig(config: TextureConfig) {
  return btoa(encodeURIComponent(JSON.stringify(config)));
}

function decodeConfig(encoded: string): TextureConfig {
  return JSON.parse(decodeURIComponent(atob(encoded))) as TextureConfig;
}

const MM_PER_INCH = 25.4;

export default function CreatePage() {
  const config = useEditorStore((state) => state.config);
  const setPatternType = useEditorStore((state) => state.setPatternType);
  const setPatternRows = useEditorStore((state) => state.setPatternRows);
  const setPatternColumns = useEditorStore((state) => state.setPatternColumns);
  const setPatternAngle = useEditorStore((state) => state.setPatternAngle);
  const setMaterialById = useEditorStore((state) => state.setMaterialById);
  const setMaterialWidth = useEditorStore((state) => state.setMaterialWidth);
  const setMaterialHeight = useEditorStore((state) => state.setMaterialHeight);
  const setJointHorizontalSize = useEditorStore((state) => state.setJointHorizontalSize);
  const setJointVerticalSize = useEditorStore((state) => state.setJointVerticalSize);
  const setJointMaterialAsset = useEditorStore((state) => state.setJointMaterialAsset);
  const setJointAdjustment = useEditorStore((state) => state.setJointAdjustment);
  const setLinkedDimensions = useEditorStore((state) => state.setLinkedDimensions);

  const loadProjectConfig = useEditorStore((state) => state.loadProjectConfig);
  const resetProject = useEditorStore((state) => state.resetProject);
  const showBorder = useEditorStore((state) => state.showBorder);
  const tileBackground = useEditorStore((state) => state.tileBackground);
  const embossMode = useEditorStore((state) => state.embossMode);
  const embossStrength = useEditorStore((state) => state.embossStrength);
  const setShowBorder = useEditorStore((state) => state.setShowBorder);
  const setTileBackground = useEditorStore((state) => state.setTileBackground);
  const setEmbossMode = useEditorStore((state) => state.setEmbossMode);
  const setEmbossStrength = useEditorStore((state) => state.setEmbossStrength);
  const embossIntensity = useEditorStore((state) => state.embossIntensity);
  const embossDepth = useEditorStore((state) => state.embossDepth);
  const setEmbossIntensity = useEditorStore((state) => state.setEmbossIntensity);
  const setEmbossDepth = useEditorStore((state) => state.setEmbossDepth);
  const setUnits = useEditorStore((state) => state.setUnits);
  const sheetPreviewPreset = useEditorStore((state) => state.sheetPreviewPreset);
  const customSheetWidth = useEditorStore((state) => state.customSheetWidth);
  const customSheetHeight = useEditorStore((state) => state.customSheetHeight);
  const setSheetPreviewPreset = useEditorStore((state) => state.setSheetPreviewPreset);
  const setCustomSheetWidth = useEditorStore((state) => state.setCustomSheetWidth);
  const setCustomSheetHeight = useEditorStore((state) => state.setCustomSheetHeight);

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showJointMaterialModal, setShowJointMaterialModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [requestedWidth, setRequestedWidth] = useState(1000);
  const [requestedHeight, setRequestedHeight] = useState(1000);
  const [hasInitializedRequestedSize, setHasInitializedRequestedSize] = useState(false);
  const previousUnitsRef = useRef(config.units);

  const material = config.materials[0]!;
  const svgPatternModule = useSvgPatternModule(config.pattern.type);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sharedConfig = query.get('config');

    if (sharedConfig) {
      try {
        loadProjectConfig(decodeConfig(sharedConfig), {
          resetHistory: true,
          label: 'Open shared texture',
        });
      } catch {
        // Ignore malformed shared links and fall back to local state.
      }
    } else {
      const savedProject = loadProjectFromStorage();
      if (savedProject) {
        loadProjectConfig(savedProject.config, {
          resetHistory: true,
          label: 'Restore saved project',
        });
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate opens after local/shared project state has been restored.
    setIsReady(true);
  }, [loadProjectConfig]);

  useEffect(() => {
    primeSvgPatternModule(config.pattern.type);
  }, [config.pattern.type]);

  const selectedMaterial = useMemo(() => {
    if (!material.definitionId) return null;
    return getMaterialById(material.definitionId) ?? null;
  }, [material.definitionId]);

  const materialCategory = selectedMaterial
    ? (getMaterialCategory(selectedMaterial.categoryId)?.displayName ?? selectedMaterial.categoryId)
    : 'Custom material';

  const materialThumbnailUrl = getMaterialThumbnailUrl(selectedMaterial);
  const materialColor = getMaterialRenderableColor(
    material.source,
    selectedMaterial?.swatchColor ?? '#c8c8c8',
  );
  const jointMaterialPath =
    config.joints.materialSource.type === 'image'
      ? config.joints.materialSource.asset.path
      : config.joints.materialSource.type === 'generated'
        ? (config.joints.materialSource.asset?.path ?? null)
        : null;
  const jointMaterialName =
    config.joints.materialSource.type === 'solid'
      ? 'Solid Fill'
      : jointMaterialPath
        ? (jointMaterialPath
            .split('/')
            .pop()
            ?.replace(/\.[a-z0-9]+$/i, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (char: string) => char.toUpperCase()) ?? 'Joint Texture')
        : 'Joint Texture';
  const jointMaterialThumbnailUrl = jointMaterialPath
    ? getMaterialSourceRenderableImageUrl(config.joints.materialSource)
    : null;
  const patternLayout = useMemo(
    () => getPatternLayout(config, svgPatternModule),
    [config, svgPatternModule],
  );
  const stackHintUnit = config.units === 'inches' ? 'in' : 'mm';
  const stackHint = `${Math.round(patternLayout.totalWidth)} × ${Math.round(patternLayout.totalHeight)} ${stackHintUnit}`;
  const currentPattern = getPatternByType(config.pattern.type) ?? getPatternByType('stack_bond');
  const currentPatternName = currentPattern?.displayName ?? 'Stack';
  const currentPatternPreview =
    getPatternPreviewImageUrl(config.pattern.type) ?? '/patterns/stack_bond.svg';
  const embossAvailable = supportsEmbossPattern(config.pattern.type);
  const sharedPatternSizeLabel =
    currentPattern?.widthLabel && /size$/i.test(currentPattern.widthLabel)
      ? currentPattern.widthLabel.replace(/size$/i, '').trim()
      : null;
  const widthLabel = currentPattern?.widthLabel
    ? currentPattern.heightLabel
      ? currentPattern.widthLabel
      : sharedPatternSizeLabel
        ? `${sharedPatternSizeLabel} Width`
        : `${currentPattern.widthLabel} Width`
    : 'Unit Width';
  const heightLabel = currentPattern?.heightLabel
    ? currentPattern.heightLabel
    : sharedPatternSizeLabel
      ? `${sharedPatternSizeLabel} Height`
      : currentPattern?.widthLabel
        ? `${currentPattern.widthLabel} Height`
        : 'Unit Height';
  const sheetPreview = getSheetDimensions(
    config.units,
    sheetPreviewPreset,
    customSheetWidth,
    customSheetHeight,
  );
  const sheetCoverage = sheetPreview
    ? getSheetCoverageSummary(
        patternLayout.totalWidth,
        patternLayout.totalHeight,
        sheetPreview.width,
        sheetPreview.height,
      )
    : null;
  const fittedResult = useMemo(
    () => fitPatternToTargetSize(config, requestedWidth, requestedHeight, svgPatternModule),
    [config, requestedWidth, requestedHeight, svgPatternModule],
  );

  useEffect(() => {
    if (hasInitializedRequestedSize) return;
    setRequestedWidth(Math.max(1, Math.round(patternLayout.totalWidth)));
    setRequestedHeight(Math.max(1, Math.round(patternLayout.totalHeight)));
    setHasInitializedRequestedSize(true);
  }, [hasInitializedRequestedSize, patternLayout.totalHeight, patternLayout.totalWidth]);

  useEffect(() => {
    if (previousUnitsRef.current === config.units) return;
    const factor = config.units === 'inches' ? 1 / MM_PER_INCH : MM_PER_INCH;
    setRequestedWidth((value) => Math.max(1, Math.round(value * factor * 100) / 100));
    setRequestedHeight((value) => Math.max(1, Math.round(value * factor * 100) / 100));
    previousUnitsRef.current = config.units;
  }, [config.units]);

  if (!isReady) {
    return null;
  }

  const handleSaveProject = () => {
    saveProjectToStorage(config);
  };

  const handleDownloadPreview = async (format: ExportFormat) => {
    if (format === 'png') await exportPreviewPng(config);
    if (format === 'svg') await exportPreviewSvg(config);
    if (format === 'jpg') await exportPreviewJpg(config);
    if (format === 'pdf') await exportPreviewPdf(config);
    setShowSaveModal(false);
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('config', encodeConfig(config));
    await navigator.clipboard.writeText(url.toString());
  };

  const handleReset = () => {
    resetProject();
    clearProjectFromStorage();
    const url = new URL(window.location.href);
    url.searchParams.delete('config');
    window.history.replaceState({}, '', url.toString());
  };

  const handleFitPatternToRequestedSize = () => {
    loadProjectConfig(fittedResult.config, {
      label: `Fit pattern to ${Math.round(requestedWidth)} × ${Math.round(requestedHeight)}`,
    });
  };

  const sheetCoverageText = sheetCoverage
    ? `${sheetCoverage.fitAcross} across × ${sheetCoverage.fitDown} down on ${sheetPreview?.label}. Offcut: ${formatMeasurement(sheetCoverage.leftoverWidth, config.units)} by ${formatMeasurement(sheetCoverage.leftoverHeight, config.units)}.`
    : null;

  return (
    <div className={styles.page}>
      <BackgroundCanvas />

      <CreateEditorShell
        onOpenSettings={() => setShowSettingsModal(true)}
        footer={
          <div className={styles.footerActions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => setShowSaveModal(true)}
            >
              Save
            </button>
            <button className={styles.secondaryButton} type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        }
      >
        <StackSettingsSection
          patternName={currentPatternName}
          patternType={config.pattern.type}
          rows={config.pattern.rows}
          columns={config.pattern.columns}
          angle={config.pattern.angle}
          previewUrl={currentPatternPreview}
          widthHint={stackHint}
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
          jointMaterialName={jointMaterialName}
          jointMaterialThumbnailUrl={jointMaterialThumbnailUrl}
          width={material.width}
          height={material.height}
          widthLabel={widthLabel}
          heightLabel={heightLabel}
          jointHorizontal={config.joints.horizontalSize}
          jointVertical={config.joints.verticalSize}
          jointAdjustments={config.joints.adjustments}
          units={config.units}
          linkedJoints={config.joints.linkedDimensions}
          onOpenPicker={() => setShowMaterialModal(true)}
          onOpenJointMaterialPicker={() => setShowJointMaterialModal(true)}
          onWidthChange={setMaterialWidth}
          onHeightChange={setMaterialHeight}
          onJointHorizontalChange={setJointHorizontalSize}
          onJointVerticalChange={setJointVerticalSize}
          onJointAdjustmentChange={setJointAdjustment}
          onLinkedJointsChange={setLinkedDimensions}
          isImpressPattern={isImpressPattern(config.pattern.type)}
          isVitaPattern={isVitaComponentPattern(config.pattern.type)}
          embossAvailable={embossAvailable}
          embossMode={embossMode}
          embossStrength={embossStrength}
          embossIntensity={embossIntensity}
          embossDepth={embossDepth}
          onEmbossModeChange={setEmbossMode}
          onEmbossStrengthChange={setEmbossStrength}
          onEmbossIntensityChange={setEmbossIntensity}
          onEmbossDepthChange={setEmbossDepth}
        />

        <ProductionPlanningSection
          units={config.units}
          requestedWidth={requestedWidth}
          requestedHeight={requestedHeight}
          onRequestedWidthChange={setRequestedWidth}
          onRequestedHeightChange={setRequestedHeight}
          onFitToRequestedSize={handleFitPatternToRequestedSize}
          fittedWidth={formatMeasurement(fittedResult.actualWidth, config.units)}
          fittedHeight={formatMeasurement(fittedResult.actualHeight, config.units)}
          widthDelta={formatMeasurement(fittedResult.widthDelta, config.units)}
          heightDelta={formatMeasurement(fittedResult.heightDelta, config.units)}
          productionWidth={formatMeasurement(patternLayout.totalWidth, config.units)}
          productionHeight={formatMeasurement(patternLayout.totalHeight, config.units)}
          rows={config.pattern.rows}
          columns={config.pattern.columns}
          unitWidthLabel={widthLabel}
          unitHeightLabel={heightLabel}
          unitWidth={formatMeasurement(material.width, config.units)}
          unitHeight={formatMeasurement(material.height, config.units)}
          jointHorizontal={formatMeasurement(config.joints.horizontalSize, config.units)}
          jointVertical={formatMeasurement(config.joints.verticalSize, config.units)}
          sheetPreviewLabel={sheetPreview?.label ?? 'Pattern only'}
          sheetCoverageText={sheetCoverageText}
        />
      </CreateEditorShell>

      {showMaterialModal ? (
        <MaterialPickerModal
          currentMaterialId={material.definitionId}
          onClose={() => setShowMaterialModal(false)}
          onSelect={(nextMaterial) => {
            setMaterialById(nextMaterial.id);
          }}
        />
      ) : null}

      {showPatternModal ? (
        <PatternPickerModal
          currentPattern={config.pattern.type}
          onClose={() => setShowPatternModal(false)}
          onSelect={(pattern) => {
            setPatternType(pattern.type);
            setShowPatternModal(false);
          }}
        />
      ) : null}

      {showJointMaterialModal ? (
        <JointMaterialModal
          currentRenderPath={jointMaterialPath}
          onClose={() => setShowJointMaterialModal(false)}
          onSelect={(asset) => {
            setJointMaterialAsset(asset);
          }}
        />
      ) : null}

      {showSettingsModal ? (
        <SettingsModal
          units={config.units}
          showBorder={showBorder}
          tileBackground={tileBackground}
          sheetPreviewPreset={sheetPreviewPreset}
          customSheetWidth={customSheetWidth}
          customSheetHeight={customSheetHeight}
          onClose={() => setShowSettingsModal(false)}
          onUnitsChange={setUnits}
          onShowBorderChange={setShowBorder}
          onTileBackgroundChange={setTileBackground}
          onSheetPreviewPresetChange={setSheetPreviewPreset}
          onCustomSheetWidthChange={setCustomSheetWidth}
          onCustomSheetHeightChange={setCustomSheetHeight}
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
