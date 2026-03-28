'use client';

import type { EdgeStyle } from '@textura/shared';
import { CheckboxField, NumberField, RangeField, SectionCard, SelectField, TextField } from './field-controls';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function MaterialSettingsSection({
  materialName,
  materialCategory,
  materialColor,
  materialThumbnailUrl,
  materialTint,
  width,
  height,
  toneVariation,
  edgeStyle,
  jointTint,
  jointHorizontal,
  jointVertical,
  linkedJoints,
  onOpenPicker,
  onMaterialTintChange,
  onWidthChange,
  onHeightChange,
  onToneVariationChange,
  onEdgeStyleChange,
  onJointTintChange,
  onJointHorizontalChange,
  onJointVerticalChange,
  onLinkedJointsChange,
}: {
  materialName: string;
  materialCategory: string;
  materialColor: string;
  materialThumbnailUrl?: string | null;
  materialTint: string | null;
  width: number;
  height: number;
  toneVariation: number;
  edgeStyle: EdgeStyle;
  jointTint: string | null;
  jointHorizontal: number;
  jointVertical: number;
  linkedJoints: boolean;
  onOpenPicker: () => void;
  onMaterialTintChange: (value: string | null) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
  onEdgeStyleChange: (value: EdgeStyle) => void;
  onJointTintChange: (value: string | null) => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
  onLinkedJointsChange: (value: boolean) => void;
}) {
  const measurementUnit = 'mm';

  return (
    <SectionCard title="Material">
      <button className={styles.selectionButton} type="button" onClick={onOpenPicker}>
        <span className={styles.selectionText}>
          <span className={styles.selectionLabel}>{materialName}</span>
          <span className={styles.selectionMeta}>{materialCategory}</span>
        </span>
        <MaterialThumb color={materialColor} src={materialThumbnailUrl} alt={materialName} size={64} />
      </button>

      <div className={styles.gridTwo}>
        <NumberField label="Width" value={width} min={1} max={5000} unit={measurementUnit} onChange={onWidthChange} />
        <NumberField label="Height" value={height} min={1} max={5000} unit={measurementUnit} onChange={onHeightChange} />
      </div>

      <TextField label="Tint" value={materialTint ?? '#FFFFFF'} onChange={(value) => onMaterialTintChange(value || null)} />

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
      <TextField label="Tint" value={jointTint ?? '#FFFFFF'} onChange={(value) => onJointTintChange(value || null)} />

      <div className={styles.gridTwo}>
        <NumberField
          label="Horizontal"
          value={jointHorizontal}
          min={0}
          max={500}
          unit={measurementUnit}
          onChange={onJointHorizontalChange}
        />
        <NumberField
          label="Vertical"
          value={jointVertical}
          min={0}
          max={500}
          unit={measurementUnit}
          onChange={onJointVerticalChange}
        />
      </div>

      <CheckboxField label="Link joint dimensions" checked={linkedJoints} onChange={onLinkedJointsChange} />
    </SectionCard>
  );
}
