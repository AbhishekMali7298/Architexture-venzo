'use client';

import { getPatternByType, type PatternType } from '@textura/shared';
import { getPatternPreviewUrl } from '../lib/pattern-assets';
import type { PatternFieldSchema } from '../lib/pattern-sidebar-schema';
import { NumberField, SectionCard } from './field-controls';
import { PatternThumb } from './pattern-thumb';
import styles from './create-editor.module.css';

export function PatternSettingsSection({
  patternType,
  rows,
  columns,
  angle,
  stretchers,
  weaves,
  fields,
  dimensionsHint,
  semanticsHint,
  onOpenPicker,
  onRowsChange,
  onColumnsChange,
  onAngleChange,
  onStretchersChange,
  onWeavesChange,
}: {
  patternType: PatternType;
  rows: number;
  columns: number;
  angle: number;
  stretchers: number;
  weaves: number;
  fields: PatternFieldSchema[];
  dimensionsHint: string;
  semanticsHint?: string;
  onOpenPicker: () => void;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
  onAngleChange: (value: number) => void;
  onStretchersChange: (value: number) => void;
  onWeavesChange: (value: number) => void;
}) {
  const pattern = getPatternByType(patternType);
  if (!pattern) return null;
  const fieldValueMap = {
    rows,
    columns,
    angle,
    stretchers,
    weaves,
  } as const;
  const fieldChangeMap = {
    rows: onRowsChange,
    columns: onColumnsChange,
    angle: onAngleChange,
    stretchers: onStretchersChange,
    weaves: onWeavesChange,
  } as const;
  const fieldRangeMap = {
    rows: pattern.parameterRanges.rows,
    columns: pattern.parameterRanges.columns,
    angle: pattern.parameterRanges.angle,
    stretchers: pattern.parameterRanges.stretchers ?? { min: 1, max: 10, step: 1 },
    weaves: pattern.parameterRanges.weaves ?? { min: 1, max: 10, step: 1 },
  } as const;
  const numericFields = fields.filter((field) => field.id !== 'angle');
  const angleField = fields.find((field) => field.id === 'angle');

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

      {numericFields.length > 0 ? (
        <div className={styles.gridTwo}>
          {numericFields.map((field) => {
            const range = fieldRangeMap[field.id];
            return (
              <NumberField
                key={field.id}
                label={field.label}
                value={fieldValueMap[field.id]}
                min={range.min}
                max={range.max}
                step={'step' in range ? range.step : 1}
                commitOnChange={field.commitOnChange}
                onChange={fieldChangeMap[field.id]}
              />
            );
          })}
        </div>
      ) : null}

      {angleField ? (
        <NumberField
          label={angleField.label}
          value={angle}
          min={pattern.parameterRanges.angle.min}
          max={pattern.parameterRanges.angle.max}
          step={pattern.parameterRanges.angle.step}
          commitOnChange={angleField.commitOnChange ?? true}
          onChange={onAngleChange}
        />
      ) : null}

      {semanticsHint ? <div className={styles.hint}>{semanticsHint}</div> : null}
      <div className={styles.hint}>{dimensionsHint}</div>
    </SectionCard>
  );
}
