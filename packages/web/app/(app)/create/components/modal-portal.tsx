'use client';

import { useEffect, type ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portals must wait until the browser document exists.
    setMounted(true);
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => {
      setMounted(false);
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  if (!mounted) return null;

  const isCompactViewport = viewportWidth !== null && viewportWidth < 900;
  const modalMarginLeft = isCompactViewport ? 12 : 375;
  const modalMarginTop = isCompactViewport ? 12 : 56;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'transparent',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: '16px',
        zIndex: 99999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          marginTop: modalMarginTop,
          marginLeft: `${modalMarginLeft}px`,
          maxWidth: `calc(100vw - ${modalMarginLeft + 16}px)`,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -10,
            top: isCompactViewport ? 56 : 72,
            width: 20,
            height: 20,
            background: 'rgba(255,255,255,0.98)',
            borderLeft: '1px solid rgba(15, 23, 42, 0.08)',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            transform: 'rotate(45deg)',
            borderBottomLeftRadius: 6,
            boxShadow: '-8px 10px 20px rgba(15, 23, 42, 0.05)',
            pointerEvents: 'none',
          }}
        />
        {children}
      </div>
    </div>,
    document.body,
  );
}
