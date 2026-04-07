'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MaterialAssetRef } from '@textura/shared';
import { Modal } from './modal-portal';
import { MaterialThumb } from './material-thumb';
import styles from './create-editor.module.css';

interface JointMaterialOption {
  id: string;
  name: string;
  thumbnailPath: string;
  renderPath: string;
  mimeType: string;
}

export function JointMaterialModal({
  currentRenderPath,
  onClose,
  onSelect,
}: {
  currentRenderPath: string | null;
  onClose: () => void;
  onSelect: (asset: MaterialAssetRef | null) => void;
}) {
  const [materials, setMaterials] = useState<JointMaterialOption[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/joint-materials')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load joint materials');
        }
        return response.json() as Promise<JointMaterialOption[]>;
      })
      .then((items) => {
        if (!cancelled) {
          setMaterials(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMaterials([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMaterials = useMemo(() => {
    const normalized = search.trim().toLowerCase().replace(/\s+/g, ' ');
    const terms = normalized ? normalized.split(' ') : [];

    return materials.filter((material) => {
      if (!terms.length) return true;
      const haystack = `${material.name} ${material.id}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [materials, search]);

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>Choose Joint Material</h2>
              <p className={styles.modalDescription}>Pick a solid fill or one of the local joint textures from `public/Joints-Patterns`.</p>
            </div>
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close joint material picker">
              ✕
            </button>
          </div>
          <div className={styles.modalTools}>
            <input
              className={styles.input}
              placeholder="Search joint materials"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalBody}>
          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Solid</h3>
            <div className={styles.optionGrid}>
              <button
                className={`${styles.optionButton} ${currentRenderPath === null ? styles.optionButtonActive : ''}`}
                type="button"
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
              >
                <MaterialThumb color="#d9d4ca" alt="Solid Fill" shape="circle" />
                <div>
                  <div className={styles.optionName}>Solid Fill</div>
                  <div className={styles.optionMeta}>Use the joint tint field as the final color</div>
                </div>
              </button>
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Joint Textures</h3>
            <div className={styles.optionGrid}>
              {filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  className={`${styles.optionButton} ${currentRenderPath === material.renderPath ? styles.optionButtonActive : ''}`}
                  type="button"
                  onClick={() => {
                    onSelect({
                      path: material.renderPath,
                      mimeType: material.mimeType,
                    });
                    onClose();
                  }}
                >
                  <MaterialThumb
                    color="#d9d4ca"
                    src={material.thumbnailPath}
                    alt={material.name}
                    shape="circle"
                  />
                  <div>
                    <div className={styles.optionName}>{material.name}</div>
                    <div className={styles.optionMeta}>{material.renderPath.split('/').pop()}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
