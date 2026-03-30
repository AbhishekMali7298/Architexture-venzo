'use client';

import { useEffect, useRef } from 'react';
import { getMaterialById } from '@textura/shared';
import { useEditorStore } from '../store/editor-store';
import { drawDottedBorder, renderBackground } from '../engine/background-renderer';
import { getMaterialRenderableImageUrl } from '../lib/material-assets';
import { useMaterialImage } from '../lib/material-image-cache';

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useEditorStore((s) => s.config);
  const renderVersion = useEditorStore((s) => s.renderVersion);
  const showBorder = useEditorStore((s) => s.showBorder);
  const tileBackground = useEditorStore((s) => s.tileBackground);
  const primaryMaterial = config.materials[0]!;
  const selectedMaterial = primaryMaterial.definitionId ? getMaterialById(primaryMaterial.definitionId) : null;
  const materialImageUrl = getMaterialRenderableImageUrl(primaryMaterial, selectedMaterial);
  const materialImage = useMaterialImage(materialImageUrl);

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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      const previewBounds = renderBackground(ctx, config, w, h, {
        materialImage,
        tileBackground,
      });

      if (previewBounds && showBorder) {
        drawDottedBorder(ctx, previewBounds.x, previewBounds.y, previewBounds.width, previewBounds.height);
      }
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [config, renderVersion, materialImage, showBorder, tileBackground]);

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
