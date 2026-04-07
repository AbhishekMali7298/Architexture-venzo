'use client';

import { useState } from 'react';
import type { EdgeStyle } from '@textura/shared';
import { ColorField, NumberField, RangeField, SectionCard, SelectField } from './field-controls';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
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
  linkedJoints,
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
  onLinkedJointsChange,
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
  linkedJoints: boolean;
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
  onLinkedJointsChange: (value: boolean) => void;
  onEdgeStyleChange: (value: EdgeStyle) => void;
  onEdgeScaleChange: (value: number) => void;
  onEdgeWidthChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
}) {
  const [showEdgePopup, setShowEdgePopup] = useState(false);
  const toneVariationUi = Number((toneVariation / 100).toFixed(2));
  const edgeStyleLabel = EDGE_STYLE_OPTIONS.find((option) => option.value === edgeStyle)?.label ?? edgeStyle;
  const isHandmade = edgeStyle === 'handmade';

  return (
    <>
      <SectionCard title="Material">
        <button className={`${styles.selectionButton} ${styles.selectionButtonCompact}`} type="button" onClick={onOpenPicker}>
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{materialName}</span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{materialCategory}</span>
          </span>
          <MaterialThumb color={materialColor} src={materialThumbnailUrl} alt={materialName} size={36} compact shape="square" />
        </button>

        <div className={styles.gridTwo}>
          <NumberField label="Width" value={width} min={1} max={5000} unit="mm" onChange={onWidthChange} />
          <NumberField label="Height" value={height} min={1} max={5000} unit="mm" onChange={onHeightChange} />
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
          <MaterialThumb color={jointTint ?? '#d4cfc6'} src={jointMaterialThumbnailUrl} alt={jointMaterialName} size={36} compact shape="circle" />
        </button>

        <div className={styles.jointDimensionRow}>
          <NumberField label="H Joint" value={jointHorizontal} min={0} max={500} unit="mm" onChange={onJointHorizontalChange} />
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
          <NumberField label="V Joint" value={jointVertical} min={0} max={500} unit="mm" onChange={onJointVerticalChange} />
        </div>

        <ColorField label="Joint Tint" value={jointTint ?? '#FFFFFF'} onChange={(value) => onJointTintChange(value || null)} />

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
                label={isHandmade ? 'Handmade Scale' : 'Scale'}
                value={edgeScale}
                min={isHandmade ? 0.5 : 0}
                max={isHandmade ? 4 : 5}
                step={0.1}
                valueText={edgeScale.toFixed(1)}
                onChange={onEdgeScaleChange}
              />

              {isHandmade ? (
                <div className={styles.hint}>
                  Handmade uses the preset edge profile with width fixed to 25.
                </div>
              ) : (
                <NumberField label="Width" value={edgeWidth} min={0} max={100} onChange={onEdgeWidthChange} />
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
