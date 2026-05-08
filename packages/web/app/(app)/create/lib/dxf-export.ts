'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout } from './pattern-layout';
import { loadSvgPatternModule } from './svg-pattern-module-cache';
import { getMaterialRenderableColor } from './material-assets';

/**
 * Basic DXF exporter for architectural patterns.
 * Generates an ASCII DXF file with layers for tiles and strokes.
 * Uses classic POLYLINE/VERTEX entities for broad CAD compatibility.
 */
export async function buildPreviewDxf(config: TextureConfig): Promise<string> {
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  const layout = getPatternLayout(config, svgPatternModule);
  const material = config.materials[0];
  const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
  const materialColor = getMaterialRenderableColor(
    material?.source ?? { type: 'solid', color: '#b8b0a8' },
    definition?.swatchColor ?? '#b8b0a8',
  );
  const fillColorIndex = hexToAci(materialColor);

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
    '70', '3',
    // Layer Tile Fills
    '0', 'LAYER',
    '2', 'TILES_FILL',
    '70', '0',
    '62', fillColorIndex.toString(),
    '6', 'CONTINUOUS',
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

  // 1. Export tile fills as triangulated SOLID entities so material is visible in CAD.
  for (const tile of layout.tiles) {
    appendSolidFillEntities(entities, tile.points, fillColorIndex);
  }

  // 2. Export tile outlines as polylines.
  for (const tile of layout.tiles) {
    appendPolylineEntity(entities, 'TILES', tile.points, true);
  }

  // 3. Export strokes as polylines.
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

function appendSolidFillEntities(
  target: string[],
  points: Array<{ x: number; y: number }>,
  colorIndex: number,
) {
  const polygon = sanitizePolylinePoints(points, true);
  if (polygon.length < 3) {
    return;
  }

  const origin = polygon[0]!;
  for (let index = 1; index < polygon.length - 1; index++) {
    const second = polygon[index]!;
    const third = polygon[index + 1]!;

    target.push(
      '0', 'SOLID',
      '8', 'TILES_FILL',
      '62', colorIndex.toString(),
      '10', origin.x.toFixed(4),
      '20', origin.y.toFixed(4),
      '30', '0.0000',
      '11', second.x.toFixed(4),
      '21', second.y.toFixed(4),
      '31', '0.0000',
      '12', third.x.toFixed(4),
      '22', third.y.toFixed(4),
      '32', '0.0000',
      '13', third.x.toFixed(4),
      '23', third.y.toFixed(4),
      '33', '0.0000',
    );
  }
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

function hexToAci(hex: string) {
  const normalized = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = max / 255;

  if (lightness < 0.18) return 7;
  if (delta < 18) return lightness > 0.72 ? 9 : 8;
  if (r >= g && r >= b) {
    return g > b ? 30 : 1;
  }
  if (g >= r && g >= b) {
    return b > r ? 121 : 3;
  }
  return r > g ? 6 : 5;
}
