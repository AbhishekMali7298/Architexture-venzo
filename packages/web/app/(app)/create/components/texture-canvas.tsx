'use client';

import { useEffect, useRef } from 'react';
import { getMaterialById } from '@textura/shared';
import { useEditorStore } from '../store/editor-store';
import { renderToCanvas } from '../engine/pattern-renderer';
import { getMaterialRenderableImageUrl, getMaterialSourceRenderableImageUrl } from '../lib/material-assets';
import { useMaterialImage } from '../lib/material-image-cache';

export function TextureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useEditorStore((s) => s.config);
  const renderVersion = useEditorStore((s) => s.renderVersion);
  const zoom = useEditorStore((s) => s.zoom);
  const primaryMaterial = config.materials[0]!;
  const selectedMaterial = primaryMaterial.definitionId ? getMaterialById(primaryMaterial.definitionId) : null;
  const materialImageUrl = getMaterialRenderableImageUrl(primaryMaterial, selectedMaterial);
  const materialImage = useMaterialImage(materialImageUrl);
  const jointMaterialImageUrl = getMaterialSourceRenderableImageUrl(config.joints.materialSource);
  const jointMaterialImage = useMaterialImage(jointMaterialImageUrl);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial render
    renderToCanvas(ctx, config, rect.width, rect.height, { materialImage, jointMaterialImage });
  }, [config, renderVersion, materialImage, jointMaterialImage]);

  return (
    <div className="canvas-wrapper" style={{ transform: `scale(${zoom})` }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '500px',
          height: '500px',
          maxWidth: '100%',
          maxHeight: '100%',
          backgroundColor: '#1E1E3A',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      />
      <style jsx>{`
        .canvas-wrapper {
          transition: transform 0.2s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
