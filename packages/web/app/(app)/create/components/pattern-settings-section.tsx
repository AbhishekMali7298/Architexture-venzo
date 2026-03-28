'use client';

import { getPatternByType, type PatternType } from '@textura/shared';
import { getPatternPreviewUrl } from '../lib/pattern-assets';
import { NumberField, SectionCard } from './field-controls';
import { PatternThumb } from './pattern-thumb';
import styles from './create-editor.module.css';

export function PatternSettingsSection({
  patternType,
  rows,
  columns,
  angle,
  dimensionsHint,
  onOpenPicker,
  onRowsChange,
  onColumnsChange,
  onAngleChange,
}: {
  patternType: PatternType;
  rows: number;
  columns: number;
  angle: number;
  dimensionsHint: string;
  onOpenPicker: () => void;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
  onAngleChange: (value: number) => void;
}) {
  const pattern = getPatternByType(patternType);
  if (!pattern) return null;
  const canAdjustAngle = pattern.parameterRanges.angle.max > pattern.parameterRanges.angle.min;

  return (
    <SectionCard title="Pattern">
      <button className={styles.selectionButton} type="button" onClick={onOpenPicker}>
        <span className={styles.selectionText}>
          <span className={styles.selectionLabel}>{pattern.displayName}</span>
          <span className={styles.selectionMeta}>{pattern.description}</span>
        </span>
        <PatternThumb
          path={pattern.previewPath}
          src={getPatternPreviewUrl(pattern)}
          alt={pattern.displayName}
          size={64}
        />
      </button>

      <div className={styles.gridTwo}>
        <NumberField label="Rows" value={rows} min={1} max={100} step={1} onChange={onRowsChange} />
        <NumberField label="Columns" value={columns} min={1} max={100} step={1} onChange={onColumnsChange} />
      </div>

      {canAdjustAngle ? (
        <NumberField
          label="Angle"
          value={angle}
          min={pattern.parameterRanges.angle.min}
          max={pattern.parameterRanges.angle.max}
          step={pattern.parameterRanges.angle.step}
          onChange={onAngleChange}
        />
      ) : null}

      <div className={styles.hint}>{dimensionsHint}</div>
    </SectionCard>
  );
}
