'use client';

import { useMemo, useState } from 'react';
import { MATERIAL_CATEGORIES, MATERIAL_LIBRARY, type MaterialDefinition } from '@textura/shared';
import { getMaterialThumbnailUrl } from '../lib/material-assets';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

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
            <select
              className={styles.select}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {MATERIAL_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
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
