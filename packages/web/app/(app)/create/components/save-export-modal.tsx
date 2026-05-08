'use client';

import { useState } from 'react';
import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

export type ExportFormat = 'png' | 'svg' | 'jpg' | 'pdf' | 'dxf';

export function SaveExportModal({
  onClose,
  onShare,
  onSaveLocal,
  onDownload,
}: {
  onClose: () => void;
  onShare: () => Promise<void> | void;
  onSaveLocal: () => void;
  onDownload: (format: ExportFormat) => Promise<void> | void;
}) {
  const [format, setFormat] = useState<ExportFormat>('png');

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Save Texture</h2>
              <p className={styles.modalDescription}>Choose an export format, save locally, or copy a share link.</p>
            </div>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close save modal">
              ✕
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalSection}>
            <div className={styles.modalSectionTitle}>Export Format</div>
            <div className={styles.exportFormatGrid}>
              {(['png', 'svg', 'jpg', 'pdf', 'dxf'] as ExportFormat[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.exportFormatButton} ${format === option ? styles.exportFormatButtonActive : ''}`}
                  onClick={() => setFormat(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modalActionStack}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                onSaveLocal();
                onClose();
              }}
            >
              Save Locally
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                void onShare();
                onClose();
              }}
            >
              Share Link
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => {
                void onDownload(format);
              }}
            >
              Download {format.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
