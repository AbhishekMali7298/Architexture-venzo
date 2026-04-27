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
  const [showNotImplementedPopup, setShowNotImplementedPopup] = useState(false);
  const [pendingPattern, setPendingPattern] = useState<PatternDefinition | null>(null);

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

  const handlePatternClick = (pattern: PatternDefinition) => {
    if (IMPLEMENTED_PATTERNS.has(pattern.type)) {
      onSelect(pattern);
      onClose();
    } else {
      setPendingPattern(pattern);
      setShowNotImplementedPopup(true);
    }
  };

  return (
    <>
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
              {filteredLibrary.map((pattern) => {
                const isImplemented = IMPLEMENTED_PATTERNS.has(pattern.type);
                return (
                  <button
                    key={pattern.type}
                    className={`${styles.patternOptionButton} ${
                      currentPattern === pattern.type ? styles.patternOptionButtonActive : ''
                    } ${!isImplemented ? styles.patternOptionButtonNotImplemented : ''}`}
                    type="button"
                    onClick={() => handlePatternClick(pattern)}
                  >
                    <PatternPreview
                      src={getPatternPreviewImageUrl(pattern.type) ?? `/patterns/${pattern.type}.svg`}
                      alt={pattern.displayName}
                    />
                    <span className={styles.patternOptionName}>{pattern.displayName}</span>
                    {!isImplemented && (
                      <span className={styles.patternNotImplementedBadge}>Coming soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Not Implemented Popup */}
      {showNotImplementedPopup && pendingPattern && (
        <Modal onClose={() => setShowNotImplementedPopup(false)}>
          <div className={styles.notImplementedCard}>
            <div className={styles.notImplementedHeader}>
              <h3 className={styles.notImplementedTitle}>Pattern Not Available</h3>
              <button
                className={styles.iconButton}
                type="button"
                onClick={() => setShowNotImplementedPopup(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className={styles.notImplementedBody}>
              <p className={styles.notImplementedText}>
                The <strong>{pendingPattern.displayName}</strong> pattern is not implemented yet.
              </p>
              <p className={styles.notImplementedHint}>
                This pattern is coming soon. Try one of the available patterns instead.
              </p>
            </div>
            <div className={styles.notImplementedFooter}>
              <button
                className={styles.notImplementedButton}
                type="button"
                onClick={() => setShowNotImplementedPopup(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
