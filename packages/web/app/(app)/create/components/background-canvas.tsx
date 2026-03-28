'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import { renderBackground, drawDottedBorder } from '../engine/background-renderer';

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useEditorStore((s) => s.config);
  const renderVersion = useEditorStore((s) => s.renderVersion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      renderBackground(ctx, config, w, h);

      // Draw the "texture boundary" dotted box (right side of screen)
      const panelW = 300;
      const pad = 40;
      const bx = panelW + pad;
      const by = pad;
      const bw = w - bx - pad;
      const bh = h - by - pad;
      drawDottedBorder(ctx, bx, by, bw, bh);
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [config, renderVersion]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
