'use client';

import { ColorField, NumberField, RangeField, SectionCard } from './field-controls';
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
  jointHorizontal,
  jointVertical,
  onOpenPicker,
  onMaterialTintChange,
  onWidthChange,
  onHeightChange,
  onJointHorizontalChange,
  onJointVerticalChange,
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
  onOpenPicker: () => void;
  onMaterialTintChange: (value: string | null) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onJointHorizontalChange: (value: number) => void;
  onJointVerticalChange: (value: number) => void;
  onToneVariationChange: (value: number) => void;
}) {
  const toneVariationUi = Number((toneVariation / 200).toFixed(2));

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
        <NumberField label="Width" value={width} min={1} max={5000} unit="mm" onChange={onWidthChange} />
        <NumberField label="Height" value={height} min={1} max={5000} unit="mm" onChange={onHeightChange} />
      </div>

      <div className={styles.gridTwo}>
        <NumberField label="H Joint" value={jointHorizontal} min={0} max={500} unit="mm" onChange={onJointHorizontalChange} />
        <NumberField label="V Joint" value={jointVertical} min={0} max={500} unit="mm" onChange={onJointVerticalChange} />
      </div>

      <ColorField label="Tint" value={materialTint ?? '#FFFFFF'} onChange={(value) => onMaterialTintChange(value || null)} />

      <RangeField
        label="Tone Variation"
        value={toneVariationUi}
        min={0}
        max={0.5}
        step={0.01}
        valueText={toneVariationUi.toFixed(2)}
        onChange={(value) => onToneVariationChange(Math.round(value * 200))}
      />
    </SectionCard>
  );
}
