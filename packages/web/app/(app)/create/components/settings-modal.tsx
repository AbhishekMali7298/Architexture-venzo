'use client';

import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

export function SettingsModal({
  units,
  showBorder,
  tileBackground,
  onClose,
  onUnitsChange,
  onShowBorderChange,
  onTileBackgroundChange,
}: {
  units: 'mm' | 'inches';
  showBorder: boolean;
  tileBackground: boolean;
  onClose: () => void;
  onUnitsChange: (units: 'mm' | 'inches') => void;
  onShowBorderChange: (checked: boolean) => void;
  onTileBackgroundChange: (checked: boolean) => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className={styles.settingsModalCard}>
        <div className={styles.settingsModalHeader}>
          <div className={styles.settingsModalTitle}>Settings</div>
          <button className={styles.settingsCloseButton} type="button" onClick={onClose} aria-label="Close settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.settingsModalBody}>
          <div className={styles.settingsIntro}>
            <h2 className={styles.settingsHeading}>Venzowood</h2>
            <p className={styles.settingsText}>
              Use the control panel to adjust parameters and preview the active Venzowood texture layout.
            </p>
          </div>

          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Units</div>
            <label className={styles.radioRow}>
              <input type="radio" name="units" checked={units === 'mm'} onChange={() => onUnitsChange('mm')} />
              <span>Millimetres (mm)</span>
            </label>
            <label className={styles.radioRow}>
              <input type="radio" name="units" checked={units === 'inches'} onChange={() => onUnitsChange('inches')} />
              <span>Inches (")</span>
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
              <input type="checkbox" checked={showBorder} onChange={(event) => onShowBorderChange(event.target.checked)} />
              <span>Show image border</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
