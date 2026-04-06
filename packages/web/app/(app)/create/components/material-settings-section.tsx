'use client';

import { ColorField, RangeField, SectionCard } from './field-controls';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function MaterialSettingsSection({
  materialName,
  materialCategory,
  materialColor,
  materialThumbnailUrl,
  materialTint,
  toneVariation,
  onOpenPicker,
  onMaterialTintChange,
  onToneVariationChange,
}: {
  materialName: string;
  materialCategory: string;
  materialColor: string;
  materialThumbnailUrl?: string | null;
  materialTint: string | null;
  toneVariation: number;
  onOpenPicker: () => void;
  onMaterialTintChange: (value: string | null) => void;
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

      <div className={styles.hint}>This editor is now a material-only baseline.</div>
    </SectionCard>
  );
}
