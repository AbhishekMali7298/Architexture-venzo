'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import styles from './create-editor.module.css';

export function CreateEditorShell({
  onOpenSettings,
  children,
  footer,
}: {
  onOpenSettings: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={styles.panel} style={isCollapsed ? { width: 'auto' } : undefined}>
      <header className={styles.panelHeader}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <Image
              src="/Venzowood.webp"
              alt="Venzowood logo"
              width={32}
              height={32}
              className={styles.brandLogo}
              priority
            />
          </div>
          {!isCollapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Venzowood</span>
              <span className={styles.brandSubtitle}>Texture and material editor</span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          {!isCollapsed && (
            <button className={styles.iconButton} type="button" aria-label="Editor settings" onClick={onOpenSettings}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {!isCollapsed && (
        <>
          <div className={styles.panelBody}>{children}</div>
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </>
      )}
    </div>
  );
}
