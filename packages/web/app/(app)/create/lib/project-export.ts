'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { renderToCanvas } from '../engine/pattern-renderer';
import { getMaterialRenderableColor, getMaterialRenderableImageUrl } from './material-assets';
import { loadMaterialImage } from './material-image-cache';

function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function createSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function exportProjectJson(config: TextureConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, `textura-project-${createSlug(config.pattern.type)}.json`);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function resolvePreviewMaterialImage(config: TextureConfig): Promise<HTMLImageElement | null> {
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

export async function exportPreviewPng(config: TextureConfig) {
  const canvas = document.createElement('canvas');
  canvas.width = config.output.widthPx;
  canvas.height = config.output.heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize export canvas');
  }

  const materialImage = await resolvePreviewMaterialImage(config);
  renderToCanvas(ctx, config, canvas.width, canvas.height, { materialImage });

  downloadUrl(canvas.toDataURL('image/png'), `textura-preview-${createSlug(config.pattern.type)}.png`);
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

export async function exportAlbedoPng(config: TextureConfig) {
  const { canvas, ctx } = createMapCanvas(config);
  const materialImage = await resolvePreviewMaterialImage(config);
  renderToCanvas(ctx, config, canvas.width, canvas.height, { materialImage });
  downloadUrl(canvas.toDataURL('image/png'), `textura-albedo-${createSlug(config.pattern.type)}.png`);
}

function exportPlaceholderMap(config: TextureConfig, kind: 'bump' | 'roughness') {
  const { canvas, ctx } = createMapCanvas(config);
  const material = config.materials[0];
  const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
  const baseColor = getMaterialRenderableColor(material?.source ?? { type: 'solid', color: '#b8b0a8' }, definition?.swatchColor ?? '#b8b0a8');

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

  downloadUrl(canvas.toDataURL('image/png'), `textura-${kind}-${createSlug(config.pattern.type)}.png`);
}

export function exportBumpPlaceholderPng(config: TextureConfig) {
  exportPlaceholderMap(config, 'bump');
}

export function exportRoughnessPlaceholderPng(config: TextureConfig) {
  exportPlaceholderMap(config, 'roughness');
}
