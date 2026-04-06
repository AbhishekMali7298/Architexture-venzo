'use client';

import { useMemo, useState } from 'react';
import { PATTERN_CATALOG, PATTERN_CATEGORIES, type PatternDefinition, type PatternType } from '@textura/shared';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

function getPatternPreviewUrl(pattern: PatternDefinition) {
  const filename = pattern.previewAssetPath?.split('/').pop() ?? `${pattern.type}.svg`;
  return `/patterns/${filename}`;
}

const ENABLED_PATTERN_TYPES = new Set<PatternType>(['stack_bond']);

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
  const [category, setCategory] = useState<'all' | string>('all');

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of PATTERN_CATEGORIES) {
      map.set(item.id, item.displayName);
    }
    return map;
  }, []);

  const filteredLibrary = useMemo(() => {
    const normalized = search.trim().toLowerCase().replace(/\s+/g, ' ');
    const terms = normalized ? normalized.split(' ') : [];

    return PATTERN_CATALOG.filter((pattern) => {
      if (category !== 'all' && pattern.category !== category) {
        return false;
      }

      if (terms.length === 0) {
        return true;
      }

      const categoryLabel = categoryLabelById.get(pattern.category) ?? pattern.category;
      const haystack = [pattern.displayName, pattern.description, pattern.type, pattern.category, categoryLabel]
        .join(' ')
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [category, categoryLabelById, search]);

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
            <select
              className={styles.select}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
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
          {PATTERN_CATEGORIES.map((item) => {
            const patterns = filteredLibrary.filter((pattern) => pattern.category === item.id);
            if (!patterns.length) return null;

            return (
              <section key={item.id} className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>{item.displayName}</h3>
                <div className={styles.optionGrid}>
                  {patterns.map((pattern) => {
                    const enabled = ENABLED_PATTERN_TYPES.has(pattern.type);
                    return (
                      <button
                        key={pattern.type}
                        className={`${styles.optionButton} ${currentPattern === pattern.type ? styles.optionButtonActive : ''} ${!enabled ? styles.optionButtonDisabled : ''}`}
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          onSelect(pattern);
                          onClose();
                        }}
                      >
                        <MaterialThumb color="#f3f1ec" src={getPatternPreviewUrl(pattern)} alt={pattern.displayName} />
                        <div>
                          <div className={styles.optionName}>{pattern.displayName}</div>
                          <div className={styles.optionMeta}>{enabled ? pattern.description : 'Coming soon'}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
