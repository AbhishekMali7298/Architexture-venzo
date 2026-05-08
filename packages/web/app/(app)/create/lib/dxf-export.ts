'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getPatternLayout } from './pattern-layout';
import { loadSvgPatternModule } from './svg-pattern-module-cache';
import { getMaterialRenderableColor } from './material-assets';

export interface PreviewDxfRasterInfo {
  fileName: string;
  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Basic DXF exporter for architectural patterns.
 * Generates an ASCII DXF file with layers for tiles and strokes.
 * Uses classic POLYLINE/VERTEX entities for broad CAD compatibility.
 */
export async function buildPreviewDxf(
  config: TextureConfig,
  rasterInfo?: PreviewDxfRasterInfo,
): Promise<string> {
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  const layout = getPatternLayout(config, svgPatternModule);
  const material = config.materials[0];
  const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
  const materialColor = getMaterialRenderableColor(
    material?.source ?? { type: 'solid', color: '#b8b0a8' },
    definition?.swatchColor ?? '#b8b0a8',
  );
  const fillColorIndex = hexToAci(materialColor);
  const hasRasterImage =
    Boolean(rasterInfo?.fileName) &&
    (rasterInfo?.pixelWidth ?? 0) > 0 &&
    (rasterInfo?.pixelHeight ?? 0) > 0;

  const header = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', hasRasterImage ? 'AC1015' : 'AC1009', // IMAGE entities require AutoCAD 2000+
    '0', 'ENDSEC',
  ];

