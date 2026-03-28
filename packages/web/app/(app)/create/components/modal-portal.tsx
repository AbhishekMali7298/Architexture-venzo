'use client';

import { useEffect, type ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 99999,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ marginTop: 60 }}>
        {children}
      </div>
    </div>,
    document.body
  );
}
