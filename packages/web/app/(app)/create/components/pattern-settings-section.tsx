'use client';

import { getPatternByType, type PatternOrientation, type PatternType } from '@textura/shared';
import { getPatternPreviewUrl } from '../lib/pattern-assets';
import { isVerticalPatternOrientation, supportsPatternOrientationToggle } from '../lib/pattern-orientation';
import type { PatternFieldSchema } from '../lib/pattern-sidebar-schema';
import { NumberField, SectionCard } from './field-controls';
import { PatternThumb } from './pattern-thumb';
import styles from './create-editor.module.css';

export function PatternSettingsSection({
  patternType,
  orientation,
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
  onToggleOrientation,
  onStretchersChange,
  onWeavesChange,
}: {
  patternType: PatternType;
  orientation: PatternOrientation;
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
  onToggleOrientation: () => void;
  onStretchersChange: (value: number) => void;
  onWeavesChange: (value: number) => void;
}) {
  const pattern = getPatternByType(patternType);
  if (!pattern) return null;
  const showOrientationToggle = supportsPatternOrientationToggle(patternType);
  const isVerticalOrientation = isVerticalPatternOrientation(orientation);
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
      <div className={styles.selectionButtonShell}>
        <button
          className={`${styles.selectionButton} ${styles.selectionButtonCompact} ${showOrientationToggle ? styles.selectionButtonWithInsetAction : ''}`}
          type="button"
          onClick={onOpenPicker}
        >
          <span className={`${styles.selectionText} ${styles.selectionTextCompact}`}>
            <span className={`${styles.selectionLabel} ${styles.selectionLabelCompact}`}>{pattern.displayName}</span>
            <span className={`${styles.selectionMeta} ${styles.selectionMetaCompact}`}>{pattern.description}</span>
          </span>
          <PatternThumb
            path={pattern.previewPath}
            src={getPatternPreviewUrl(pattern)}
            alt={pattern.displayName}
            size={36}
            compact
          />
        </button>

        {showOrientationToggle ? (
          <button
            className={`${styles.patternOrientationButtonInset} ${isVerticalOrientation ? styles.patternOrientationButtonActive : ''}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleOrientation();
            }}
            aria-label={isVerticalOrientation ? 'Switch to horizontal pattern orientation' : 'Switch to vertical pattern orientation'}
            title={isVerticalOrientation ? 'Switch to horizontal pattern orientation' : 'Switch to vertical pattern orientation'}
          >
            <svg
              className={styles.patternOrientationIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isVerticalOrientation ? (
                <>
                  <rect x="4" y="4" width="4" height="16" rx="1.5" />
                  <rect x="10" y="4" width="4" height="16" rx="1.5" />
                  <rect x="16" y="4" width="4" height="16" rx="1.5" />
                </>
              ) : (
                <>
                  <rect x="4" y="4" width="16" height="4" rx="1.5" />
                  <rect x="4" y="10" width="16" height="4" rx="1.5" />
                  <rect x="4" y="16" width="16" height="4" rx="1.5" />
                </>
              )}
            </svg>
          </button>
        ) : null}
      </div>

      {numericFields.length > 0 ? (
        <div className={styles.gridTwo}>
          {numericFields.map((field) => {
            const range = fieldRangeMap[field.id];
            const step =
              field.id === 'rows'
                ? Math.max(1, pattern.rowMultiple)
                : field.id === 'columns'
                  ? Math.max(1, pattern.columnMultiple)
                  : 'step' in range
                    ? range.step
                    : 1;
            return (
              <NumberField
                key={field.id}
                label={field.label}
                value={fieldValueMap[field.id]}
                min={range.min}
                max={range.max}
                step={step}
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
