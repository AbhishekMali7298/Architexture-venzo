'use client';

import { useMemo, useState } from 'react';
import { MATERIAL_CATEGORIES, MATERIAL_LIBRARY, type MaterialDefinition } from '@textura/shared';
import { getMaterialThumbnailUrl } from '../lib/material-assets';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function JointMaterialPickerModal({
  currentMaterialId,
  isSolidFill,
  onClose,
  onSelectSolid,
  onSelectMaterial,
}: {
  currentMaterialId: string | null;
  isSolidFill: boolean;
  onClose: () => void;
  onSelectSolid: () => void;
  onSelectMaterial: (material: MaterialDefinition) => void;
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

  const showSolidFill = !search.trim() || 'solid fill'.includes(search.trim().toLowerCase());

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Choose Joint Material</h2>
              <p className={styles.modalDescription}>Select a solid fill or reuse a material from the shared library.</p>
            </div>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close joint material picker">
              ✕
            </button>
          </div>
          <input
            className={styles.input}
            placeholder="Search joint materials"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className={styles.modalBody}>
          {showSolidFill ? (
            <section className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Basic</h3>
              <div className={styles.optionGrid}>
                <button
                  className={`${styles.optionButton} ${isSolidFill ? styles.optionButtonActive : ''}`}
                  type="button"
                  onClick={() => {
                    onSelectSolid();
                    onClose();
                  }}
                >
                  <MaterialThumb color="#e8e6e0" alt="Solid Fill" />
                  <div>
                    <div className={styles.optionName}>Solid Fill</div>
                    <div className={styles.optionMeta}>Flat mortar/joint color</div>
                  </div>
                </button>
              </div>
            </section>
          ) : null}

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
                      className={`${styles.optionButton} ${currentMaterialId === material.id && !isSolidFill ? styles.optionButtonActive : ''}`}
                      type="button"
                      onClick={() => {
                        onSelectMaterial(material);
                        onClose();
                      }}
                    >
                      <MaterialThumb color={material.swatchColor} src={getMaterialThumbnailUrl(material)} alt={material.name} />
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
