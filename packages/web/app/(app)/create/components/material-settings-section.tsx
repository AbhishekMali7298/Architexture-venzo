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
  materialTint,
  width,
  height,
  toneVariation,
  jointHorizontal,
  jointVertical,
  jointTint,
  linkedJoints,
  recessJoints,
  concaveJoints,
  edgeStyle,
  edgeScale,
  edgeWidth,
  onOpenPicker,
  onMaterialTintChange,
  onWidthChange,
  onHeightChange,
  onJointHorizontalChange,
  onJointVerticalChange,
  onJointTintChange,
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
  materialTint: string | null;
  width: number;
  height: number;
  toneVariation: number;
  jointHorizontal: number;
  jointVertical: number;
  jointTint: string | null;
  linkedJoints: boolean;
  recessJoints: boolean;
  concaveJoints: boolean;
  edgeStyle: EdgeStyle;
  edgeScale: number;
  edgeWidth: number;
  onOpenPicker: () => void;
  onMaterialTintChange: (value: string | null) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
  onJointTintChange: (value: string | null) => void;
  onLinkedJointsChange: (value: boolean) => void;
  onRecessJointsChange: (value: boolean) => void;
  onConcaveJointsChange: (value: boolean) => void;
  onEdgeStyleChange: (value: EdgeStyle) => void;
  onEdgeScaleChange: (value: number) => void;
  onEdgeWidthChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
}) {
  const [showEdgePopup, setShowEdgePopup] = useState(false);
  const toneVariationUi = Number((toneVariation / 100).toFixed(2));
  const edgeStyleLabel = EDGE_STYLE_OPTIONS.find((option) => option.value === edgeStyle)?.label ?? edgeStyle;

  return (
    <>
      <SectionCard title="Material">
        <button className={`${styles.selectionButton} ${styles.selectionButtonCompact}`} type="button" onClick={onOpenPicker}>
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{materialName}</span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{materialCategory}</span>
          </span>
          <MaterialThumb color={materialColor} src={materialThumbnailUrl} alt={materialName} size={36} compact />
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

        <div className={styles.gridTwo}>
          <NumberField label="H Joint" value={jointHorizontal} min={0} max={500} unit="mm" onChange={onJointHorizontalChange} />
          <NumberField label="V Joint" value={jointVertical} min={0} max={500} unit="mm" onChange={onJointVerticalChange} />
        </div>

        <label className={styles.checkboxRow}>
          <input type="checkbox" checked={linkedJoints} onChange={(event) => onLinkedJointsChange(event.target.checked)} />
          <span>Link joint sizes</span>
        </label>

        <ColorField label="Joint Tint" value={jointTint ?? '#FFFFFF'} onChange={(value) => onJointTintChange(value || null)} />

        <label className={styles.checkboxRow}>
          <input type="checkbox" checked={recessJoints} onChange={(event) => onRecessJointsChange(event.target.checked)} />
          <span>Recess joints</span>
        </label>

        <label className={styles.checkboxRow}>
          <input type="checkbox" checked={concaveJoints} onChange={(event) => onConcaveJointsChange(event.target.checked)} />
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
                label="Scale"
                value={edgeScale}
                min={0}
                max={5}
                step={0.1}
                valueText={edgeScale.toFixed(1)}
                onChange={onEdgeScaleChange}
              />

              <NumberField label="Width" value={edgeWidth} min={0} max={100} onChange={onEdgeWidthChange} />
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
