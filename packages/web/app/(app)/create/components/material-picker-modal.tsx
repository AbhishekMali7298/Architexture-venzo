'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MATERIAL_CATEGORIES, MATERIAL_LIBRARY, type MaterialDefinition } from '@textura/shared';
import { getMaterialThumbnailUrl } from '../lib/material-assets';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

function CategorySelector({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; displayName: string }[];
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    value === 'all'
      ? 'All categories'
      : options.find((o) => o.id === value)?.displayName || value;

  const filteredOptions = useMemo(() => {
    return options.filter((o) => o.displayName.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.customSelectWrapper} ref={containerRef}>
      <button
        type="button"
        className={styles.customSelectTrigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <span className={styles.chevron}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.customSelectMenu}>
          <div className={styles.customSelectSearchWrap}>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus -- intended behavior for a custom dropdown search
              autoFocus
              className={styles.customSelectSearch}
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.customSelectList}>
            <button
              type="button"
              className={`${styles.customSelectOption} ${value === 'all' ? styles.customSelectOptionActive : ''}`}
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
            >
              All categories
            </button>
            {filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`${styles.customSelectOption} ${value === opt.id ? styles.customSelectOptionActive : ''}`}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
              >
                {opt.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MaterialPickerModal({
  currentMaterialId,
  onClose,
  onSelect,
}: {
  currentMaterialId: string | null;
  onClose: () => void;
  onSelect: (material: MaterialDefinition) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | string>('all');

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of MATERIAL_CATEGORIES) {
      map.set(item.id, item.displayName);
    }
    return map;
  }, []);

  const filteredLibrary = useMemo(() => {
    const normalized = search.trim().toLowerCase().replace(/\s+/g, ' ');
    const terms = normalized ? normalized.split(' ') : [];

    return MATERIAL_LIBRARY.filter((material) => {
      if (category !== 'all' && material.categoryId !== category) {
        return false;
      }

      if (terms.length === 0) {
        return true;
      }

      const categoryLabel = categoryLabelById.get(material.categoryId) ?? material.categoryId;
      const haystack = [material.name, material.categoryId, categoryLabel, material.id]
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
              <h2 className={styles.modalTitle}>Choose Material</h2>
              <p className={styles.modalDescription}>Use the shared material registry and carry dimensions into the editor.</p>
            </div>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close material picker">
              ✕
            </button>
          </div>
          <div className={styles.modalTools}>
            <input
              className={styles.input}
              placeholder="Search materials"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <CategorySelector
              value={category}
              options={MATERIAL_CATEGORIES}
              onChange={setCategory}
            />
          </div>
        </div>

        <div className={styles.modalBody}>
          {MATERIAL_CATEGORIES.map((category) => {
            const materials = filteredLibrary.filter((material) => material.categoryId === category.id);
            if (!materials.length) return null;
            return (
              <section key={category.id} className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>{category.displayName}</h3>
                <div className={styles.optionGrid}>
                  {materials.map((material) => (
                    <button
                      key={material.id}
                      className={`${styles.optionButton} ${currentMaterialId === material.id ? styles.optionButtonActive : ''}`}
                      type="button"
                      onClick={() => {
                        onSelect(material);
                        onClose();
                      }}
                    >
                      <MaterialThumb color={material.swatchColor} src={getMaterialThumbnailUrl(material)} alt={material.name} shape="square" />
                      <div>
                        <div className={styles.optionName}>{material.name}</div>
                        <div className={styles.optionMeta}>
                          {material.defaults.width} × {material.defaults.height} mm
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
