'use client';

import { getPatternByType, type PatternType } from '@textura/shared';
import { getPatternPreviewUrl } from '../lib/pattern-assets';
import { NumberField, RangeField, SectionCard, SelectField } from './field-controls';
import { PatternThumb } from './pattern-thumb';
import styles from './create-editor.module.css';

export function PatternSettingsSection({
  patternType,
  rows,
  columns,
  angle,
  units,
  dimensionsHint,
  onOpenPicker,
  onRowsChange,
  onColumnsChange,
  onAngleChange,
  onUnitsChange,
}: {
  patternType: PatternType;
  rows: number;
  columns: number;
  angle: number;
  units: 'mm' | 'inches';
  dimensionsHint: string;
  onOpenPicker: () => void;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
  onAngleChange: (value: number) => void;
  onUnitsChange: (value: 'mm' | 'inches') => void;
}) {
  const pattern = getPatternByType(patternType);
  if (!pattern) return null;
  const measurementUnit = units === 'inches' ? 'in' : 'mm';

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

      <div className={styles.gridTwo}>
        <RangeField label="Angle" value={angle} min={0} max={360} onChange={onAngleChange} />
        <SelectField
          label="Units"
          value={units}
          options={[
            { value: 'mm', label: 'Millimetres' },
            { value: 'inches', label: 'Inches' },
          ]}
          onChange={(value) => onUnitsChange(value as 'mm' | 'inches')}
        />
      </div>

      <div className={styles.hint}>{dimensionsHint} {measurementUnit === 'in' ? '(tile sizing shown in inches)' : ''}</div>
    </SectionCard>
  );
}
