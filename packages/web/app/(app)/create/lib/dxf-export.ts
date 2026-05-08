'use client';

import type { TextureConfig } from '@textura/shared';
import { getPatternLayout } from './pattern-layout';
import { loadSvgPatternModule } from './svg-pattern-module-cache';

/**
 * Basic DXF exporter for architectural patterns.
 * Generates an R12/R14 compatible DXF file with layers for tiles and strokes.
 */
export async function buildPreviewDxf(config: TextureConfig): Promise<string> {
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  const layout = getPatternLayout(config, svgPatternModule);

  const header = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1012', // AutoCAD R13/R14
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

  // 1. Export Tiles as Polylines
  for (const tile of layout.tiles) {
    entities.push(
      '0', 'LWPOLYLINE',
      '8', 'TILES',
      '90', tile.points.length.toString(),
      '70', '1', // Closed
    );
    for (const point of tile.points) {
      entities.push(
        '10', point.x.toFixed(4),
        '20', point.y.toFixed(4),
      );
    }
  }

  // 2. Export Strokes as Polylines
  for (const stroke of layout.strokes) {
    if (stroke.points.length < 2) continue;
    
    entities.push(
      '0', 'LWPOLYLINE',
      '8', 'STROKES',
      '90', stroke.points.length.toString(),
      '70', stroke.closed ? '1' : '0',
    );
    for (const point of stroke.points) {
      entities.push(
        '10', point.x.toFixed(4),
        '20', point.y.toFixed(4),
      );
    }
  }

  entities.push('0', 'ENDSEC');
  
  const footer = ['0', 'EOF'];

  return [...header, ...tables, ...entities, ...footer].join('\n');
}
