'use client';

import type { EdgeStyle } from '@textura/shared';
import { NumberField, RangeField, SectionCard, SelectField } from './field-controls';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function MaterialSettingsSection({
  materialName,
  materialCategory,
  materialColor,
  materialThumbnailUrl,
  width,
  height,
  toneVariation,
  edgeStyle,
  jointHorizontal,
  jointVertical,
  onOpenPicker,
  onWidthChange,
  onHeightChange,
  onToneVariationChange,
  onEdgeStyleChange,
  onJointHorizontalChange,
  onJointVerticalChange,
}: {
  materialName: string;
  materialCategory: string;
  materialColor: string;
  materialThumbnailUrl?: string | null;
  width: number;
  height: number;
  toneVariation: number;
  edgeStyle: EdgeStyle;
  jointHorizontal: number;
  jointVertical: number;
  onOpenPicker: () => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
  onEdgeStyleChange: (value: EdgeStyle) => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
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

      <div className={styles.gridTwo}>
        <NumberField
          label="Horizontal Joint"
          value={jointHorizontal}
          min={0}
          max={500}
          unit={measurementUnit}
          onChange={onJointHorizontalChange}
        />
        <NumberField
          label="Vertical Joint"
          value={jointVertical}
          min={0}
          max={500}
          unit={measurementUnit}
          onChange={onJointVerticalChange}
        />
      </div>

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
    </SectionCard>
  );
}
