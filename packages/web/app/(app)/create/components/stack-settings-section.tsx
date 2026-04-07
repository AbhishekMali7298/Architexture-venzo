'use client';

import { getPatternByType } from '@textura/shared';
import { NumberField, SectionCard } from './field-controls';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function StackSettingsSection({
  patternName,
  patternType,
  rows,
  columns,
  angle,
  previewUrl,
  widthHint,
  onOpenPicker,
  onRowsChange,
  onColumnsChange,
  onAngleChange,
}: {
  patternName: string;
  patternType: string;
  rows: number;
  columns: number;
  angle: number;
  previewUrl: string;
  widthHint: string;
  onOpenPicker: () => void;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
  onAngleChange: (value: number) => void;
}) {
  // Get pattern definition to check if angle is applicable
  const patternDef = getPatternByType(patternType as any);
  const showAngleControl = patternDef && patternDef.parameterRanges.angle.max > 0;

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
        <MaterialThumb color="#f3f1ec" src={previewUrl} alt="Stack pattern" size={36} compact objectFit="contain" shape="square" />
      </button>

      <div className={styles.gridTwo}>
        <NumberField label="Rows" value={rows} min={1} max={50} onChange={onRowsChange} />
        <NumberField label="Columns" value={columns} min={1} max={50} onChange={onColumnsChange} />
      </div>

      {showAngleControl && (
        <div className={styles.field}>
          <NumberField
            label="Angle"
            value={angle}
            min={patternDef?.parameterRanges.angle.min ?? 0}
            max={patternDef?.parameterRanges.angle.max ?? 70}
            onChange={onAngleChange}
          />
        </div>
      )}

      <div className={styles.hint}>{widthHint}</div>
    </SectionCard>
  );
}