  const tables = [
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', hasRasterImage ? '4' : '3',
    // Layer Material Image
    ...(hasRasterImage
      ? [
          '0', 'LAYER',
          '2', 'MATERIAL_IMAGE',
          '70', '0',
          '62', '7',
          '6', 'CONTINUOUS',
        ]
      : []),
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
  const objects: string[] = ['0', 'SECTION', '2', 'OBJECTS'];

  if (hasRasterImage && rasterInfo) {
    const handles = createHandleGenerator();
    const rootDictionaryHandle = handles.next();
    const imageDictionaryHandle = handles.next();
    const imageDefHandle = handles.next();
    const imageHandles = layout.tiles.map(() => handles.next());
    const reactorHandles = layout.tiles.map(() => handles.next());

    appendRootDictionaryObject(objects, rootDictionaryHandle, imageDictionaryHandle);
    appendImageDictionaryObject(objects, imageDictionaryHandle, rootDictionaryHandle, imageDefHandle);
    appendImageDefObject(
      objects,
      imageDefHandle,
      imageDictionaryHandle,
      reactorHandles,
      rasterInfo,
    );

    for (let index = 0; index < layout.tiles.length; index++) {
      const tile = layout.tiles[index]!;
      appendImageEntity(
        entities,
        tile.points,
        rasterInfo,
        imageDefHandle,
        imageHandles[index]!,
        reactorHandles[index]!,
      );
      appendImageDefReactorObject(objects, reactorHandles[index]!, imageHandles[index]!);
    }
  } else {
    // 1. Export tile fills as triangulated SOLID entities so material is visible in CAD.
    for (const tile of layout.tiles) {
      appendSolidFillEntities(entities, tile.points, fillColorIndex);
    }
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
  objects.push('0', 'ENDSEC');

  const footer = ['0', 'EOF'];

  return [...header, ...tables, ...entities, ...(hasRasterImage ? objects : []), ...footer].join(
    '\n',
  );
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

function appendImageEntity(
  target: string[],
  points: Array<{ x: number; y: number }>,
  rasterInfo: PreviewDxfRasterInfo,
  imageDefHandle: string,
  imageHandle: string,
  reactorHandle: string,
) {
  const polygon = sanitizePolylinePoints(points, true);
  if (polygon.length < 3) {
    return;
  }

  const bounds = getPolygonBounds(polygon);
  const width = Math.max(0.001, bounds.maxX - bounds.minX);
  const height = Math.max(0.001, bounds.maxY - bounds.minY);
  const pixelWidth = Math.max(1, rasterInfo.pixelWidth);
  const pixelHeight = Math.max(1, rasterInfo.pixelHeight);
  const pixelSizeX = width / pixelWidth;
  const pixelSizeY = height / pixelHeight;

  target.push(
    '0', 'IMAGE',
    '5', imageHandle,
    '100', 'AcDbEntity',
    '8', 'MATERIAL_IMAGE',
    '100', 'AcDbRasterImage',
    '90', '0',
    '10', bounds.minX.toFixed(4),
    '20', bounds.minY.toFixed(4),
    '30', '0.0000',
    '11', pixelSizeX.toFixed(8),
    '21', '0.00000000',
    '31', '0.00000000',
    '12', '0.00000000',
    '22', pixelSizeY.toFixed(8),
    '32', '0.00000000',
    '13', pixelWidth.toString(),
    '23', pixelHeight.toString(),
    '340', imageDefHandle,
    '70', '1',
    '280', '1',
    '281', '50',
    '282', '50',
    '283', '0',
    '360', reactorHandle,
    '71', '2',
    '91', polygon.length.toString(),
  );

  for (const point of polygon) {
    target.push(
      '14', (((point.x - bounds.minX) / width) * pixelWidth - 0.5).toFixed(4),
      '24', (((point.y - bounds.minY) / height) * pixelHeight - 0.5).toFixed(4),
    );
  }

  target.push('290', '1');
}

function appendRootDictionaryObject(
  target: string[],
  rootDictionaryHandle: string,
  imageDictionaryHandle: string,
) {
  target.push(
    '0', 'DICTIONARY',
    '5', rootDictionaryHandle,
    '330', '0',
    '100', 'AcDbDictionary',
    '280', '0',
    '281', '1',
    '3', 'ACAD_IMAGE_DICT',
    '350', imageDictionaryHandle,
  );
}

function appendImageDictionaryObject(
  target: string[],
  imageDictionaryHandle: string,
  rootDictionaryHandle: string,
  imageDefHandle: string,
) {
  target.push(
    '0', 'DICTIONARY',
    '5', imageDictionaryHandle,
    '102', '{ACAD_REACTORS',
    '330', rootDictionaryHandle,
    '102', '}',
    '330', rootDictionaryHandle,
    '100', 'AcDbDictionary',
    '280', '1',
    '281', '1',
    '3', 'TEXTURA_MATERIAL',
    '350', imageDefHandle,
  );
}

function appendImageDefObject(
  target: string[],
  imageDefHandle: string,
  imageDictionaryHandle: string,
  reactorHandles: string[],
  rasterInfo: PreviewDxfRasterInfo,
) {
  target.push(
    '0', 'IMAGEDEF',
    '5', imageDefHandle,
    '102', '{ACAD_REACTORS',
    '330', imageDictionaryHandle,
  );

  for (const reactorHandle of reactorHandles) {
    target.push('330', reactorHandle);
  }

  target.push(
    '102', '}',
    '100', 'AcDbRasterImageDef',
    '90', '0',
    '1', rasterInfo.fileName,
    '10', rasterInfo.pixelWidth.toString(),
    '20', rasterInfo.pixelHeight.toString(),
    '11', '1.00000000',
    '12', '1.00000000',
    '280', '1',
    '281', '0',
  );
}

function appendImageDefReactorObject(
  target: string[],
  reactorHandle: string,
  imageHandle: string,
) {
  target.push(
    '0', 'IMAGEDEF_REACTOR',
    '5', reactorHandle,
    '100', 'AcDbRasterImageDefReactor',
    '90', '2',
    '330', imageHandle,
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

function getPolygonBounds(points: Array<{ x: number; y: number }>) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

function createHandleGenerator(start = 0x100) {
  let current = start;
  return {
    next() {
      const handle = current.toString(16).toUpperCase();
      current += 1;
      return handle;
    },
  };
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
