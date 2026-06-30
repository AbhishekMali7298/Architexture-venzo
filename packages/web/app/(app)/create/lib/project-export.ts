'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { renderToCanvas } from '../engine/material-renderer';
import { buildPreviewSvg, buildVectorPdf } from './vector-export';
import { buildPreviewDxf } from './dxf-export';
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

function getExportFileName(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null,
  ext: string
) {
  const patternName = config.pattern.type.replace(/_/g, '-');
  const dims = sheetPreview
    ? `sheet_${sheetPreview.width}x${sheetPreview.height}`
    : 'pattern';
  return `${patternName}_${dims}_${config.pattern.rows}x${config.pattern.columns}.${ext}`;
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

async function renderExportCanvas(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const canvas = document.createElement('canvas');
  let scale = 1;

  if (sheetPreview) {
    // If exporting a sheet, determine canvas size based on sheet aspect ratio
    // Cap the maximum dimension to 4096px for performance and memory
    const maxDimension = 4096;
    if (sheetPreview.width > sheetPreview.height) {
      canvas.width = maxDimension;
      canvas.height = Math.round((sheetPreview.height / sheetPreview.width) * maxDimension);
      scale = canvas.width / sheetPreview.width;
    } else {
      canvas.height = maxDimension;
      canvas.width = Math.round((sheetPreview.width / sheetPreview.height) * maxDimension);
      scale = canvas.height / sheetPreview.height;
    }
  } else {
    canvas.width = config.output.widthPx;
    canvas.height = config.output.heightPx;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  // Draw background fill
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const materialImage = await resolvePreviewMaterialImage(config);
  const jointImage = await resolveJointMaterialImage(config);
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);

  if (sheetPreview) {
    // We need to import getPatternLayout, getMaterialRenderableColor, renderSheetPreview, isVitaComponentPattern
    // Wait, let's dynamically import or add them at the top of the file
    const { getPatternLayout } = await import('./pattern-layout');
    const { renderSheetPreview } = await import('../engine/background-renderer');
    const { isVitaComponentPattern } = await import('./pattern-capabilities');
    const { getMaterialRenderableColor } = await import('./material-assets');

    const layout = getPatternLayout(config, svgPatternModule);
    const material = config.materials[0];
    const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
    const fallbackFill = getMaterialRenderableColor(
      material?.source ?? { type: 'solid', color: '#c8c8c8' },
      definition?.swatchColor ?? '#c8c8c8',
    );
    const embossMode = useEditorStore.getState().embossMode;
    
    renderSheetPreview(ctx, config, {
      layout,
      bounds: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      scale,
      material: material!,
      fallbackFill,
      jointFill: '#ffffff', // Or calculate joint color if needed
      isVita: isVitaComponentPattern(config.pattern.type),
      materialImage,
      jointImage,
      emboss: embossMode ? {
        strength: useEditorStore.getState().embossStrength,
        intensity: useEditorStore.getState().embossIntensity,
        depth: useEditorStore.getState().embossDepth,
        reverse: isVitaComponentPattern(config.pattern.type),
      } : undefined,
    });
  } else {
    renderToCanvas(ctx, config, canvas.width, canvas.height, {
      materialImage,
      jointImage,
      backgroundFill: '#ffffff',
      embossMode: useEditorStore.getState().embossMode,
      embossStrength: useEditorStore.getState().embossStrength,
      embossIntensity: useEditorStore.getState().embossIntensity,
      embossDepth: useEditorStore.getState().embossDepth,
      svgPatternModule,
    });
  }

  try {
    const logoImg = await loadMaterialImage('/Venzowood.webp');
    if (logoImg) {
      ctx.save();
      
      // Rotate for diagonal watermark across the whole image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      const tileWidth = 600;
      const tileHeight = 400;
      const cols = Math.ceil(canvas.width / tileWidth) * 2 + 2;
      const rows = Math.ceil(canvas.height / tileHeight) * 2 + 2;
      
      for (let r = -rows; r < rows; r++) {
        for (let c = -cols; c < cols; c++) {
          const x = canvas.width / 2 + c * tileWidth + (r % 2 === 0 ? tileWidth / 2 : 0);
          const y = canvas.height / 2 + r * tileHeight;
          
          ctx.save();
          ctx.translate(x, y);
          
          const logoSize = 100;
          
          // Draw logo
          ctx.globalAlpha = 0.45;
          ctx.drawImage(logoImg, -logoSize / 2, -logoSize / 2 - 25, logoSize, logoSize);
          
          // Draw text
          ctx.globalAlpha = 0.35;
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          
          // Outline
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillText('VENZOWOOD', 0, logoSize / 2 - 10 + 2);
          ctx.fillText('VENZOWOOD', 0, logoSize / 2 - 10 - 2);
          
          // Main text
          ctx.fillStyle = '#000000';
          ctx.fillText('VENZOWOOD', 0, logoSize / 2 - 10);
          
          ctx.restore();
        }
      }
      ctx.restore();
    }
  } catch (e) {
    console.error('Failed to draw watermark', e);
  }

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

export async function exportPreviewPng(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const canvas = await renderExportCanvas(config, sheetPreview);
  downloadUrl(canvas.toDataURL('image/png'), getExportFileName(config, sheetPreview, 'png'));
}

export async function exportAlbedoPng(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const canvas = await renderExportCanvas(config, sheetPreview);
  downloadUrl(canvas.toDataURL('image/png'), 'textura-albedo.png');
}

export async function exportPreviewJpg(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const canvas = await renderExportCanvas(config, sheetPreview);
  downloadUrl(canvas.toDataURL('image/jpeg', 0.92), getExportFileName(config, sheetPreview, 'jpg'));
}

export async function exportPreviewSvg(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const svg = await buildPreviewSvg(config, sheetPreview);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  downloadUrl(url, getExportFileName(config, sheetPreview, 'svg'));
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportPreviewDxf(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const dxf = await buildPreviewDxf(config, sheetPreview);
  const url = URL.createObjectURL(new Blob([dxf], { type: 'application/dxf' }));
  downloadUrl(url, getExportFileName(config, sheetPreview, 'dxf'));
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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

export async function exportPreviewPdf(
  config: TextureConfig,
  sheetPreview: { width: number; height: number } | null = null
) {
  const vectorPdf = await buildVectorPdf(config, sheetPreview);
  if (vectorPdf) {
    const vectorUrl = URL.createObjectURL(vectorPdf);
    downloadUrl(vectorUrl, getExportFileName(config, sheetPreview, 'pdf'));
    window.setTimeout(() => URL.revokeObjectURL(vectorUrl), 0);
    return;
  }

  const canvas = await renderExportCanvas(config, sheetPreview);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1] ?? ''), (char) =>
    char.charCodeAt(0),
  );
  const blob = buildPdfWithJpeg(jpegBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(blob);
  downloadUrl(url, getExportFileName(config, sheetPreview, 'pdf'));
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
