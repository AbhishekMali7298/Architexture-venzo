'use client';

import { useEffect, useState } from 'react';
import { getMaterialById } from '@textura/shared';
import { useEditorStore } from '../store/editor-store';
import { getPatternLayout } from '../engine/pattern-layouts';
import { resolvePatternRepeatFrame } from '../lib/pattern-repeat-semantics';
import { isVerticalPatternOrientation } from '../lib/pattern-orientation';
import { getJointRenderableColor, getMaterialRenderableColor } from '../lib/material-assets';
import { buildTilePathData, polygonPathData } from '../engine/render-geometry';

// Must match .panel width in create-editor.module.css
const PANEL_WIDTH = 336;
const OUTER_PADDING = 40;

function svgNum(v: number) {
  return Number.isFinite(v) ? Number.parseFloat(v.toFixed(3)) : 0;
}

export function SvgPatternBackground() {
  const config = useEditorStore((s) => s.config);
  const showBorder = useEditorStore((s) => s.showBorder);
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { w: vw, h: vh } = viewport;

  let layout: ReturnType<typeof getPatternLayout>;
  let repeatFrame: ReturnType<typeof resolvePatternRepeatFrame>;
  try {
    layout = getPatternLayout(config);
    repeatFrame = resolvePatternRepeatFrame(config, layout);
  } catch {
    return null;
  }

  if (!layout.tiles.length && !layout.strokes.length) return null;

  const { repeatWidth, repeatHeight, repeatOffsetX, repeatOffsetY } = repeatFrame;

  // Compute scale so the repeat box fits within the area right of the panel
  const availableX = PANEL_WIDTH + OUTER_PADDING;
  const availableWidth = Math.max(160, vw - availableX - OUTER_PADDING);
  const availableHeight = Math.max(160, vh - OUTER_PADDING * 2);
  const scaleX = (availableWidth * 0.94) / Math.max(repeatWidth, 1);
  const scaleY = (availableHeight * 0.94) / Math.max(repeatHeight, 1);
  const scale = Math.max(0.01, Math.min(scaleX, scaleY) * 1.02);

  const tileW = svgNum(repeatWidth * scale);
  const tileH = svgNum(repeatHeight * scale);
  const previewX = Math.round(availableX + (availableWidth - tileW) / 2);
  const previewY = Math.round(OUTER_PADDING + (availableHeight - tileH) / 2);

  const material = config.materials[0]!;
  const def = material.definitionId ? getMaterialById(material.definitionId) : null;
  const tileColor = getMaterialRenderableColor(material.source, def?.swatchColor ?? '#b8b0a8');
  const jointColor = getJointRenderableColor(
    config.joints.materialSource,
    config.joints.tint,
    config.joints.adjustments,
  );

  const verticalOrientation = isVerticalPatternOrientation(config.pattern.orientation);
  const drawOffsetX = svgNum(-repeatOffsetX * scale);
  const drawOffsetY = svgNum(-repeatOffsetY * scale);

  const frameTransform = verticalOrientation
    ? `translate(${tileW} 0) rotate(90)`
    : undefined;

  const avgJointSize = (config.joints.horizontalSize + config.joints.verticalSize) / 2;

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="pat"
          x={previewX}
          y={previewY}
          width={tileW}
          height={tileH}
          patternUnits="userSpaceOnUse"
        >
          {/* Joint background */}
          <rect width={tileW} height={tileH} fill={jointColor} />

          <g transform={frameTransform}>
            {/* Tile fills */}
            {layout.tiles.map((tile, index) => {
              const d = buildTilePathData(tile, config, scale);
              const tx = svgNum(drawOffsetX + tile.x * scale);
              const ty = svgNum(drawOffsetY + tile.y * scale);
              const rotate =
                tile.rotation !== 0
                  ? ` rotate(${svgNum(tile.rotation)} ${svgNum((tile.width * scale) / 2)} ${svgNum((tile.height * scale) / 2)})`
                  : '';
              return (
                <path
                  key={index}
                  d={d}
                  fill={tileColor}
                  transform={`translate(${tx} ${ty})${rotate}`}
                />
              );
            })}

            {/* Stroke overlays (fishscale, intersecting_circle, etc.) */}
            {layout.strokes.map((stroke, index) => {
              const pts = stroke.points.map((p) => ({
                x: drawOffsetX + p.x * scale,
                y: drawOffsetY + p.y * scale,
              }));
              const d = stroke.closed
                ? polygonPathData(pts)
                : pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${svgNum(p.x)} ${svgNum(p.y)}`).join(' ');
              const strokeWidth = stroke.width
                ? Math.max(1, stroke.width * scale)
                : Math.max(1, avgJointSize * scale);
              return (
                <path
                  key={index}
                  d={d}
                  fill="none"
                  stroke={jointColor}
                  strokeWidth={svgNum(strokeWidth)}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        </pattern>
      </defs>

      {/* Tile the pattern across the full viewport */}
      <rect width="100%" height="100%" fill="url(#pat)" />

      {/* Dotted repeat-unit border */}
      {showBorder && (
        <rect
          x={previewX}
          y={previewY}
          width={tileW}
          height={tileH}
          fill="none"
          stroke="rgba(20,20,20,0.88)"
          strokeWidth={3}
          strokeDasharray="0 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
