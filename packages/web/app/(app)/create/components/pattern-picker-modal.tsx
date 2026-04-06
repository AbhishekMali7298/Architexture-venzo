'use client';

import { useMemo, useState } from 'react';
import { PATTERN_CATALOG, type PatternDefinition, type PatternType } from '@textura/shared';
import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

function getPatternPreviewUrl(pattern: PatternDefinition) {
  const filename = pattern.previewAssetPath?.split('/').pop() ?? `${pattern.type}.svg`;
  return `/patterns/${filename}`;
}

const ENABLED_PATTERN_TYPES = new Set<PatternType>(['stack_bond', 'stretcher_bond', 'flemish_bond', 'herringbone', 'chevron']);

function PatternPreview({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className={styles.patternPreviewFrame}>
      <img className={styles.patternPreviewImage} src={src} alt={alt} />
    </div>
  );
}

export function PatternPickerModal({
  currentPattern,
  onClose,
  onSelect,
}: {
  currentPattern: PatternType;
  onClose: () => void;
  onSelect: (pattern: PatternDefinition) => void;
}) {
  const [search, setSearch] = useState('');

  const filteredLibrary = useMemo(() => {
    const normalized = search.trim().toLowerCase().replace(/\s+/g, ' ');
    const terms = normalized ? normalized.split(' ') : [];

    return PATTERN_CATALOG.filter((pattern) => {
      if (terms.length === 0) {
        return true;
      }

      const haystack = [pattern.displayName, pattern.description, pattern.type, pattern.category]
        .join(' ')
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [search]);

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Choose Pattern</h2>
              <p className={styles.modalDescription}>Browse the uploaded pattern thumbnails and choose the active layout.</p>
            </div>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close pattern picker">
              ✕
            </button>
          </div>
          <div className={styles.modalTools}>
            <input
              className={styles.input}
              placeholder="Search patterns"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.patternOptionGrid}>
            {filteredLibrary.map((pattern) => {
              const enabled = ENABLED_PATTERN_TYPES.has(pattern.type);
              return (
                <button
                  key={pattern.type}
                  className={`${styles.patternOptionButton} ${currentPattern === pattern.type ? styles.patternOptionButtonActive : ''} ${!enabled ? styles.patternOptionButtonDisabled : ''}`}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    onSelect(pattern);
                    onClose();
                  }}
                >
                  <PatternPreview src={getPatternPreviewUrl(pattern)} alt={pattern.displayName} />
                  <div className={styles.patternOptionName}>{pattern.displayName}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
