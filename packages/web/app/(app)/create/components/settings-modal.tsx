'use client';

import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

export function SettingsModal({
  showBorder,
  onClose,
  onShowBorderChange,
}: {
  showBorder: boolean;
  onClose: () => void;
  onShowBorderChange: (checked: boolean) => void;
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
            <h2 className={styles.settingsHeading}>Create Texture</h2>
            <p className={styles.settingsText}>
              This stripped-down editor only previews the active material while the pattern system is removed.
            </p>
          </div>

          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Preview</div>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={showBorder} onChange={(event) => onShowBorderChange(event.target.checked)} />
              <span>Show preview border</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
