import type { TextureConfig } from '@textura/shared';
import type { PatternPoint, PatternTile } from '../lib/pattern-layout';

type Vec2 = {
  x: number;
  y: number;
};

/**
 * Fake joint depth shading driven by joint flags plus tile edge depth settings.
 * This intentionally does not use real renderer shadow maps.
 */
export function renderJointProfile(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  layoutBounds: { x: number; y: number; width: number; height: number },
  scale: number,
  tiles: PatternTile[],
  phase: 'under' | 'over' = 'under',
): void {
  const material = config.materials[0];
  if (!material || tiles.length === 0) return;

  const isRecess = config.joints.recessJoints;
  const isConcave = config.joints.concaveJoints;
  if (phase === 'under' && !isRecess) return;
  if (phase === 'over' && !isConcave) return;

  const horizontalGap = Math.max(0, config.joints.horizontalSize * scale);
  const verticalGap = Math.max(0, config.joints.verticalSize * scale);
  if (horizontalGap <= 0 && verticalGap <= 0) return;

  const edgeDepth = material.pbr.bump.edgeDepth;
  const edgeProfile = material.edges.profileWidth;
  const shadowStrength = phase === 'under'
    ? 0.11 + (edgeDepth / 100) * 0.12 + Math.min(edgeProfile, 25) / 300
    : 0.05 + (edgeDepth / 100) * 0.08 + Math.min(edgeProfile, 25) / 500;
  const highlightStrength = phase === 'over'
    ? shadowStrength * 0.68
    : shadowStrength * 0.18;
  const blurRadius = phase === 'under' ? Math.max(2, Math.min(5, scale * 0.8)) : 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(layoutBounds.x, layoutBounds.y, layoutBounds.width, layoutBounds.height);
  ctx.clip();

  for (const tile of tiles) {
    const points = tile.points.map((point) => ({
      x: layoutBounds.x + point.x * scale,
      y: layoutBounds.y + point.y * scale,
    }));
    const winding = getPolygonArea(points) >= 0 ? 1 : -1;

    for (let index = 0; index < points.length; index++) {
      const start = points[index]!;
      const end = points[(index + 1) % points.length]!;
      const edge = subtract(end, start);
      const edgeLength = Math.hypot(edge.x, edge.y);
      if (edgeLength < 0.001) continue;

      const normal = normalize(
        winding > 0
          ? { x: edge.y, y: -edge.x }
          : { x: -edge.y, y: edge.x },
      );

      const gapSize = Math.abs(normal.x) * verticalGap + Math.abs(normal.y) * horizontalGap;
      if (gapSize <= 0.25) continue;

      const profileDepth = Math.max(
        phase === 'under' ? 0.7 : 0.55,
        Math.min(
          gapSize * (phase === 'under' ? 0.58 : 0.28),
          phase === 'under'
            ? 1.1 + (edgeDepth / 100) * 2.5
            : 0.8 + (edgeDepth / 100) * 1.2,
        ),
      );

      renderProfileStrip(ctx, start, end, normal, profileDepth, shadowStrength, highlightStrength, blurRadius, phase);
    }
  }

  ctx.restore();
}

function renderProfileStrip(
  ctx: CanvasRenderingContext2D,
  start: Vec2,
  end: Vec2,
  normal: Vec2,
  depth: number,
  shadowStrength: number,
  highlightStrength: number,
  blurRadius: number,
  phase: 'under' | 'over',
) {
  const direction = phase === 'under' ? normal : scale(normal, -1);
  const outerStart = add(start, scale(direction, depth));
  const outerEnd = add(end, scale(direction, depth));
  const midStart = add(start, scale(direction, depth * 0.52));
  const midEnd = add(end, scale(direction, depth * 0.52));

  const shadow = ctx.createLinearGradient(start.x, start.y, outerStart.x, outerStart.y);
  shadow.addColorStop(0, `rgba(0,0,0,${shadowStrength.toFixed(3)})`);
  shadow.addColorStop(0.22, `rgba(0,0,0,${(shadowStrength * 0.72).toFixed(3)})`);
  shadow.addColorStop(0.52, `rgba(0,0,0,${(shadowStrength * 0.34).toFixed(3)})`);
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  fillQuad(ctx, start, end, outerEnd, outerStart, shadow, blurRadius);

  if (phase === 'over') {
    const highlight = ctx.createLinearGradient(midStart.x, midStart.y, outerStart.x, outerStart.y);
    highlight.addColorStop(0, `rgba(255,255,255,${highlightStrength.toFixed(3)})`);
    highlight.addColorStop(0.5, `rgba(255,255,255,${(highlightStrength * 0.4).toFixed(3)})`);
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    fillQuad(ctx, midStart, midEnd, outerEnd, outerStart, highlight);

    const edgeShadow = ctx.createLinearGradient(start.x, start.y, midStart.x, midStart.y);
    edgeShadow.addColorStop(0, `rgba(0,0,0,${(shadowStrength * 0.65).toFixed(3)})`);
    edgeShadow.addColorStop(0.55, `rgba(0,0,0,${(shadowStrength * 0.18).toFixed(3)})`);
    edgeShadow.addColorStop(1, 'rgba(0,0,0,0)');
    fillQuad(ctx, start, end, midEnd, midStart, edgeShadow);
  }
}

function fillQuad(
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  c: Vec2,
  d: Vec2,
  fillStyle: CanvasFillStrokeStyles['fillStyle'],
  shadowBlur = 0,
) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  if (shadowBlur > 0) {
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
  }
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function getPolygonArea(points: PatternPoint[]) {
  let area = 0;
  for (let index = 0; index < points.length; index++) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(vector: Vec2, amount: number): Vec2 {
  return { x: vector.x * amount, y: vector.y * amount };
}

function normalize(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}
