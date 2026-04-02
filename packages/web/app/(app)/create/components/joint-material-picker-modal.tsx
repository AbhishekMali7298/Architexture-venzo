'use client';

import { useEffect, useMemo, useState } from 'react';
import type { JointMaterialLibraryItem } from '../lib/joint-material-library';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

export function JointMaterialPickerModal({
  currentAssetPath,
  isSolidFill,
  onClose,
  onSelectSolid,
  onSelectMaterial,
}: {
  currentAssetPath: string | null;
  isSolidFill: boolean;
  onClose: () => void;
  onSelectSolid: () => void;
  onSelectMaterial: (material: JointMaterialLibraryItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [materials, setMaterials] = useState<JointMaterialLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/joint-materials');
        const data = (await response.json()) as JointMaterialLibraryItem[];
        if (!cancelled) {
          setMaterials(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setMaterials([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLibrary = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return materials;
    return materials.filter((material) => {
      return material.name.toLowerCase().includes(query);
    });
  }, [materials, search]);

  const showSolidFill = !search.trim() || 'solid fill'.includes(search.trim().toLowerCase());

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Choose Joint Material</h2>
              <p className={styles.modalDescription}>Select a solid fill or use images uploaded in the joints asset folder.</p>
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

          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Joint Assets</h3>
            {loading ? (
              <div className={styles.hint}>Loading joint materials…</div>
            ) : filteredLibrary.length === 0 ? (
              <div className={styles.hint}>No joint materials found in `assets/joints` yet.</div>
            ) : (
              <div className={styles.optionGrid}>
                {filteredLibrary.map((material) => (
                  <button
                    key={material.id}
                    className={`${styles.optionButton} ${currentAssetPath === material.renderPath && !isSolidFill ? styles.optionButtonActive : ''}`}
                    type="button"
                    onClick={() => {
                      onSelectMaterial(material);
                      onClose();
                    }}
                  >
                    <MaterialThumb color="#d8d3ca" src={`/api/assets/${material.thumbnailPath}`} alt={material.name} />
                    <div>
                      <div className={styles.optionName}>{material.name}</div>
                      <div className={styles.optionMeta}>{material.renderPath.split('/').slice(-2).join('/')}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Modal>
  );
}
