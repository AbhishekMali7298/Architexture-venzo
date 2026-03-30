'use client';

import { useEffect, useRef, useState } from 'react';
import { getMaterialById, type TextureConfig } from '@textura/shared';
import { useEditorStore } from '../store/editor-store';
import { drawDottedBorder, getBackgroundModuleMetrics, renderBackgroundModule, renderPreviewOverlay } from '../engine/background-renderer';
import { getMaterialRenderableImageUrl } from '../lib/material-assets';
import { useMaterialImage } from '../lib/material-image-cache';

function getFallbackSurfaceColor(config: TextureConfig) {
  return config.joints.tint ?? '#d4cfc6';
}

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({
    backgroundColor: '#d4cfc6',
  });
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

      const metrics = getBackgroundModuleMetrics(config, w, h);
      const surfaceColor = getFallbackSurfaceColor(config);

      if (tileBackground && metrics) {
        const moduleCanvas = document.createElement('canvas');
        moduleCanvas.width = Math.max(1, Math.ceil(metrics.tileSetWidth * dpr));
        moduleCanvas.height = Math.max(1, Math.ceil(metrics.tileSetHeight * dpr));
        const moduleCtx = moduleCanvas.getContext('2d')!;
        moduleCtx.scale(dpr, dpr);
        renderBackgroundModule(moduleCtx, config, w, h, { materialImage });

        setBackgroundStyle({
          backgroundColor: surfaceColor,
          backgroundImage: `url(${moduleCanvas.toDataURL('image/png')})`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${metrics.tileSetWidth}px ${metrics.tileSetHeight}px`,
          backgroundPosition: `${metrics.previewX}px ${metrics.previewY}px`,
        });
      } else {
        setBackgroundStyle({
          backgroundColor: surfaceColor,
          backgroundImage: 'none',
        });
      }

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      const previewBounds = renderPreviewOverlay(ctx, config, w, h, { materialImage });

      if (previewBounds && showBorder) {
        drawDottedBorder(ctx, previewBounds.x, previewBounds.y, previewBounds.width, previewBounds.height);
      }
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [config, renderVersion, materialImage, showBorder, tileBackground]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          ...backgroundStyle,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
