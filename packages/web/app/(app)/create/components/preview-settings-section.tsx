import { NumberField } from './field-controls';
import type { SheetPreviewPreset } from '../lib/production-metrics';
import styles from './create-editor.module.css';

export function PreviewSettingsSection({
  sheetPreviewPreset,
  customSheetWidth,
  customSheetHeight,
  unitSuffix,
  onSheetPreviewPresetChange,
  onCustomSheetWidthChange,
  onCustomSheetHeightChange,
}: {
  sheetPreviewPreset: SheetPreviewPreset;
  customSheetWidth: number;
  customSheetHeight: number;
  unitSuffix: 'mm' | 'in';
  onSheetPreviewPresetChange: (preset: SheetPreviewPreset) => void;
  onCustomSheetWidthChange: (value: number) => void;
  onCustomSheetHeightChange: (value: number) => void;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Preview</h3>
      </div>
      <div className={styles.sectionBody}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Sheet Preview</span>
          <select
            className={styles.select}
            value={sheetPreviewPreset}
            onChange={(event) => onSheetPreviewPresetChange(event.target.value as SheetPreviewPreset)}
          >
            <option value="none">Pattern only</option>
            <option value="4x8">4 × 8 ft sheet</option>
            <option value="4x10">4 × 10 ft sheet</option>
            <option value="custom">Custom sheet</option>
          </select>
        </label>
        {sheetPreviewPreset === 'custom' ? (
          <div className={styles.gridTwo}>
            <NumberField
              label="Sheet Width"
              value={customSheetWidth}
              min={1}
              max={50000}
              unit={unitSuffix}
              onChange={onCustomSheetWidthChange}
            />
            <NumberField
              label="Sheet Height"
              value={customSheetHeight}
              min={1}
              max={50000}
              unit={unitSuffix}
              onChange={onCustomSheetHeightChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
