'use client';

import { useMemo, useState } from 'react';
import { MATERIAL_CATEGORIES, MATERIAL_LIBRARY, type MaterialDefinition } from '@textura/shared';
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

  const filteredLibrary = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MATERIAL_LIBRARY;
    return MATERIAL_LIBRARY.filter((material) => {
      return (
        material.name.toLowerCase().includes(query) ||
        material.categoryId.toLowerCase().includes(query)
      );
    });
  }, [search]);

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
          <input
            className={styles.input}
            placeholder="Search materials"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
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
                      <MaterialThumb color={material.thumbnail.color} />
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
