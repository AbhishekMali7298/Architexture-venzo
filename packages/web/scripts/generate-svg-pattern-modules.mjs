#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PATTERN_DIR = path.join(ROOT, 'public/patterns');
const OUTPUT_FILE = path.join(ROOT, 'app/(app)/create/engine/generated/svg-pattern-modules.ts');

const MODULE_OVERRIDES = {
  fishscale: {
    referenceTileWidth: 1000,
    referenceTileHeight: 1000,
    repeatWidth: 1000,
    repeatHeight: 500,
  },
};

function tokenizePathData(d) {
  return d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
}

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y,
  };
}

function quadraticPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function vectorAngle(ux, uy, vx, vy) {
  const dot = ux * vx + uy * vy;
  const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  const ratio = Math.max(-1, Math.min(1, len === 0 ? 1 : dot / len));
  const sign = ux * vy - uy * vx < 0 ? -1 : 1;
  return sign * Math.acos(ratio);
}

function arcToPoints(x1, y1, rxInput, ryInput, xAxisRotation, largeArcFlag, sweepFlag, x2, y2, samples = 24) {
  let rx = Math.abs(rxInput);
  let ry = Math.abs(ryInput);
  if (rx === 0 || ry === 0) return [{ x: x2, y: y2 }];

  const phi = (xAxisRotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  const sign = largeArcFlag === sweepFlag ? -1 : 1;
  const numerator = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
  const denominator = rxSq * y1pSq + rySq * x1pSq;
  const factor = sign * Math.sqrt(Math.max(0, numerator / Math.max(denominator, 1e-12)));
  const cxp = factor * ((rx * y1p) / ry);
  const cyp = factor * (-(ry * x1p) / rx);
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const v1x = (x1p - cxp) / rx;
  const v1y = (y1p - cyp) / ry;
  const v2x = (-x1p - cxp) / rx;
  const v2y = (-y1p - cyp) / ry;
  let theta1 = vectorAngle(1, 0, v1x, v1y);
  let deltaTheta = vectorAngle(v1x, v1y, v2x, v2y);

  if (!sweepFlag && deltaTheta > 0) deltaTheta -= Math.PI * 2;
  if (sweepFlag && deltaTheta < 0) deltaTheta += Math.PI * 2;

  const points = [];
  for (let index = 1; index <= samples; index++) {
    const t = index / samples;
    const theta = theta1 + deltaTheta * t;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    points.push({
      x: cosPhi * rx * cosTheta - sinPhi * ry * sinTheta + cx,
      y: sinPhi * rx * cosTheta + cosPhi * ry * sinTheta + cy,
    });
  }

  return points;
}

function parsePathPoints(d) {
  const tokens = tokenizePathData(d);
  let index = 0;
  let command = '';
  let x = 0;
  let y = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;
  const points = [];
  let isClosed = false;
  let lastCubicControlX = null;
  let lastCubicControlY = null;
  let lastQuadraticControlX = null;
  let lastQuadraticControlY = null;

  const readNumber = () => {
    if (index >= tokens.length) return null;
    const token = tokens[index];
    if (!token || /^[a-zA-Z]$/.test(token)) return null;
    index += 1;
    return Number(token);
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (token && /^[a-zA-Z]$/.test(token)) {
      command = token;
      index += 1;
    }
    if (!command) break;

    const lower = command.toLowerCase();
    const relative = command === lower;

    if (lower === 'm') {
      const nx = readNumber();
      const ny = readNumber();
      if (nx === null || ny === null) break;
      x = relative ? x + nx : nx;
      y = relative ? y + ny : ny;
      subpathStartX = x;
      subpathStartY = y;
      points.push({ x, y });
      command = relative ? 'l' : 'L';
      lastCubicControlX = null;
      lastCubicControlY = null;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 'l') {
      const nx = readNumber();
      const ny = readNumber();
      if (nx === null || ny === null) continue;
      x = relative ? x + nx : nx;
      y = relative ? y + ny : ny;
      points.push({ x, y });
      lastCubicControlX = null;
      lastCubicControlY = null;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 'h') {
      const nx = readNumber();
      if (nx === null) continue;
      x = relative ? x + nx : nx;
      points.push({ x, y });
      lastCubicControlX = null;
      lastCubicControlY = null;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 'v') {
      const ny = readNumber();
      if (ny === null) continue;
      y = relative ? y + ny : ny;
      points.push({ x, y });
      lastCubicControlX = null;
      lastCubicControlY = null;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 'c') {
      const x1 = readNumber();
      const y1 = readNumber();
      const x2 = readNumber();
      const y2 = readNumber();
      const x3 = readNumber();
      const y3 = readNumber();
      if ([x1, y1, x2, y2, x3, y3].some((value) => value === null)) continue;
      const p0 = { x, y };
      const p1 = { x: relative ? x + x1 : x1, y: relative ? y + y1 : y1 };
      const p2 = { x: relative ? x + x2 : x2, y: relative ? y + y2 : y2 };
      const p3 = { x: relative ? x + x3 : x3, y: relative ? y + y3 : y3 };
      for (let sample = 1; sample <= 24; sample++) {
        points.push(cubicPoint(p0, p1, p2, p3, sample / 24));
      }
      x = p3.x;
      y = p3.y;
      lastCubicControlX = p2.x;
      lastCubicControlY = p2.y;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 's') {
      const x2 = readNumber();
      const y2 = readNumber();
      const x3 = readNumber();
      const y3 = readNumber();
      if ([x2, y2, x3, y3].some((value) => value === null)) continue;
      const p0 = { x, y };
      const p1 = {
        x: lastCubicControlX === null ? x : x + (x - lastCubicControlX),
        y: lastCubicControlY === null ? y : y + (y - lastCubicControlY),
      };
      const p2 = { x: relative ? x + x2 : x2, y: relative ? y + y2 : y2 };
      const p3 = { x: relative ? x + x3 : x3, y: relative ? y + y3 : y3 };
      for (let sample = 1; sample <= 24; sample++) {
        points.push(cubicPoint(p0, p1, p2, p3, sample / 24));
      }
      x = p3.x;
      y = p3.y;
      lastCubicControlX = p2.x;
      lastCubicControlY = p2.y;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 'q') {
      const x1 = readNumber();
      const y1 = readNumber();
      const x2 = readNumber();
      const y2 = readNumber();
      if ([x1, y1, x2, y2].some((value) => value === null)) continue;
      const p0 = { x, y };
      const p1 = { x: relative ? x + x1 : x1, y: relative ? y + y1 : y1 };
      const p2 = { x: relative ? x + x2 : x2, y: relative ? y + y2 : y2 };
      for (let sample = 1; sample <= 16; sample++) {
        points.push(quadraticPoint(p0, p1, p2, sample / 16));
      }
      x = p2.x;
      y = p2.y;
      lastQuadraticControlX = p1.x;
      lastQuadraticControlY = p1.y;
      lastCubicControlX = null;
      lastCubicControlY = null;
      continue;
    }

    if (lower === 't') {
      const x2 = readNumber();
      const y2 = readNumber();
      if ([x2, y2].some((value) => value === null)) continue;
      const p0 = { x, y };
      const p1 = {
        x: lastQuadraticControlX === null ? x : x + (x - lastQuadraticControlX),
        y: lastQuadraticControlY === null ? y : y + (y - lastQuadraticControlY),
      };
      const p2 = { x: relative ? x + x2 : x2, y: relative ? y + y2 : y2 };
      for (let sample = 1; sample <= 16; sample++) {
        points.push(quadraticPoint(p0, p1, p2, sample / 16));
      }
      x = p2.x;
      y = p2.y;
      lastQuadraticControlX = p1.x;
      lastQuadraticControlY = p1.y;
      lastCubicControlX = null;
      lastCubicControlY = null;
      continue;
    }

    if (lower === 'a') {
      const rx = readNumber();
      const ry = readNumber();
      const rotation = readNumber();
      const largeArcFlag = readNumber();
      const sweepFlag = readNumber();
      const nx = readNumber();
      const ny = readNumber();
      if ([rx, ry, rotation, largeArcFlag, sweepFlag, nx, ny].some((value) => value === null)) continue;
      const targetX = relative ? x + nx : nx;
      const targetY = relative ? y + ny : ny;
      points.push(...arcToPoints(x, y, rx, ry, rotation, largeArcFlag, sweepFlag, targetX, targetY));
      x = targetX;
      y = targetY;
      lastCubicControlX = null;
      lastCubicControlY = null;
      lastQuadraticControlX = null;
      lastQuadraticControlY = null;
      continue;
    }

    if (lower === 'z') {
      x = subpathStartX;
      y = subpathStartY;
      isClosed = true;
      index += 1;
      continue;
    }

    return null;
  }

  if (points.length < 2) return null;
  return { points, isClosed };
}

function parseSvgViewBox(svg) {
  const match = svg.match(/viewBox="([^"]+)"/i);
  if (!match) return null;
  const parts = match[1].trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) return null;
  return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
}

