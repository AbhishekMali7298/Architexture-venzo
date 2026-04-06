'use client';

import { NumberField, SectionCard } from './field-controls';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function StackSettingsSection({
  rows,
  columns,
  previewUrl,
  widthHint,
  onRowsChange,
  onColumnsChange,
}: {
  rows: number;
  columns: number;
  previewUrl: string;
  widthHint: string;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
}) {
  return (
    <SectionCard title="Pattern">
      <div className={`${styles.selectionButton} ${styles.selectionButtonCompact}`}>
        <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
          <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>Stack</span>
          <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>Simple rectangular grid</span>
        </span>
        <MaterialThumb color="#f3f1ec" src={previewUrl} alt="Stack pattern" size={36} compact />
      </div>

      <div className={styles.gridTwo}>
        <NumberField label="Rows" value={rows} min={1} max={50} onChange={onRowsChange} />
        <NumberField label="Columns" value={columns} min={1} max={50} onChange={onColumnsChange} />
      </div>

      <div className={styles.hint}>{widthHint}</div>
    </SectionCard>
  );
}
