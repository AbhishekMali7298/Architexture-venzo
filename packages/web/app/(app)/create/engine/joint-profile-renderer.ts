import type { TextureConfig } from '@textura/shared';
import type { PatternTile } from '../lib/pattern-layout';

/**
 * Renders joints with depth profiles (recess or concave).
 * Applies depth effects to the gaps between individual tiles.
 */
export function renderJointProfile(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  layoutBounds: { x: number; y: number; width: number; height: number },
  scale: number,
  tiles: PatternTile[],
): void {
  const { joints, materials } = config;
  const material = materials[0];
  if (!material || tiles.length === 0) return;

  const isRecess = joints.recessJoints;
  const isConcave = joints.concaveJoints;

  if (!isRecess && !isConcave) {
    return;
  }

  const jointColor = joints.tint ?? '#ffffff';
  const edgeDepth = material.pbr?.bump?.edgeDepth ?? 50;
  const shadowOpacity = 0.45;

  ctx.save();

  if (isRecess) {
    renderRecessJoints(ctx, jointColor, edgeDepth, shadowOpacity, tiles, scale);
  } else if (isConcave) {
    renderConcaveJoints(ctx, jointColor, edgeDepth, shadowOpacity, tiles, scale);
  }

  ctx.restore();
}

/**
 * Renders recess joints - applies depth effects to each tile's edges within joint gaps.
 */
function renderRecessJoints(
  ctx: CanvasRenderingContext2D,
  jointColor: string,
  edgeDepth: number,
  shadowOpacity: number,
  tiles: PatternTile[],
  scale: number,
): void {
  const depth = Math.max(1.5, (edgeDepth / 100) * 8);

  const shadowColor = darkenColor(jointColor, shadowOpacity);
  const highlightColor = lightenColor(jointColor, shadowOpacity * 0.5);
  const bottomColor = darkenColor(jointColor, 0.12);

  // Apply depth effects to each tile's edges
  for (const tile of tiles) {
    const x = tile.x * scale;
    const y = tile.y * scale;
    const w = tile.width * scale;
    const h = tile.height * scale;

    // Top edge shadow (inside the tile boundary, in the joint gap)
    const topGrad = ctx.createLinearGradient(x, y, x, y + depth);
    topGrad.addColorStop(0, shadowColor);
    topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, depth);

    // Left edge shadow
    const leftGrad = ctx.createLinearGradient(x, y, x + depth, y);
    leftGrad.addColorStop(0, shadowColor);
    leftGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(x, y, depth, h);

    // Bottom edge highlight
    const bottomGrad = ctx.createLinearGradient(x, y + h - depth, x, y + h);
    bottomGrad.addColorStop(0, 'transparent');
    bottomGrad.addColorStop(1, highlightColor);
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(x, y + h - depth, w, depth);

    // Right edge highlight
    const rightGrad = ctx.createLinearGradient(x + w - depth, y, x + w, y);
    rightGrad.addColorStop(0, 'transparent');
    rightGrad.addColorStop(1, highlightColor);
    ctx.fillStyle = rightGrad;
    ctx.fillRect(x + w - depth, y, depth, h);

    // Inner darker area (flat bottom of recess)
    const inset = depth * 0.7;
    ctx.fillStyle = bottomColor;
    ctx.fillRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  }
}

/**
 * Renders concave joints - applies curved depth effects to each tile's edges.
 */
function renderConcaveJoints(
  ctx: CanvasRenderingContext2D,
  jointColor: string,
  edgeDepth: number,
  shadowOpacity: number,
  tiles: PatternTile[],
  scale: number,
): void {
  const depth = Math.max(1.5, (edgeDepth / 100) * 10);

  const shadowColor = darkenColor(jointColor, shadowOpacity);
  const highlightColor = lightenColor(jointColor, shadowOpacity * 0.5);

  // Apply concave effects to each tile's edges
  for (const tile of tiles) {
    const x = tile.x * scale;
    const y = tile.y * scale;
    const w = tile.width * scale;
    const h = tile.height * scale;

    // Top concave shadow (radial gradient from top edge)
    const topRadius = Math.max(depth * 1.5, w * 0.25);
    const topGrad = ctx.createRadialGradient(
      x + w / 2, y, 0,
      x + w / 2, y, topRadius,
    );
    topGrad.addColorStop(0, shadowColor);
    topGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, depth);

    // Left concave shadow
    const leftRadius = Math.max(depth * 1.5, h * 0.25);
    const leftGrad = ctx.createRadialGradient(
      x, y + h / 2, 0,
      x, y + h / 2, leftRadius,
    );
    leftGrad.addColorStop(0, shadowColor);
    leftGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(x, y, depth, h);

    // Bottom concave highlight
    const bottomRadius = Math.max(depth * 1.5, w * 0.25);
    const bottomGrad = ctx.createRadialGradient(
      x + w / 2, y + h, 0,
      x + w / 2, y + h, bottomRadius,
    );
    bottomGrad.addColorStop(0, highlightColor);
    bottomGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(x, y + h - depth, w, depth);

    // Right concave highlight
    const rightRadius = Math.max(depth * 1.5, h * 0.25);
    const rightGrad = ctx.createRadialGradient(
      x + w, y + h / 2, 0,
      x + w, y + h / 2, rightRadius,
    );
    rightGrad.addColorStop(0, highlightColor);
    rightGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(x + w - depth, y, depth, h);

    // Center curve highlight
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const centerRadius = Math.min(w, h) * 0.3;

    const centerGrad = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, centerRadius,
    );
    centerGrad.addColorStop(0, lightenColor(jointColor, 0.15));
    centerGrad.addColorStop(0.5, 'transparent');
    ctx.fillStyle = centerGrad;
    ctx.fillRect(x, y, w, h);
  }
}

/**
 * Darkens a hex color by a given factor.
 */
function darkenColor(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, Math.floor(rgb.r * (1 - factor)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - factor)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - factor)));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Lightens a hex color by a given factor.
 */
function lightenColor(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * factor));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Converts hex color to RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}
