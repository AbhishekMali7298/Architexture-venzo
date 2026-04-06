'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getMaterialRenderableColor, getMaterialRenderableImageUrl } from './material-assets';

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

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    embeddedMaterial
      ? `<image href="${embeddedMaterial}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" />`
      : `<rect x="0" y="0" width="${width}" height="${height}" fill="${fallbackFill}" />`,
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
  const fill = getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#b8b0a8');
  const commands = [
    'q',
    `${rgbToPdf(fill)} rg`,
    `0 0 ${width} ${height} re f`,
    'Q',
  ].join('\n');

  const encoder = new TextEncoder();
  const objects = [
    encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    encoder.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    encoder.encode(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R >>\nendobj\n`,
    ),
    encoder.encode(`4 0 obj\n<< /Length ${commands.length} >>\nstream\n${commands}\nendstream\nendobj\n`),
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
