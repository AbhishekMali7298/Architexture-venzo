'use client';

import { getMaterialById, type TextureConfig } from '@textura/shared';
import { buildTilePathData, computePatternRenderFrame, getTileRenderBox, polygonPathData } from '../engine/render-geometry';
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

function svgNumber(value: number) {
  return Number.isFinite(value) ? Number.parseFloat(value.toFixed(3)) : 0;
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
  const frame = computePatternRenderFrame(config, width, height);
  const material = config.materials[0]!;
  const definition = material.definitionId ? getMaterialById(material.definitionId) : null;
  const fallbackFill = getMaterialRenderableColor(material.source, definition?.swatchColor ?? '#b8b0a8');
  const embeddedMaterial = await getEmbeddedMaterialAsset(config);
  const jointFill = escapeXml(config.joints.tint ?? '#d4cfc6');
  const defs: string[] = [];

  if (embeddedMaterial) {
    defs.push(
      [
        `<pattern id="material-fill" patternUnits="userSpaceOnUse" width="${svgNumber(Math.max(material.width * frame.scale, 1))}" height="${svgNumber(Math.max(material.height * frame.scale, 1))}">`,
        `<image href="${embeddedMaterial}" width="${svgNumber(Math.max(material.width * frame.scale, 1))}" height="${svgNumber(Math.max(material.height * frame.scale, 1))}" preserveAspectRatio="none" />`,
        '</pattern>',
      ].join(''),
    );
  }

  const tileMarkup: string[] = [];
  for (const tile of frame.layout.tiles) {
    const materialForTile = config.materials[tile.materialIndex] ?? material;
    const tilePath = buildTilePathData(tile, config, frame.scale);
    const tileFill = embeddedMaterial ? 'url(#material-fill)' : escapeXml(fallbackFill);
    const materialStroke = materialForTile.edges.style !== 'none' && !tile.skipEdgeStroke
      ? ` stroke="rgba(0,0,0,0.12)" stroke-width="1"`
      : '';
    const translateX = svgNumber(frame.drawOffsetX + tile.x * frame.scale);
    const translateY = svgNumber(frame.drawOffsetY + tile.y * frame.scale);
    const rotate = tile.rotation !== 0
      ? ` rotate(${svgNumber(tile.rotation)} ${svgNumber((tile.width * frame.scale) / 2)} ${svgNumber((tile.height * frame.scale) / 2)})`
      : '';

    tileMarkup.push(
      `<g transform="translate(${translateX} ${translateY})${rotate}"><path d="${tilePath}" fill="${tileFill}"${materialStroke} /></g>`,
    );
  }

  const strokeMarkup = frame.layout.strokes
    .map((stroke) => {
      const scaledPoints = stroke.points.map((point) => ({
        x: frame.drawOffsetX + point.x * frame.scale,
        y: frame.drawOffsetY + point.y * frame.scale,
      }));
      const pathData = stroke.closed
        ? polygonPathData(scaledPoints)
        : scaledPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${svgNumber(point.x)} ${svgNumber(point.y)}`).join(' ');

      return `<path d="${pathData}" fill="none" stroke="${jointFill}" stroke-width="${svgNumber(
        stroke.width ? Math.max(1, stroke.width * frame.scale) : Math.max(1, ((config.joints.horizontalSize + config.joints.verticalSize) / 2) * frame.scale),
      )}" stroke-linejoin="round" stroke-linecap="round" />`;
    })
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '',
    `<rect x="${svgNumber(frame.offsetX)}" y="${svgNumber(frame.offsetY)}" width="${svgNumber(frame.repeatWidth * frame.scale)}" height="${svgNumber(frame.repeatHeight * frame.scale)}" fill="${jointFill}" />`,
    tileMarkup.join(''),
    strokeMarkup,
    '</svg>',
  ].join('');
}

export async function buildVectorPdf(config: TextureConfig) {
  const material = config.materials[0];
  const definition = material?.definitionId ? getMaterialById(material.definitionId) : null;
  const imageUrl = material ? getMaterialRenderableImageUrl(material, definition) : null;
  if (imageUrl) {
    return null;
  }

  const width = config.output.widthPx;
  const height = config.output.heightPx;
  const frame = computePatternRenderFrame(config, width, height);
  const canUseSimpleVectorPdf = frame.layout.tiles.every((tile) => {
    const { cornerRadius } = getTileRenderBox(tile, config, frame.scale);
    return !tile.clipPath?.length && cornerRadius === 0 && tile.rotation === 0;
  }) && frame.layout.strokes.length === 0;
  if (!canUseSimpleVectorPdf) {
    return null;
  }
  const fill = getMaterialRenderableColor(material?.source ?? { type: 'solid', color: '#b8b0a8' }, definition?.swatchColor ?? '#b8b0a8');
  const joint = config.joints.tint ?? '#d4cfc6';
  const commands: string[] = [
    `${rgbToPdf(joint)} rg`,
    `${svgNumber(frame.offsetX)} ${svgNumber(height - frame.offsetY - frame.repeatHeight * frame.scale)} ${svgNumber(frame.repeatWidth * frame.scale)} ${svgNumber(frame.repeatHeight * frame.scale)} re f`,
  ];

  for (const tile of frame.layout.tiles) {
    const { tileX, tileY, tileWidth, tileHeight } = getTileRenderBox(tile, config, frame.scale);
    const x = frame.drawOffsetX + tile.x * frame.scale + tileX;
    const y = frame.drawOffsetY + tile.y * frame.scale + tileY;

    commands.push(`${rgbToPdf(fill)} rg`);
    commands.push(
      `${svgNumber(x)} ${svgNumber(height - y - tileHeight)} ${svgNumber(tileWidth)} ${svgNumber(tileHeight)} re f`,
    );
  }

  const encoder = new TextEncoder();
  const content = commands.join('\n');
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
