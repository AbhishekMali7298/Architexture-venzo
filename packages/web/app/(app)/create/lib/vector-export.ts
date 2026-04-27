'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from './handmade-edge';
import { getMaterialRenderableColor, getMaterialRenderableImageUrl } from './material-assets';
import { getPatternLayout } from './pattern-layout';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function rgbToPdf(color: string) {
  const normalized = color.replace('#', '').padEnd(6, '0').slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return channels.map((channel) => (channel / 255).toFixed(4)).join(' ');
}

async function urlToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset for vector export: ${url}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read asset for vector export: ${url}`));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

async function getEmbeddedMaterialAsset(config: TextureConfig) {
  const material = config.materials[0];
  if (!material) return null;
  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const imageUrl = getMaterialRenderableImageUrl(material, definition);
  if (!imageUrl) return null;

  try {
    return await urlToDataUrl(imageUrl);
  } catch {
    return null;
  }
}

export async function buildPreviewSvg(config: TextureConfig) {
  const width = config.output.widthPx;
  const height = config.output.heightPx;
  const material = config.materials[0]!;
  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = escapeXml(
    getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#b8b0a8'),
  );
  const embeddedMaterial = await getEmbeddedMaterialAsset(config);
  const layout = getPatternLayout(config);
  const scale = Math.min(
    width / Math.max(layout.totalWidth, 1),
    height / Math.max(layout.totalHeight, 1),
  );
  const drawWidth = layout.totalWidth * scale;
  const drawHeight = layout.totalHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const jointFill = escapeXml(config.joints.tint ?? '#ffffff');
  const defs: string[] = [];
  const tileMarkup = layout.tiles
    .map((tile, index) => {
      const shape = getTileRenderShape(tile, material, config.seed, index);
      const points = shape.points
        .map((point) => `${offsetX + point.x * scale},${offsetY + point.y * scale}`)
        .join(' ');
      const x = offsetX + shape.bounds.x * scale;
      const y = offsetY + shape.bounds.y * scale;
      const w = shape.bounds.width * scale;
      const h = shape.bounds.height * scale;

      if (embeddedMaterial) {
        const clipId = `tile-clip-${index}`;
        defs.push(`<clipPath id="${clipId}"><polygon points="${points}" /></clipPath>`);
        return `<image href="${embeddedMaterial}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" clip-path="url(#${clipId})" />`;
      }

      return `<polygon points="${points}" fill="${fallbackFill}" />`;
    })
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="${offsetX}" y="${offsetY}" width="${drawWidth}" height="${drawHeight}" fill="${jointFill}" />`,
    tileMarkup,
    '</svg>',
  ].join('');
}

export async function buildVectorPdf(config: TextureConfig) {
  const material = config.materials[0];
  const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
  const imageUrl = material ? getMaterialRenderableImageUrl(material, definition) : null;
  if (imageUrl || !material) {
    return null;
  }

  const width = config.output.widthPx;
  const height = config.output.heightPx;
  const layout = getPatternLayout(config);
  const scale = Math.min(
    width / Math.max(layout.totalWidth, 1),
    height / Math.max(layout.totalHeight, 1),
  );
  const drawWidth = layout.totalWidth * scale;
  const drawHeight = layout.totalHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const fill = getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#b8b0a8');
  const jointFill = config.joints.tint ?? '#ffffff';
  const commands = [
    'q',
    `${rgbToPdf(jointFill)} rg`,
    `${offsetX} ${height - offsetY - drawHeight} ${drawWidth} ${drawHeight} re f`,
  ];

  for (const [tileIndex, tile] of layout.tiles.entries()) {
    const shape = getTileRenderShape(tile, material, config.seed, tileIndex);
    commands.push(`${rgbToPdf(fill)} rg`);
    const points = shape.points.map((point) => ({
      x: offsetX + point.x * scale,
      y: height - (offsetY + point.y * scale),
    }));
    const [firstPoint, ...otherPoints] = points;
    commands.push(`${firstPoint!.x} ${firstPoint!.y} m`);
    for (const point of otherPoints) {
      commands.push(`${point.x} ${point.y} l`);
    }
    commands.push('h f');
  }

  commands.push('Q');
  const content = commands.join('\n');

  const encoder = new TextEncoder();
  const objects = [
    encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    encoder.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    encoder.encode(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R >>\nendobj\n`,
    ),
    encoder.encode(
      `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    ),
  ];

  const header = encoder.encode('%PDF-1.4\n');
  const body = new Uint8Array(objects.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const object of objects) {
    body.set(object, offset);
    offset += object.length;
  }

  const xrefOffset = header.length + body.length;
  const xrefEntries = ['0000000000 65535 f '];
  let runningOffset = header.length;
  for (const object of objects) {
    xrefEntries.push(`${String(runningOffset).padStart(10, '0')} 00000 n `);
    runningOffset += object.length;
  }

  const trailer = encoder.encode(
    `xref\n0 ${xrefEntries.length}\n${xrefEntries.join('\n')}\ntrailer\n<< /Size ${xrefEntries.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob([header, body, trailer], { type: 'application/pdf' });
}