function sampleCircle(cx, cy, r, samples = 48) {
  const points = [];
  for (let index = 0; index < samples; index++) {
    const theta = (index / samples) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(theta) * r,
      y: cy + Math.sin(theta) * r,
    });
  }
  return { points, isClosed: true };
}

function median(values) {
  if (!values.length) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function generate() {
  const modules = {};
  const diagnostics = [];

  const files = await fs.readdir(PATTERN_DIR);
  for (const filename of files) {
    if (!filename.endsWith('.svg')) continue;

    const patternType = path.basename(filename, '.svg');
    const fullPath = path.join(PATTERN_DIR, filename);
    const svg = await fs.readFile(fullPath, 'utf8');
    const viewBox = parseSvgViewBox(svg);
    if (!viewBox) continue;

    const pathMatches = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*>/gi)];
    const circleMatches = [...svg.matchAll(/<circle[^>]*\scx="([^"]+)"[^>]*\scy="([^"]+)"[^>]*\sr="([^"]+)"[^>]*>/gi)];
    const tiles = [];
    const strokes = [];

    for (const pathMatch of pathMatches) {
      const d = pathMatch[1];
      if (!d) continue;
      const parsed = parsePathPoints(d);
      if (!parsed) continue;

      if (!parsed.isClosed) {
        strokes.push({
          points: parsed.points.map((point) => ({ x: point.x - viewBox.minX, y: point.y - viewBox.minY })),
          closed: false,
        });
        continue;
      }

      const minX = Math.min(...parsed.points.map((point) => point.x));
      const maxX = Math.max(...parsed.points.map((point) => point.x));
      const minY = Math.min(...parsed.points.map((point) => point.y));
      const maxY = Math.max(...parsed.points.map((point) => point.y));
      const width = maxX - minX;
      const height = maxY - minY;
      if (width <= 0 || height <= 0) continue;

      tiles.push({
        x: minX - viewBox.minX,
        y: minY - viewBox.minY,
        width,
        height,
        clipPath: parsed.points.map((point) => ({ x: point.x - minX, y: point.y - minY })),
      });
    }

    for (const circleMatch of circleMatches) {
      const cx = Number(circleMatch[1]);
      const cy = Number(circleMatch[2]);
      const r = Number(circleMatch[3]);
      if ([cx, cy, r].some((value) => Number.isNaN(value))) continue;
      const parsed = sampleCircle(cx, cy, r);
      strokes.push({
        points: parsed.points.map((point) => ({ x: point.x - viewBox.minX, y: point.y - viewBox.minY })),
        closed: true,
      });
    }

    const override = MODULE_OVERRIDES[patternType];
    const referenceTileWidth = override?.referenceTileWidth ?? median(tiles.map((tile) => tile.width));
    const referenceTileHeight = override?.referenceTileHeight ?? median(tiles.map((tile) => tile.height));

    modules[patternType] = {
      viewBoxWidth: viewBox.width,
      viewBoxHeight: viewBox.height,
      referenceTileWidth,
      referenceTileHeight,
      ...(override?.repeatWidth ? { repeatWidth: override.repeatWidth } : {}),
      ...(override?.repeatHeight ? { repeatHeight: override.repeatHeight } : {}),
      tiles,
      strokes,
    };

    diagnostics.push(`${patternType}: ${tiles.length} tile path(s), ${strokes.length} stroke path(s) from ${filename}`);
  }

  const outputDir = path.dirname(OUTPUT_FILE);
  await fs.mkdir(outputDir, { recursive: true });

  const content = `/* eslint-disable */
// Auto-generated by packages/web/scripts/generate-svg-pattern-modules.mjs
// Do not edit manually. Re-run the generator after updating SVG pattern files.

export interface SvgPatternModuleTile {
  x: number;
  y: number;
  width: number;
  height: number;
  clipPath: Array<{ x: number; y: number }>;
}

export interface SvgPatternModuleStroke {
  points: Array<{ x: number; y: number }>;
  closed: boolean;
}

export interface SvgPatternModule {
  viewBoxWidth: number;
  viewBoxHeight: number;
  referenceTileWidth: number;
  referenceTileHeight: number;
  repeatWidth?: number;
  repeatHeight?: number;
  tiles: SvgPatternModuleTile[];
  strokes: SvgPatternModuleStroke[];
}

export const SVG_PATTERN_MODULES: Record<string, SvgPatternModule> = ${JSON.stringify(modules, null, 2)} as const;
`;

  await fs.writeFile(OUTPUT_FILE, content, 'utf8');

  console.log(`Generated ${path.relative(ROOT, OUTPUT_FILE)}`);
  for (const line of diagnostics) {
    console.log(`- ${line}`);
  }
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
