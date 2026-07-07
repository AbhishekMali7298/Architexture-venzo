import { NumberField, SelectField } from './field-controls';
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
        <SelectField
          label="Canvas Mode"
          value={sheetPreviewPreset}
          direction="up"
          options={[
            { value: 'none', label: 'Pattern only' },
            { value: '4x8', label: '4 × 8 ft sheet' },
            { value: '4x10', label: '4 × 10 ft sheet' },
            { value: 'custom', label: 'Custom sheet' },
          ]}
          onChange={(val) => onSheetPreviewPresetChange(val as SheetPreviewPreset)}
        />
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
