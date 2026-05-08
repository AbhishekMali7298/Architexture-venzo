'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { renderToCanvas } from '../engine/material-renderer';
import { buildPreviewSvg, buildVectorPdf } from './vector-export';
import { buildPreviewDxf, type PreviewDxfRasterInfo } from './dxf-export';
import {
  getMaterialRenderableColor,
  getMaterialRenderableImageUrl,
  getMaterialSourceRenderableImageUrl,
} from './material-assets';
import { loadMaterialImage } from './material-image-cache';
import { loadSvgPatternModule } from './svg-pattern-module-cache';
import { useEditorStore } from '../store/editor-store';

function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export async function exportProjectJson(config: TextureConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, 'textura-project.json');
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function resolvePreviewMaterialImage(
  config: TextureConfig,
): Promise<HTMLImageElement | null> {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const imageUrl = getMaterialRenderableImageUrl(material, definition);
  if (!imageUrl) return null;

  try {
    return await loadMaterialImage(imageUrl);
  } catch {
    return null;
  }
}

async function resolveJointMaterialImage(config: TextureConfig): Promise<HTMLImageElement | null> {
  const imageUrl = getMaterialSourceRenderableImageUrl(config.joints.materialSource);
  if (!imageUrl) return null;

  try {
    return await loadMaterialImage(imageUrl);
  } catch {
    return null;
  }
}

async function resolveDxfRasterInfo(config: TextureConfig): Promise<{
  rasterInfo: PreviewDxfRasterInfo;
  blob: Blob;
} | null> {
  const material = config.materials[0];
  if (!material) return null;

  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const imageUrl = getMaterialRenderableImageUrl(material, definition);
  if (!imageUrl) return null;

  try {
    const [image, response] = await Promise.all([loadMaterialImage(imageUrl), fetch(imageUrl)]);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const extension = getBlobExtension(blob.type, imageUrl);
    return {
      rasterInfo: {
        fileName: `textura-preview-material.${extension}`,
        pixelWidth: image.naturalWidth || image.width,
        pixelHeight: image.naturalHeight || image.height,
      },
      blob,
    };
  } catch {
    return null;
  }
}

async function renderExportCanvas(config: TextureConfig) {
  const canvas = document.createElement('canvas');
  canvas.width = config.output.widthPx;
  canvas.height = config.output.heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  const materialImage = await resolvePreviewMaterialImage(config);
  const jointImage = await resolveJointMaterialImage(config);
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  renderToCanvas(ctx, config, canvas.width, canvas.height, {
    materialImage,
    jointImage,
    backgroundFill: '#ffffff',
    embossMode: useEditorStore.getState().embossMode,
    embossStrength: useEditorStore.getState().embossStrength,
    svgPatternModule,
  });

  return canvas;
}

function createMapCanvas(config: TextureConfig) {
  const canvas = document.createElement('canvas');
  canvas.width = config.output.widthPx;
  canvas.height = config.output.heightPx;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  return { canvas, ctx };
}

export async function exportPreviewPng(config: TextureConfig) {
  const canvas = await renderExportCanvas(config);
  downloadUrl(canvas.toDataURL('image/png'), 'textura-preview.png');
}

export async function exportAlbedoPng(config: TextureConfig) {
  const canvas = await renderExportCanvas(config);
  downloadUrl(canvas.toDataURL('image/png'), 'textura-albedo.png');
}

export async function exportPreviewJpg(config: TextureConfig) {
  const canvas = await renderExportCanvas(config);
  downloadUrl(canvas.toDataURL('image/jpeg', 0.92), 'textura-preview.jpg');
}

export async function exportPreviewSvg(config: TextureConfig) {
  const svg = await buildPreviewSvg(config);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  downloadUrl(url, 'textura-preview.svg');
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportPreviewDxf(config: TextureConfig) {
  const rasterAsset = await resolveDxfRasterInfo(config);
  const dxf = await buildPreviewDxf(config, rasterAsset?.rasterInfo);

  if (rasterAsset) {
    const imageUrl = URL.createObjectURL(rasterAsset.blob);
    downloadUrl(imageUrl, rasterAsset.rasterInfo.fileName);
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 0);
  }

  const url = URL.createObjectURL(new Blob([dxf], { type: 'application/dxf' }));
  downloadUrl(url, 'textura-preview.dxf');
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getBlobExtension(contentType: string, imageUrl: string) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';

  const match = imageUrl.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  return match?.[1]?.toLowerCase() || 'png';
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function buildPdfWithJpeg(jpegBytes: Uint8Array, width: number, height: number) {
  const encoder = new TextEncoder();
  const objects: Uint8Array[] = [
    encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    encoder.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    encoder.encode(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n`,
    ),
    concatBytes([
      encoder.encode(
        `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
      ),
      jpegBytes,
      encoder.encode('\nendstream\nendobj\n'),
    ]),
  ];
  const contentStream = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  objects.push(
    encoder.encode(
      `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
    ),
  );

  const header = encoder.encode('%PDF-1.3\n');
  const body = concatBytes(objects);
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

export async function exportPreviewPdf(config: TextureConfig) {
  const vectorPdf = await buildVectorPdf(config);
  if (vectorPdf) {
    const vectorUrl = URL.createObjectURL(vectorPdf);
    downloadUrl(vectorUrl, 'textura-preview.pdf');
    window.setTimeout(() => URL.revokeObjectURL(vectorUrl), 0);
    return;
  }

  const canvas = await renderExportCanvas(config);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1] ?? ''), (char) =>
    char.charCodeAt(0),
  );
  const blob = buildPdfWithJpeg(jpegBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(blob);
  downloadUrl(url, 'textura-preview.pdf');
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportPlaceholderMap(config: TextureConfig, kind: 'bump' | 'roughness') {
  const { canvas, ctx } = createMapCanvas(config);
  const material = config.materials[0];
  const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
  const baseColor = getMaterialRenderableColor(
    material?.source ?? { type: 'solid', color: '#b8b0a8' },
    definition?.swatchColor ?? '#b8b0a8',
  );

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

  if (kind === 'bump') {
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, '#f8fafc');
  } else {
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#475569');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.12;
  for (let x = 0; x < canvas.width; x += 24) {
    ctx.fillStyle = x % 48 === 0 ? '#000' : '#fff';
    ctx.fillRect(x, 0, 8, canvas.height);
  }
  ctx.globalAlpha = 1;

  downloadUrl(canvas.toDataURL('image/png'), `textura-${kind}.png`);
}

export function exportBumpPlaceholderPng(config: TextureConfig) {
  exportPlaceholderMap(config, 'bump');
}

export function exportRoughnessPlaceholderPng(config: TextureConfig) {
  exportPlaceholderMap(config, 'roughness');
}
