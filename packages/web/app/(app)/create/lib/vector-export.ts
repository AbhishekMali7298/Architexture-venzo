'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getMaterialRenderableColor, getMaterialRenderableImageUrl } from './material-assets';
import { getStackLayout } from './stack-pattern';

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
  const fallbackFill = escapeXml(getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#b8b0a8'));
  const embeddedMaterial = await getEmbeddedMaterialAsset(config);
  const layout = getStackLayout(config);
  const scale = Math.min(width / Math.max(layout.totalWidth, 1), height / Math.max(layout.totalHeight, 1));
  const drawWidth = layout.totalWidth * scale;
  const drawHeight = layout.totalHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const jointFill = escapeXml(config.joints.tint ?? '#ffffff');
  const tileMarkup = layout.tiles.map((tile) => {
    const x = offsetX + tile.x * scale;
    const y = offsetY + tile.y * scale;
    const w = tile.width * scale;
    const h = tile.height * scale;
    return embeddedMaterial
      ? `<image href="${embeddedMaterial}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" />`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fallbackFill}" />`;
  }).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
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
  const layout = getStackLayout(config);
  const scale = Math.min(width / Math.max(layout.totalWidth, 1), height / Math.max(layout.totalHeight, 1));
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

  for (const tile of layout.tiles) {
    const x = offsetX + tile.x * scale;
    const y = offsetY + tile.y * scale;
    const tileWidth = tile.width * scale;
    const tileHeight = tile.height * scale;
    commands.push(`${rgbToPdf(fill)} rg`);
    commands.push(`${x} ${height - y - tileHeight} ${tileWidth} ${tileHeight} re f`);
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
    encoder.encode(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`),
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
