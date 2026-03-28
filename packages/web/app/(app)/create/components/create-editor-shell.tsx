'use client';

import type { EditorTab } from '@textura/shared';
import type { ReactNode } from 'react';
import styles from './create-editor.module.css';

export function CreateEditorShell({
  activeTab,
  onTabChange,
  children,
  footer,
}: {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'texture', label: 'Texture' },
    { id: 'bump', label: 'Bump' },
    { id: 'hatch', label: 'Hatch' },
  ];

  return (
    <div className={styles.panel}>
      <header className={styles.panelHeader}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>TX</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Create Texture</span>
            <span className={styles.brandSubtitle}>Pattern-first material editor</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} type="button" aria-label="Editor settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <nav className={styles.tabBar} aria-label="Texture editor tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={styles.panelBody}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </div>
  );
}
