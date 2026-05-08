'use client';

import { startTransition, useMemo, useState } from 'react';
import { PATTERN_CATALOG, type PatternDefinition, type PatternType } from '@textura/shared';
import { getPatternPreviewImageUrl } from '../lib/material-assets';
import { IMPRESS_PATTERN_TYPES, VITA_COMPONENT_PATTERN_TYPES } from '../lib/pattern-capabilities';
import { hasSvgPatternModule, primeSvgPatternModule } from '../lib/svg-pattern-module-cache';
import { Modal } from './modal-portal';
import styles from './create-editor.module.css';

// Implemented pattern types
const PATTERN_GROUPS: Array<{ title: string; patternTypes: PatternType[] }> = [
  {
    title: 'Impress',
    patternTypes: IMPRESS_PATTERN_TYPES,
  },
  {
    title: 'Vita Components',
    patternTypes: VITA_COMPONENT_PATTERN_TYPES,
  },
];

const SELECTABLE_PATTERNS = new Set(PATTERN_GROUPS.flatMap((group) => group.patternTypes));

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

  const groupedLibrary = useMemo(() => {
    const normalized = search.trim().toLowerCase().replace(/\s+/g, ' ');
    const terms = normalized ? normalized.split(' ') : [];
    const catalogByType = new Map(PATTERN_CATALOG.map((pattern) => [pattern.type, pattern]));

    return PATTERN_GROUPS.map((group) => ({
      ...group,
      patterns: group.patternTypes
        .map((type) => catalogByType.get(type))
        .filter((pattern): pattern is PatternDefinition => {
          if (!pattern || !SELECTABLE_PATTERNS.has(pattern.type)) {
            return false;
          }

          if (terms.length === 0) {
            return true;
          }

          const haystack = [
            pattern.displayName,
            pattern.description,
            pattern.type,
            pattern.category,
          ]
            .join(' ')
            .toLowerCase();

          return terms.every((term) => haystack.includes(term));
        }),
    })).filter((group) => group.patterns.length > 0);
  }, [search]);

  const handlePatternClick = (pattern: PatternDefinition) => {
    if (hasSvgPatternModule(pattern.type)) {
      primeSvgPatternModule(pattern.type);
    }
    onClose();
    requestAnimationFrame(() => {
      startTransition(() => {
        onSelect(pattern);
      });
    });
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
          {groupedLibrary.map((group) => (
            <section className={styles.patternGroup} key={group.title}>
              <h3 className={styles.patternGroupTitle}>{group.title}</h3>
              <div className={styles.patternOptionGrid}>
                {group.patterns.map((pattern) => (
                  <button
                    key={pattern.type}
                    className={`${styles.patternOptionButton} ${
                      currentPattern === pattern.type ? styles.patternOptionButtonActive : ''
                    }`}
                    type="button"
                    onMouseEnter={() => {
                      if (hasSvgPatternModule(pattern.type)) {
                        primeSvgPatternModule(pattern.type);
                      }
                    }}
                    onClick={() => handlePatternClick(pattern)}
                  >
                    <PatternPreview
                      src={
                        getPatternPreviewImageUrl(pattern.type) ?? `/patterns/${pattern.type}.svg`
                      }
                      alt={pattern.displayName}
                    />
                    <span className={styles.patternOptionName}>{pattern.displayName}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
