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
import { getSheetDimensions } from '../lib/production-metrics';
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
  const sheetPreviewPreset = useEditorStore((s) => s.sheetPreviewPreset);
  const customSheetWidth = useEditorStore((s) => s.customSheetWidth);
  const customSheetHeight = useEditorStore((s) => s.customSheetHeight);

  // Measure tool state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [currentMouse, setCurrentMouse] = useState<{ x: number; y: number } | null>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });

  const svgPatternModule = useSvgPatternModule(config.pattern.type);
  const primaryMaterial = config.materials[0]!;
  const selectedMaterial = primaryMaterial.definitionId
    ? getMaterialById(primaryMaterial.definitionId)
    : null;
  const materialImageUrl = getMaterialRenderableImageUrl(primaryMaterial, selectedMaterial);
  const jointImageUrl = getMaterialSourceRenderableImageUrl(config.joints.materialSource);
  const materialImage = useMaterialImage(materialImageUrl);
  const jointImage = useMaterialImage(jointImageUrl);
  const sheetPreview = getSheetDimensions(
    config.units,
    sheetPreviewPreset,
    customSheetWidth,
    customSheetHeight,
  );

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
              sheetPreview,
            })
          : renderBackground(ctx, config, w, h, {
              materialImage,
              jointImage,
              tileBackground,
              svgPatternModule,
              sheetPreview,
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
        
        if (previewBounds && previewBounds.scale) {
          transformRef.current = {
            x: previewBounds.x,
            y: previewBounds.y,
            scale: previewBounds.scale
          };
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
    sheetPreview,
    svgPatternModule,
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isMeasuring) return;
    const { x, y, scale } = transformRef.current;
    if (scale <= 0) return;
    
    // Map screen coordinates to physical coordinates
    const physicalX = (e.clientX - x) / scale;
    const physicalY = (e.clientY - y) / scale;
    
    if (measureStart && !measureEnd) {
      setMeasureEnd({ x: physicalX, y: physicalY });
    } else {
      setMeasureStart({ x: physicalX, y: physicalY });
      setMeasureEnd(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isMeasuring) return;
    const { x, y, scale } = transformRef.current;
    if (scale <= 0) return;
    
    const physicalX = (e.clientX - x) / scale;
    const physicalY = (e.clientY - y) / scale;
    setCurrentMouse({ x: physicalX, y: physicalY });
  };

  const toggleMeasure = () => {
    setIsMeasuring(!isMeasuring);
    setMeasureStart(null);
    setMeasureEnd(null);
    setCurrentMouse(null);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          display: 'block',
          cursor: isMeasuring ? 'crosshair' : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />
      {isMeasuring && transformRef.current.scale > 0 && (
        <svg
          width="100%"
          height="100%"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {measureStart && (currentMouse || measureEnd) && (
            <>
              <line
                x1={measureStart.x * transformRef.current.scale + transformRef.current.x}
                y1={measureStart.y * transformRef.current.scale + transformRef.current.y}
                x2={(measureEnd || currentMouse!).x * transformRef.current.scale + transformRef.current.x}
                y2={(measureEnd || currentMouse!).y * transformRef.current.scale + transformRef.current.y}
                stroke="#000"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <circle
                cx={measureStart.x * transformRef.current.scale + transformRef.current.x}
                cy={measureStart.y * transformRef.current.scale + transformRef.current.y}
                r={4}
                fill="#000"
              />
              <circle
                cx={(measureEnd || currentMouse!).x * transformRef.current.scale + transformRef.current.x}
                cy={(measureEnd || currentMouse!).y * transformRef.current.scale + transformRef.current.y}
                r={4}
                fill="#000"
              />
              
              {/* Distance label */}
              {(() => {
                const endPt = measureEnd || currentMouse!;
                const dx = endPt.x - measureStart.x;
                const dy = endPt.y - measureStart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const midX = (measureStart.x + endPt.x) / 2 * transformRef.current.scale + transformRef.current.x;
                const midY = (measureStart.y + endPt.y) / 2 * transformRef.current.scale + transformRef.current.y;
                
                const displayDistance = config.units === 'inches' 
                  ? `${(distance / 25.4).toFixed(2)} inches` 
                  : `${Math.round(distance)} mm`;

                return (
                  <g transform={`translate(${midX}, ${midY - 10})`}>
                    <rect
                      x={-40}
                      y={-14}
                      width={80}
                      height={20}
                      rx={4}
                      fill="rgba(255, 255, 255, 0.9)"
                      stroke="#e5e7eb"
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fill="#111827"
                      fontSize={12}
                      fontWeight="500"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {displayDistance}
                    </text>
                  </g>
                );
              })()}
            </>
          )}
        </svg>
      )}

      {/* Measure UI Toggle */}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          zIndex: 50,
          display: 'flex',
          gap: '8px'
        }}
      >
        {isMeasuring && (measureStart || measureEnd) && (
          <button
            onClick={() => {
              setMeasureStart(null);
              setMeasureEnd(null);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#4b5563',
            }}
          >
            Clear
          </button>
        )}
        <button
          onClick={toggleMeasure}
          style={{
            padding: '8px 16px',
            backgroundColor: isMeasuring ? '#3b82f6' : 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            fontWeight: 500,
            color: isMeasuring ? 'white' : '#111827',
          }}
        >
          {isMeasuring ? 'Done Measuring' : 'Measure Tool'}
        </button>
      </div>

      {isPending && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Updating Pattern...</span>
        </div>
      )}
    </>
  );
}
