'use client';

import { useMemo, useState } from 'react';
import { PATTERN_CATALOG, type PatternDefinition, type PatternType } from '@textura/shared';
import { getPatternPreviewImageUrl } from '../lib/material-assets';
import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

// Implemented pattern types
const IMPLEMENTED_PATTERNS = new Set<PatternType>([
  'stack_bond',
  'stretcher_bond',
  'flemish_bond',
  'herringbone',
  'chevron',
  'staggered',
  'venzowood',
  'venzowood_2',
  'venzowood_3',
  'venzowood_4',
  'venzowood_5',
]);

function PatternPreview({ src, alt }: { src: string; alt: string }) {
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
      if (!IMPLEMENTED_PATTERNS.has(pattern.type)) {
        return false;
      }

      if (terms.length === 0) {
        return true;
      }

      const haystack = [pattern.displayName, pattern.description, pattern.type, pattern.category]
        .join(' ')
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [search]);

  const handlePatternClick = (pattern: PatternDefinition) => {
    onSelect(pattern);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Choose Pattern</h2>
              <p className={styles.modalDescription}>
                Browse the pattern thumbnails and choose the active layout.
              </p>
            </div>
            <button
              className={styles.iconButton}
              type="button"
              onClick={onClose}
              aria-label="Close pattern picker"
            >
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
            {filteredLibrary.map((pattern) => (
              <button
                key={pattern.type}
                className={`${styles.patternOptionButton} ${
                  currentPattern === pattern.type ? styles.patternOptionButtonActive : ''
                }`}
                type="button"
                onClick={() => handlePatternClick(pattern)}
              >
                <PatternPreview
                  src={getPatternPreviewImageUrl(pattern.type) ?? `/patterns/${pattern.type}.svg`}
                  alt={pattern.displayName}
                />
                <span className={styles.patternOptionName}>{pattern.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
