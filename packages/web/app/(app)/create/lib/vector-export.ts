'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { getTileRenderShape } from './handmade-edge';
import { getMaterialRenderableColor, getMaterialRenderableImageUrl } from './material-assets';
import { getPatternLayout } from './pattern-layout';
import { loadSvgPatternModule } from './svg-pattern-module-cache';
import { useEditorStore } from '../store/editor-store';
import { supportsEmbossPattern, isVitaComponentPattern } from './pattern-capabilities';

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

function buildStrokeMarkup(
  offsetX: number,
  offsetY: number,
  scale: number,
  layout: ReturnType<typeof getPatternLayout>,
  shouldRenderEmboss: boolean,
  normalizedStrength: number,
) {
  if (!layout.strokes.length) {
    return '';
  }

  const densityFactor = Math.max(0.2, Math.min(1, scale / 0.75));
  const embossOffset = Math.max(0.18, 1.15 * normalizedStrength * densityFactor);
  const strokeWidth = Math.max(0.35, 0.9 * normalizedStrength * densityFactor);
  const highlightAlpha = Math.min(0.68, 0.68 * normalizedStrength * densityFactor);
  const shadowAlpha = Math.min(0.18, 0.18 * normalizedStrength * densityFactor);
  const baseAlpha = Math.min(0.16, 0.16 * normalizedStrength * densityFactor);
  const shouldDrawBaseOutline = layout.tiles.length === 0 && layout.strokes.length > 0;

  return layout.strokes
    .map((stroke, index) => {
      const points = stroke.points
        .map((point) => `${offsetX + point.x * scale},${offsetY + point.y * scale}`)
        .join(' ');

      if (!points) return '';

      const nodeName = stroke.closed ? 'polygon' : 'polyline';
      const fillAttr = stroke.closed ? ' fill="none"' : '';
      let markup = '';

      if (shouldRenderEmboss && normalizedStrength > 0) {
        markup += `<${nodeName} points="${points}" stroke="#fff8ef" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${fillAttr} opacity="${highlightAlpha.toFixed(3)}" transform="translate(${-embossOffset}, ${-embossOffset})" />`;
        markup += `<${nodeName} points="${points}" stroke="#2f2416" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${fillAttr} opacity="${shadowAlpha.toFixed(3)}" transform="translate(${embossOffset}, ${embossOffset})" />`;
        markup += `<${nodeName} points="${points}" stroke="#8d7453" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${fillAttr} opacity="${baseAlpha.toFixed(3)}" />`;
      }

      if (shouldDrawBaseOutline) {
        markup += `<${nodeName} points="${points}" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"${fillAttr} opacity="0.34" />`;
      }

      return markup;
    })
    .join('');
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
  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  const embeddedMaterial = await getEmbeddedMaterialAsset(config);
  const layout = getPatternLayout(config, svgPatternModule);
  const scale = Math.min(
    width / Math.max(layout.totalWidth, 1),
    height / Math.max(layout.totalHeight, 1),
  );
  const drawWidth = layout.totalWidth * scale;
  const drawHeight = layout.totalHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const jointFill = '#ffffff';
  const defs: string[] = [];
  const embossMode = useEditorStore.getState().embossMode;
  const embossStrength = useEditorStore.getState().embossStrength;
  const shouldRenderEmboss = embossMode && supportsEmbossPattern(config.pattern.type);

  const embossIntensity = useEditorStore.getState().embossIntensity / 100;
  const embossDepth = useEditorStore.getState().embossDepth / 100;
  const normalizedStrength = Math.max(0, Math.min(1, embossStrength / 100));
  const isVita = isVitaComponentPattern(config.pattern.type);
  const reverse = isVita;

  const clampedStrength = Math.sqrt(normalizedStrength);
  const grooveWidth =
    1.4 * embossDepth * (0.7 + clampedStrength * 0.3) * (reverse ? 1.4 : 1.0) * scale;
  const bevelOffset =
    Math.max(0.4, grooveWidth * 0.72) * (0.7 + clampedStrength * 0.3) * (reverse ? 1.2 : 1.0);
  const bevelLineWidth = grooveWidth * (0.85 + clampedStrength * 0.45);

  const faceAlpha = 0.08 * clampedStrength * embossIntensity * (reverse ? 2.5 : 1.0);
  const grooveAlpha = Math.min(0.42, 0.42 * clampedStrength * embossIntensity);
  const highlightAlpha = Math.min(0.62, 0.62 * clampedStrength * embossIntensity);
  const shadowAlpha = Math.min(
    reverse ? 0.58 : 0.38,
    (reverse ? 0.6 : 0.38) * clampedStrength * embossIntensity,
  );

  const matW = material.width * scale;
  const matH = material.height * scale;

  if (embeddedMaterial) {
    defs.push(
      `<pattern id="material-pattern" x="${offsetX}" y="${offsetY}" width="${matW}" height="${matH}" patternUnits="userSpaceOnUse">`,
    );
    defs.push(
      `<image href="${embeddedMaterial}" x="0" y="0" width="${matW}" height="${matH}" preserveAspectRatio="none" />`,
    );
    defs.push(`</pattern>`);
  }

  // Create a symbolized module to keep file size small when repeating many times
  const moduleTilesMarkup = layout.tiles
    .map((tile, index) => {
      const shape = getTileRenderShape(tile, material, config.seed, index);
      const points = shape.points
        .map((point) => `${point.x * scale},${point.y * scale}`)
        .join(' ');

      let markup = '';
      const fill = embeddedMaterial ? 'url(#material-pattern)' : fallbackFill;
      markup += `<polygon points="${points}" fill="${fill}" />`;

      if (shouldRenderEmboss && normalizedStrength > 0) {
        // 1. Face (brighten/darken)
        const faceColor = reverse ? 'black' : 'white';
        const adjustedFaceAlpha = reverse ? faceAlpha * 0.5 : faceAlpha;
        markup += `<polygon points="${points}" fill="${faceColor}" opacity="${adjustedFaceAlpha.toFixed(3)}" />`;

        // 2. Groove
        markup += `<polygon points="${points}" stroke="black" stroke-width="${grooveWidth * 0.5}" fill="none" opacity="${grooveAlpha.toFixed(3)}" />`;

        // 3. Highlight
        const clipId = `clip-highlight-${index}`;
        defs.push(`<clipPath id="${clipId}"><polygon points="${points}" /></clipPath>`);
        const hx = reverse ? -bevelOffset : bevelOffset;
        const hy = reverse ? -bevelOffset : bevelOffset;
        markup += `<polygon points="${points}" stroke="white" stroke-width="${bevelLineWidth}" fill="none" opacity="${highlightAlpha.toFixed(3)}" transform="translate(${hx}, ${hy})" clip-path="url(#${clipId})" />`;

        // 4. Shadow
        const sx = reverse ? bevelOffset : -bevelOffset;
        const sy = reverse ? bevelOffset : -bevelOffset;
        markup += `<polygon points="${points}" stroke="black" stroke-width="${bevelLineWidth}" fill="none" opacity="${shadowAlpha.toFixed(3)}" transform="translate(${sx}, ${sy})" clip-path="url(#${clipId})" />`;
      }

      return markup;
    })
    .join('');

  const strokeMarkup = buildStrokeMarkup(
    0,
    0,
    scale,
    layout,
    shouldRenderEmboss,
    normalizedStrength,
  );

  defs.push(`<symbol id="pattern-module" viewBox="0 0 ${drawWidth} ${drawHeight}">`);
  defs.push(moduleTilesMarkup);
  defs.push(strokeMarkup);
  defs.push(`</symbol>`);

  // Fill the sheet with the repeating module
  const sheetMarkup: string[] = [];
  const repeatW = layout.totalWidth * scale;
  const repeatH = layout.totalHeight * scale;

  // Calculate grid to fill the whole output area
  const startX = offsetX % repeatW - repeatW;
  const startY = offsetY % repeatH - repeatH;
  const endX = width + repeatW;
  const endY = height + repeatH;

  for (let y = startY; y < endY; y += repeatH) {
    for (let x = startX; x < endX; x += repeatW) {
      sheetMarkup.push(`<use href="#pattern-module" x="${x}" y="${y}" width="${drawWidth}" height="${drawHeight}" />`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#eee7dc" />`,
    sheetMarkup.join(''),
    '</svg>',
  ].join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="${offsetX}" y="${offsetY}" width="${drawWidth}" height="${drawHeight}" fill="${jointFill}" />`,
    tileMarkup,
    strokeMarkup,
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

  const svgPatternModule = await loadSvgPatternModule(config.pattern.type);
  const width = config.output.widthPx;
  const height = config.output.heightPx;
  const layout = getPatternLayout(config, svgPatternModule);
  const scale = Math.min(
    width / Math.max(layout.totalWidth, 1),
    height / Math.max(layout.totalHeight, 1),
  );
  const drawWidth = layout.totalWidth * scale;
  const drawHeight = layout.totalHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const fill = getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#b8b0a8');
  const jointFill = '#ffffff';
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
