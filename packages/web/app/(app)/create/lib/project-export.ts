'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { renderToCanvas } from '../engine/pattern-renderer';
import { getMaterialRenderableImageUrl } from './material-assets';
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
