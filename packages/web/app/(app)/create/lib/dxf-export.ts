'use client';

import type { TextureConfig } from '@textura/shared';
import { getPatternLayout } from './pattern-layout';
import { loadSvgPatternModule } from './svg-pattern-module-cache';

/**
 * Basic DXF exporter for architectural patterns.
 * Generates an ASCII DXF file with layers for tiles and strokes.
 * Uses classic POLYLINE/VERTEX entities for broad CAD compatibility.
 */
export async function buildPreviewDxf(config: TextureConfig): Promise<string> {
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  const layout = getPatternLayout(config, svgPatternModule);

  const header = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009', // AutoCAD R12 ASCII DXF
    '0', 'ENDSEC',
  ];

  const tables = [
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '2',
    // Layer Tiles
    '0', 'LAYER',
    '2', 'TILES',
    '70', '0',
    '62', '7', // White/Black
    '6', 'CONTINUOUS',
    // Layer Strokes
    '0', 'LAYER',
    '2', 'STROKES',
    '70', '0',
    '62', '1', // Red (distinct for strokes)
    '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
  ];

  const entities: string[] = ['0', 'SECTION', '2', 'ENTITIES'];

  // 1. Export Tiles as polylines.
  for (const tile of layout.tiles) {
    appendPolylineEntity(entities, 'TILES', tile.points, true);
  }

  // 2. Export Strokes as polylines.
  for (const stroke of layout.strokes) {
    appendPolylineEntity(entities, 'STROKES', stroke.points, stroke.closed);
  }

  entities.push('0', 'ENDSEC');
  
  const footer = ['0', 'EOF'];

  return [...header, ...tables, ...entities, ...footer].join('\n');
}

function appendPolylineEntity(
  target: string[],
  layer: 'TILES' | 'STROKES',
  points: Array<{ x: number; y: number }>,
  closed: boolean,
) {
  const sanitizedPoints = sanitizePolylinePoints(points, closed);
  if (sanitizedPoints.length < 2) {
    return;
  }

  target.push(
    '0', 'POLYLINE',
    '8', layer,
    '66', '1',
    '70', closed ? '1' : '0',
    '10', '0.0000',
    '20', '0.0000',
    '30', '0.0000',
  );

  for (const point of sanitizedPoints) {
    target.push(
      '0', 'VERTEX',
      '8', layer,
      '10', point.x.toFixed(4),
      '20', point.y.toFixed(4),
      '30', '0.0000',
    );
  }

  target.push(
    '0', 'SEQEND',
    '8', layer,
  );
}

function sanitizePolylinePoints(
  points: Array<{ x: number; y: number }>,
  closed: boolean,
) {
  const filtered = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );

  if (!closed || filtered.length < 2) {
    return filtered;
  }

  const first = filtered[0]!;
  const last = filtered[filtered.length - 1]!;
  const closesExplicitly =
    Math.abs(first.x - last.x) < 0.0001 && Math.abs(first.y - last.y) < 0.0001;

  return closesExplicitly ? filtered.slice(0, -1) : filtered;
}
