'use client';

import { useEffect, useRef, useState } from 'react';
import { getMaterialById } from '@textura/shared';
import { useEditorStore } from '../store/editor-store';
import {
  drawPreviewBorder,
  renderBackground,
  renderEmbossBackground,
} from '../engine/background-renderer';
import {
  getMaterialRenderableImageUrl,
  getMaterialSourceRenderableImageUrl,
} from '../lib/material-assets';
import { useMaterialImage } from '../lib/material-image-cache';
import { supportsEmbossPattern } from '../lib/pattern-capabilities';
import { useSvgPatternModule } from '../lib/svg-pattern-module-cache';
import styles from './create-editor.module.css';

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPending, setIsPending] = useState(false);
  const config = useEditorStore((s) => s.config);
  const renderVersion = useEditorStore((s) => s.renderVersion);
  const showBorder = useEditorStore((s) => s.showBorder);
  const tileBackground = useEditorStore((s) => s.tileBackground);
  const embossMode = useEditorStore((s) => s.embossMode);
  const embossStrength = useEditorStore((s) => s.embossStrength);
  const embossIntensity = useEditorStore((s) => s.embossIntensity);
  const embossDepth = useEditorStore((s) => s.embossDepth);
  const svgPatternModule = useSvgPatternModule(config.pattern.type);
  const primaryMaterial = config.materials[0]!;
  const selectedMaterial = primaryMaterial.definitionId
    ? getMaterialById(primaryMaterial.definitionId)
    : null;
  const materialImageUrl = getMaterialRenderableImageUrl(primaryMaterial, selectedMaterial);
  const jointImageUrl = getMaterialSourceRenderableImageUrl(config.joints.materialSource);
  const materialImage = useMaterialImage(materialImageUrl);
  const jointImage = useMaterialImage(jointImageUrl);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let timeoutId: NodeJS.Timeout;

    const render = () => {
      // Show pending state only for longer renders (>150ms) to avoid flickering
      const pendingTimeoutId = setTimeout(() => setIsPending(true), 150);

      // Execute render in the next event loop tick to allow UI to breathe
      timeoutId = setTimeout(() => {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(pendingTimeoutId);
          setIsPending(false);
          return;
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(dpr, dpr);

        const shouldRenderEmboss = embossMode && supportsEmbossPattern(config.pattern.type);
        const previewBounds = shouldRenderEmboss
          ? renderEmbossBackground(ctx, config, w, h, {
              materialImage,
              jointImage,
              tileBackground,
              embossStrength,
              embossIntensity,
              embossDepth,
              svgPatternModule,
            })
          : renderBackground(ctx, config, w, h, {
              materialImage,
              jointImage,
              tileBackground,
              svgPatternModule,
            });
        
        if (previewBounds && showBorder) {
          drawPreviewBorder(
            ctx,
            previewBounds.x,
            previewBounds.y,
            previewBounds.width,
            previewBounds.height,
          );
        }
        
        clearTimeout(pendingTimeoutId);
        setIsPending(false);
      }, 0);
    };

    render();
    window.addEventListener('resize', render);
    return () => {
      window.removeEventListener('resize', render);
      clearTimeout(timeoutId);
    };
  }, [
    config,
    renderVersion,
    materialImage,
    jointImage,
    showBorder,
    tileBackground,
    embossMode,
    embossStrength,
    embossIntensity,
    embossDepth,
    svgPatternModule,
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          display: 'block',
        }}
      />
      {isPending && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Updating Pattern...</span>
        </div>
      )}
    </>
  );
}
