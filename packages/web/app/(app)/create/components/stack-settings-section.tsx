'use client';

import { NumberField, SectionCard } from './field-controls';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function StackSettingsSection({
  patternName,
  rows,
  columns,
  previewUrl,
  widthHint,
  onOpenPicker,
  onRowsChange,
  onColumnsChange,
}: {
  patternName: string;
  rows: number;
  columns: number;
  previewUrl: string;
  widthHint: string;
  onOpenPicker: () => void;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
}) {
  return (
    <SectionCard title="Pattern">
      <button
        className={`${styles.selectionButton} ${styles.selectionButtonCompact}`}
        type="button"
        onClick={onOpenPicker}
      >
        <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
          <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{patternName}</span>
          <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>Open pattern chooser</span>
        </span>
        <MaterialThumb color="#f3f1ec" src={previewUrl} alt="Stack pattern" size={36} compact objectFit="contain" />
      </button>

      <div className={styles.gridTwo}>
        <NumberField label="Rows" value={rows} min={1} max={50} onChange={onRowsChange} />
        <NumberField label="Columns" value={columns} min={1} max={50} onChange={onColumnsChange} />
      </div>

      <div className={styles.hint}>{widthHint}</div>
    </SectionCard>
  );
}
