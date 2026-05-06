'use client';

import type { SheetPreviewPreset } from '../lib/production-metrics';
import { NumberField } from './field-controls';
import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

export function SettingsModal({
  units,
  showBorder,
  tileBackground,
  sheetPreviewPreset,
  customSheetWidth,
  customSheetHeight,
  onClose,
  onUnitsChange,
  onShowBorderChange,
  onTileBackgroundChange,
  onSheetPreviewPresetChange,
  onCustomSheetWidthChange,
  onCustomSheetHeightChange,
}: {
  units: 'mm' | 'inches';
  showBorder: boolean;
  tileBackground: boolean;
  sheetPreviewPreset: SheetPreviewPreset;
  customSheetWidth: number;
  customSheetHeight: number;
  onClose: () => void;
  onUnitsChange: (units: 'mm' | 'inches') => void;
  onShowBorderChange: (checked: boolean) => void;
  onTileBackgroundChange: (checked: boolean) => void;
  onSheetPreviewPresetChange: (preset: SheetPreviewPreset) => void;
  onCustomSheetWidthChange: (value: number) => void;
  onCustomSheetHeightChange: (value: number) => void;
}) {
  const unitSuffix = units === 'inches' ? 'in' : 'mm';

  return (
    <Modal onClose={onClose}>
      <div className={styles.settingsModalCard}>
        <div className={styles.settingsModalHeader}>
          <div className={styles.settingsModalTitle}>Settings</div>
          <button
            className={styles.settingsCloseButton}
            type="button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.settingsModalBody}>
          <div className={styles.settingsIntro}>
            <h2 className={styles.settingsHeading}>Venzowood</h2>
            <p className={styles.settingsText}>
              Use the control panel to adjust parameters and preview the active Venzowood texture
              layout.
            </p>
          </div>

          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Units</div>
            <label className={styles.radioRow}>
              <input
                type="radio"
                name="units"
                checked={units === 'mm'}
                onChange={() => onUnitsChange('mm')}
              />
              <span>Millimetres (mm)</span>
            </label>
            <label className={styles.radioRow}>
              <input
                type="radio"
                name="units"
                checked={units === 'inches'}
                onChange={() => onUnitsChange('inches')}
              />
              <span>Inches (&quot;)</span>
            </label>
          </div>

          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Preview</div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={tileBackground}
                onChange={(event) => onTileBackgroundChange(event.target.checked)}
              />
              <span>Tile texture in background</span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={showBorder}
                onChange={(event) => onShowBorderChange(event.target.checked)}
              />
              <span>Show image border</span>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Sheet Preview</span>
              <select
                className={styles.select}
                value={sheetPreviewPreset}
                onChange={(event) => onSheetPreviewPresetChange(event.target.value as SheetPreviewPreset)}
              >
                <option value="none">Pattern only</option>
                <option value="8x4">8 × 4 ft sheet</option>
                <option value="10x4">10 × 4 ft sheet</option>
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
      </div>
    </Modal>
  );
}
