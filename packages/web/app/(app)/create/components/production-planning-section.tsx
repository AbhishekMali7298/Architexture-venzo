'use client';

import { NumberField, RangeField, SectionCard } from './field-controls';
import styles from './create-editor.module.css';

export function ProductionPlanningSection({
  units,
  requestedWidth,
  requestedHeight,
  onRequestedWidthChange,
  onRequestedHeightChange,
  onFitToRequestedSize,
  fittedWidth,
  fittedHeight,
  widthDelta,
  heightDelta,
  productionWidth,
  productionHeight,
  rows,
  columns,
  unitWidthLabel,
  unitHeightLabel,
  unitWidth,
  unitHeight,
  jointHorizontal,
  jointVertical,
  sheetPreviewLabel,
  sheetCoverageText,
  zoom,
  onZoomChange,
  isImpressPattern = false,
}: {
  units: 'mm' | 'inches';
  requestedWidth: number;
  requestedHeight: number;
  onRequestedWidthChange: (value: number) => void;
  onRequestedHeightChange: (value: number) => void;
  onFitToRequestedSize: () => void;
  fittedWidth: string;
  fittedHeight: string;
  widthDelta: string;
  heightDelta: string;
  productionWidth: string;
  productionHeight: string;
  rows: number;
  columns: number;
  unitWidthLabel: string;
  unitHeightLabel: string;
  unitWidth: string;
  unitHeight: string;
  jointHorizontal: string;
  jointVertical: string;
  sheetPreviewLabel: string;
  sheetCoverageText: string | null;
  zoom: number;
  onZoomChange: (value: number) => void;
  isImpressPattern?: boolean;
}) {
  const unitSuffix = units === 'inches' ? 'in' : 'mm';
  const showSheetZoom = sheetPreviewLabel !== 'Pattern only';

  return (
    <>
      {isImpressPattern ? null : (
        <SectionCard
          title="Client Size"
          action={
            <button
              className={styles.primaryOutlineButtonCompact}
              type="button"
              onClick={onFitToRequestedSize}
            >
              Fit Pattern
            </button>
          }
        >
          <div className={styles.gridTwo}>
            <NumberField
              label="Target Width"
              value={requestedWidth}
              min={1}
              max={50000}
              unit={unitSuffix}
              commitOnChange={false}
              onChange={onRequestedWidthChange}
            />
            <NumberField
              label="Target Height"
              value={requestedHeight}
              min={1}
              max={50000}
              unit={unitSuffix}
              commitOnChange={false}
              onChange={onRequestedHeightChange}
            />
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>Best Fit Result</div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Actual Width</span>
                <strong className={styles.summaryValue}>{fittedWidth}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Actual Height</span>
                <strong className={styles.summaryValue}>{fittedHeight}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Width Variance</span>
                <strong className={styles.summaryValue}>{widthDelta}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Height Variance</span>
                <strong className={styles.summaryValue}>{heightDelta}</strong>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Production">
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pattern Width</span>
            <strong className={styles.summaryValue}>{productionWidth}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pattern Height</span>
            <strong className={styles.summaryValue}>{productionHeight}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Rows × Columns</span>
            <strong className={styles.summaryValue}>
              {rows} × {columns}
            </strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Sheet Preview</span>
            <strong className={styles.summaryValue}>{sheetPreviewLabel}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{unitWidthLabel}</span>
            <strong className={styles.summaryValue}>{unitWidth}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{unitHeightLabel}</span>
            <strong className={styles.summaryValue}>{unitHeight}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>H Joint</span>
            <strong className={styles.summaryValue}>{jointHorizontal}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>V Joint</span>
            <strong className={styles.summaryValue}>{jointVertical}</strong>
          </div>
        </div>
        {showSheetZoom ? (
          <RangeField
            label="Pattern Zoom"
            value={Math.round(zoom * 100)}
            min={25}
            max={200}
            step={5}
            valueText={`${Math.round(zoom * 100)}%`}
            onChange={(value) => onZoomChange(value / 100)}
          />
        ) : null}
        {sheetCoverageText ? <div className={styles.hint}>{sheetCoverageText}</div> : null}
      </SectionCard>
    </>
  );
}
