'use client';

import { useMemo, useState } from 'react';
import { PATTERN_CATALOG, PATTERN_CATEGORIES, type PatternCategory, type PatternType } from '@textura/shared';
import { getPatternPreviewUrl } from '../lib/pattern-assets';
import { Modal } from './modal-portal';
import { PatternThumb } from './pattern-thumb';
import styles from './create-editor.module.css';

export function PatternPickerModal({
  currentPattern,
  onClose,
  onSelect,
}: {
  currentPattern: PatternType;
  onClose: () => void;
  onSelect: (patternType: PatternType, category: PatternCategory) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | PatternCategory>('all');

  const filteredPatterns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PATTERN_CATALOG.filter((pattern) => {
      const categoryMatch = category === 'all' || pattern.category === category;
      if (!categoryMatch) return false;
      if (!query) return true;
      return (
        pattern.displayName.toLowerCase().includes(query) ||
        pattern.description.toLowerCase().includes(query)
      );
    });
  }, [category, search]);

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Choose Pattern</h2>
              <p className={styles.modalDescription}>Browse the shared pattern registry and update the live preview.</p>
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
            <select
              className={styles.select}
              value={category}
              onChange={(event) => setCategory(event.target.value as 'all' | PatternCategory)}
            >
              <option value="all">All categories</option>
              {PATTERN_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.optionGrid}>
            {filteredPatterns.map((pattern) => (
              <button
                key={pattern.type}
                className={`${styles.optionButton} ${currentPattern === pattern.type ? styles.optionButtonActive : ''}`}
                type="button"
                onClick={() => {
                  onSelect(pattern.type, pattern.category);
                  onClose();
                }}
              >
                <PatternThumb
                  path={pattern.previewPath}
                  src={getPatternPreviewUrl(pattern)}
                  alt={pattern.displayName}
                />
                <div>
                  <div className={styles.optionName}>{pattern.displayName}</div>
                  <div className={styles.optionMeta}>{pattern.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
