'use client';

import type { ImageAdjustments } from '@textura/shared';
import type { EdgeStyle } from '@textura/shared';
import { useState } from 'react';
import { CheckboxField, ColorField, NumberField, RangeField, SectionCard, SelectField, SliderField } from './field-controls';
import { MaterialThumb } from './material-thumb';
import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

export function MaterialSettingsSection({
  materialName,
  materialCategory,
  materialColor,
  materialThumbnailUrl,
  materialTint,
  width,
  height,
  widthLabel = 'Width',
  heightLabel = 'Height',
  dimensionHint,
  toneVariation,
  edgeStyle,
  jointTint,
  jointMaterialName,
  jointMaterialCategory,
  jointMaterialColor,
  jointMaterialThumbnailUrl,
  jointHorizontal,
  jointVertical,
  linkedJoints,
  jointAdjustments,
  jointRecess,
  jointConcave,
  units,
  onOpenPicker,
  onMaterialTintChange,
  onWidthChange,
  onHeightChange,
  onToneVariationChange,
  onEdgeStyleChange,
  onJointTintChange,
  onOpenJointMaterialPicker,
  onJointHorizontalChange,
  onJointVerticalChange,
  onLinkedJointsChange,
  onJointAdjustmentChange,
  onJointRecessChange,
  onJointConcaveChange,
}: {
  materialName: string;
  materialCategory: string;
  materialColor: string;
  materialThumbnailUrl?: string | null;
  materialTint: string | null;
  width: number;
  height: number;
  widthLabel?: string;
  heightLabel?: string;
  dimensionHint?: string;
  toneVariation: number;
  edgeStyle: EdgeStyle;
  jointTint: string | null;
  jointMaterialName: string;
  jointMaterialCategory?: string;
  jointMaterialColor: string;
  jointMaterialThumbnailUrl?: string | null;
  jointHorizontal: number;
  jointVertical: number;
  linkedJoints: boolean;
  jointAdjustments: ImageAdjustments;
  jointRecess: boolean;
  jointConcave: boolean;
  units: 'mm' | 'inches';
  onOpenPicker: () => void;
  onMaterialTintChange: (value: string | null) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
  onEdgeStyleChange: (value: EdgeStyle) => void;
  onJointTintChange: (value: string | null) => void;
  onOpenJointMaterialPicker: () => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
  onLinkedJointsChange: (value: boolean) => void;
  onJointAdjustmentChange: (key: keyof ImageAdjustments, value: number | boolean) => void;
  onJointRecessChange: (value: boolean) => void;
  onJointConcaveChange: (value: boolean) => void;
}) {
  const [showJointAdjustments, setShowJointAdjustments] = useState(false);
  const measurementUnit = units === 'inches' ? 'in' : 'mm';

  return (
    <SectionCard title="Material">
      <button className={`${styles.selectionButton} ${styles.selectionButtonCompact}`} type="button" onClick={onOpenPicker}>
        <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
          <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{materialName}</span>
          <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{materialCategory}</span>
        </span>
        <MaterialThumb color={materialColor} src={materialThumbnailUrl} alt={materialName} size={36} compact />
      </button>

      <div className={styles.gridTwo}>
        <NumberField label={widthLabel} value={width} min={1} max={5000} unit={measurementUnit} onChange={onWidthChange} />
        <NumberField label={heightLabel} value={height} min={1} max={5000} unit={measurementUnit} onChange={onHeightChange} />
      </div>
      {dimensionHint ? <div className={styles.hint}>{dimensionHint}</div> : null}

      <ColorField label="Tint" value={materialTint ?? '#FFFFFF'} onChange={(value) => onMaterialTintChange(value || null)} />

      <SelectField
        label="Edges"
        value={edgeStyle}
        options={[
          { value: 'none', label: 'None' },
          { value: 'fine', label: 'Fine' },
          { value: 'handmade', label: 'Handmade' },
          { value: 'rough', label: 'Rough' },
          { value: 'uneven', label: 'Uneven' },
        ]}
        onChange={(value) => onEdgeStyleChange(value as EdgeStyle)}
      />

      <RangeField label="Tone Variation" value={toneVariation} min={0} max={100} onChange={onToneVariationChange} />

      <div className={styles.sectionDivider} />

      <div className={styles.subsectionTitle}>Joints</div>
      <button className={`${styles.selectionButton} ${styles.selectionButtonCompact}`} type="button" onClick={onOpenJointMaterialPicker}>
        <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
          <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{jointMaterialName}</span>
          {jointMaterialCategory ? (
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{jointMaterialCategory}</span>
          ) : null}
        </span>
        <MaterialThumb color={jointMaterialColor} src={jointMaterialThumbnailUrl} alt={jointMaterialName} size={36} compact />
      </button>

      <ColorField
        label="Tint"
        value={jointTint ?? '#FFFFFF'}
        onChange={(value) => onJointTintChange(value || null)}
        action={
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Open joint adjustments"
            onClick={() => setShowJointAdjustments(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 21v-7" />
              <path d="M4 10V3" />
              <path d="M12 21v-9" />
              <path d="M12 8V3" />
              <path d="M20 21v-4" />
              <path d="M20 13V3" />
              <path d="M1 10h6" />
              <path d="M9 8h6" />
              <path d="M17 13h6" />
            </svg>
          </button>
        }
      />

      <div className={styles.jointDimensionRow}>
        <NumberField
          label="Horizontal"
          value={jointHorizontal}
          min={0}
          max={500}
          unit={measurementUnit}
          onChange={onJointHorizontalChange}
        />
        <button
          className={`${styles.jointLinkButton} ${linkedJoints ? styles.jointLinkButtonActive : ''}`}
          type="button"
          aria-label={linkedJoints ? 'Unlock joint dimensions' : 'Lock joint dimensions'}
          aria-pressed={linkedJoints}
          onClick={() => onLinkedJointsChange(!linkedJoints)}
        >
          {linkedJoints ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M16 11V8a4 4 0 1 0-8 0" />
            </svg>
          )}
        </button>
        <NumberField
          label="Vertical"
          value={jointVertical}
          min={0}
          max={500}
          unit={measurementUnit}
          onChange={onJointVerticalChange}
        />
      </div>

      <CheckboxField label="Recess joints" checked={jointRecess} onChange={onJointRecessChange} />
      <CheckboxField label="Concave joints" checked={jointConcave} onChange={onJointConcaveChange} />

      {showJointAdjustments ? (
        <Modal onClose={() => setShowJointAdjustments(false)}>
          <div className={styles.popoverCard}>
            <div className={styles.popoverHeader}>
              <h3 className={styles.popoverTitle}>Joint Adjustments</h3>
              <button
                className={styles.popoverCloseButton}
                type="button"
                onClick={() => setShowJointAdjustments(false)}
                aria-label="Close joint adjustments"
              >
                ×
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
                onChange={(value) => onJointAdjustmentChange('invertColors', value)}
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </SectionCard>
  );
}
