'use client';

import { useState } from 'react';
import type { ImageAdjustments } from '@textura/shared';
import type { EdgeStyle } from '@textura/shared';
import { CheckboxField, ColorField, NumberField, RangeField, SectionCard, SelectField, SliderField } from './field-controls';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import { isPresetEdgeStyle } from '../lib/handmade-edge';
import styles from './create-editor.module.css';

const EDGE_STYLE_OPTIONS: { value: EdgeStyle; label: string }[] = [
  { value: 'handmade', label: 'Handmade' },
  { value: 'fine', label: 'Fine' },
  { value: 'rough_brick', label: 'Rough Brick' },
  { value: 'rough_stone', label: 'Rough Stone' },
  { value: 'wirecut', label: 'Wirecut' },
  { value: 'chamfer', label: 'Chamfer' },
  { value: 'fillet', label: 'Fillet' },
  { value: 'cove', label: 'Cove' },
  { value: 'none', label: 'None' },
];

export function MaterialSettingsSection({
  materialName,
  materialCategory,
  materialColor,
  materialThumbnailUrl,
  jointMaterialName,
  jointMaterialThumbnailUrl,
  materialTint,
  width,
  height,
  toneVariation,
  jointHorizontal,
  jointVertical,
  jointTint,
  jointAdjustments,
  units,
  linkedJoints,
  recessJoints,
  concaveJoints,
  edgeStyle,
  edgeScale,
  edgeWidth,
  onOpenPicker,
  onOpenJointMaterialPicker,
  onMaterialTintChange,
  onWidthChange,
  onHeightChange,
  onJointHorizontalChange,
  onJointVerticalChange,
  onJointTintChange,
  onJointAdjustmentChange,
  onLinkedJointsChange,
  onRecessJointsChange,
  onConcaveJointsChange,
  onEdgeStyleChange,
  onEdgeScaleChange,
  onEdgeWidthChange,
  onToneVariationChange,
}: {
  materialName: string;
  materialCategory: string;
  materialColor: string;
  materialThumbnailUrl?: string | null;
  jointMaterialName: string;
  jointMaterialThumbnailUrl?: string | null;
  materialTint: string | null;
  width: number;
  height: number;
  toneVariation: number;
  jointHorizontal: number;
  jointVertical: number;
  jointTint: string | null;
  jointAdjustments: ImageAdjustments;
  units: 'mm' | 'inches';
  linkedJoints: boolean;
  recessJoints: boolean;
  concaveJoints: boolean;
  edgeStyle: EdgeStyle;
  edgeScale: number;
  edgeWidth: number;
  onOpenPicker: () => void;
  onOpenJointMaterialPicker: () => void;
  onMaterialTintChange: (value: string | null) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
  onJointTintChange: (value: string | null) => void;
  onJointAdjustmentChange: (key: keyof ImageAdjustments, value: number | boolean) => void;
  onLinkedJointsChange: (value: boolean) => void;
  onRecessJointsChange: (value: boolean) => void;
  onConcaveJointsChange: (value: boolean) => void;
  onEdgeStyleChange: (value: EdgeStyle) => void;
  onEdgeScaleChange: (value: number) => void;
  onEdgeWidthChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
}) {
  const [showEdgePopup, setShowEdgePopup] = useState(false);
  const [showJointAdjustments, setShowJointAdjustments] = useState(false);
  const toneVariationUi = Number((toneVariation / 100).toFixed(2));
  const edgeStyleLabel = EDGE_STYLE_OPTIONS.find((option) => option.value === edgeStyle)?.label ?? edgeStyle;
  const usesPresetWidth = isPresetEdgeStyle(edgeStyle);
  const unitLabel = units === 'inches' ? 'in' : 'mm';

  return (
    <>
      <SectionCard title="Material">
        <button className={`${styles.selectionButton} ${styles.selectionButtonCompact}`} type="button" onClick={onOpenPicker}>
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{materialName}</span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{materialCategory}</span>
          </span>
          <MaterialThumb color={materialColor} src={materialThumbnailUrl} alt={materialName} size={36} compact shape="square" loading="eager" />
        </button>

        <div className={styles.gridTwo}>
          <NumberField label="Width" value={width} min={1} max={5000} unit={unitLabel} onChange={onWidthChange} />
          <NumberField label="Height" value={height} min={1} max={5000} unit={unitLabel} onChange={onHeightChange} />
        </div>

        <button
          className={`${styles.selectionButton} ${styles.selectionButtonCompact}`}
          type="button"
          onClick={() => setShowEdgePopup(true)}
        >
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>Edges</span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{edgeStyleLabel}</span>
          </span>
          <span className={styles.edgePopupValue}>Edit</span>
        </button>

        <div className={styles.subsectionTitle}>Joints</div>

        <button className={`${styles.selectionButton} ${styles.selectionButtonCompact}`} type="button" onClick={onOpenJointMaterialPicker}>
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{jointMaterialName}</span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>Joint material</span>
          </span>
          <MaterialThumb color={jointTint ?? '#d4cfc6'} src={jointMaterialThumbnailUrl} alt={jointMaterialName} size={36} compact shape="circle" loading="eager" />
        </button>

        <div className={styles.jointDimensionRow}>
          <NumberField label="H Joint" value={jointHorizontal} min={0} max={500} unit={unitLabel} onChange={onJointHorizontalChange} />
          <button
            className={`${styles.jointLinkButton} ${linkedJoints ? styles.jointLinkButtonActive : ''}`}
            type="button"
            onClick={() => onLinkedJointsChange(!linkedJoints)}
            aria-label={linkedJoints ? 'Unlock joint sizes' : 'Link joint sizes'}
            title={linkedJoints ? 'Click to unlink joints' : 'Click to link joints'}
          >
            {linkedJoints ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            )}
          </button>
          <NumberField label="V Joint" value={jointVertical} min={0} max={500} unit={unitLabel} onChange={onJointVerticalChange} />
        </div>

        <ColorField
          label="Joint Tint"
          value={jointTint ?? '#FFFFFF'}
          onChange={(value) => onJointTintChange(value || null)}
          action={
            <button
              className={styles.fieldActionButton}
              type="button"
              onClick={() => setShowJointAdjustments(true)}
              aria-label="Open joint tint adjustments"
              title="Joint tint adjustments"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="2" y1="14" x2="6" y2="14" />
                <line x1="10" y1="8" x2="14" y2="8" />
                <line x1="18" y1="16" x2="22" y2="16" />
              </svg>
            </button>
          }
        />

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={recessJoints}
            onChange={(event) => onRecessJointsChange(event.target.checked)}
          />
          <span>Recess joints</span>
        </label>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={concaveJoints}
            onChange={(event) => onConcaveJointsChange(event.target.checked)}
          />
          <span>Concave joints</span>
        </label>

        <ColorField label="Tint" value={materialTint ?? '#FFFFFF'} onChange={(value) => onMaterialTintChange(value || null)} />

        <RangeField
          label="Tone Variation"
          value={toneVariationUi}
          min={0}
          max={1}
          step={0.01}
          valueText={toneVariationUi.toFixed(2)}
          onChange={(value) => onToneVariationChange(Math.round(value * 100))}
        />
      </SectionCard>

      {showEdgePopup ? (
        <Modal onClose={() => setShowEdgePopup(false)}>
          <div className={styles.edgePopupCard}>
            <div className={styles.edgePopupHeader}>
              <h3 className={styles.edgePopupTitle}>Edge settings</h3>
              <button className={styles.iconButton} type="button" onClick={() => setShowEdgePopup(false)} aria-label="Close edge settings">
                ✕
              </button>
            </div>

            <div className={styles.edgePopupBody}>
              <SelectField
                label="Style"
                value={edgeStyle}
                options={EDGE_STYLE_OPTIONS}
                onChange={(value) => onEdgeStyleChange(value as EdgeStyle)}
              />

              <RangeField
                label={edgeStyle === 'handmade' ? 'Handmade Scale' : 'Scale'}
                value={edgeScale}
                min={usesPresetWidth ? 0.25 : 0}
                max={usesPresetWidth ? 4 : 5}
                step={0.1}
                valueText={edgeScale.toFixed(1)}
                onChange={onEdgeScaleChange}
              />

              {usesPresetWidth ? (
                <div className={styles.hint}>
                  This edge uses a preset profile with width fixed to 25.
                </div>
              ) : (
                <NumberField label="Width" value={edgeWidth} min={0} max={100} onChange={onEdgeWidthChange} />
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {showJointAdjustments ? (
        <Modal onClose={() => setShowJointAdjustments(false)}>
          <div className={styles.settingsModalCard}>
            <div className={styles.settingsModalHeader}>
              <h3 className={styles.settingsModalTitle}>Joint Adjustments</h3>
              <button
                className={styles.settingsCloseButton}
                type="button"
                onClick={() => setShowJointAdjustments(false)}
                aria-label="Close joint adjustments"
              >
                ✕
              </button>
            </div>

            <div className={styles.adjustmentsPanel}>
              <SliderField
                label="Brightness"
                value={jointAdjustments.brightness}
                min={-100}
                max={100}
                onChange={(value) => onJointAdjustmentChange('brightness', value)}
                onReset={() => onJointAdjustmentChange('brightness', 0)}
              />
              <SliderField
                label="Contrast"
                value={jointAdjustments.contrast}
                min={-100}
                max={100}
                onChange={(value) => onJointAdjustmentChange('contrast', value)}
                onReset={() => onJointAdjustmentChange('contrast', 0)}
              />
              <SliderField
                label="Hue"
                value={jointAdjustments.hue}
                min={-180}
                max={180}
                onChange={(value) => onJointAdjustmentChange('hue', value)}
                onReset={() => onJointAdjustmentChange('hue', 0)}
              />
              <SliderField
                label="Saturation"
                value={jointAdjustments.saturation}
                min={-100}
                max={100}
                onChange={(value) => onJointAdjustmentChange('saturation', value)}
                onReset={() => onJointAdjustmentChange('saturation', 0)}
              />
              <CheckboxField
                label="Invert Colors"
                checked={jointAdjustments.invertColors}
                onChange={(checked) => onJointAdjustmentChange('invertColors', checked)}
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
