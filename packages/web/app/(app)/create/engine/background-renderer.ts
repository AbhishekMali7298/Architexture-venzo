import type { TextureConfig, PatternType } from '@textura/shared';

// Seeded random — stable per config.seed
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 4294967296;
  };
}

// ======= Tile placement =======

export interface Tile {
  x: number; y: number;
  w: number; h: number;
  rotation: number; // degrees around tile center
  mi: number; // material index
}

function tilesRunningBond(cfg: TextureConfig): Tile[] {
  const { rows, columns } = cfg.pattern;
  const mat = cfg.materials[0]!;
  const jH = cfg.joints.horizontalSize;
  const jV = cfg.joints.verticalSize;
  const W = mat.width, H = mat.height;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    const ox = r % 2 === 1 ? (W + jV) / 2 : 0;
    for (let c = -1; c <= columns; c++) {
      tiles.push({ x: c * (W + jV) + ox, y: r * (H + jH), w: W, h: H, rotation: 0, mi: 0 });
    }
  }
  return tiles;
}

function tilesStackBond(cfg: TextureConfig): Tile[] {
  const { rows, columns } = cfg.pattern;
  const mat = cfg.materials[0]!;
  const jH = cfg.joints.horizontalSize, jV = cfg.joints.verticalSize;
  const W = mat.width, H = mat.height;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++)
      tiles.push({ x: c * (W + jV), y: r * (H + jH), w: W, h: H, rotation: 0, mi: 0 });
  return tiles;
}

function tilesHerringbone(cfg: TextureConfig): Tile[] {
  const { rows, columns } = cfg.pattern;
  const mat = cfg.materials[0]!;
  const j = cfg.joints.horizontalSize;
  const W = mat.width, H = mat.height;
  const u = W + j;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const bx = c * u, by = r * u;
      // Horizontal tile
      tiles.push({ x: bx, y: by, w: W, h: H, rotation: 0, mi: 0 });
      // Vertical tile (same brick rotated 90°)
      tiles.push({ x: bx + H + j, y: by, w: H, h: W, rotation: 0, mi: 0 });
    }
  }
  return tiles;
}

function tilesChevron(cfg: TextureConfig): Tile[] {
  const { rows, columns } = cfg.pattern;
  const mat = cfg.materials[0]!;
  const j = cfg.joints.horizontalSize;
  const W = mat.width, H = mat.height;
  const hw = W / 2;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      tiles.push({ x: c * (W + j), y: r * (H + j), w: hw, h: H, rotation: 0, mi: 0 });
      tiles.push({ x: c * (W + j) + hw + j, y: r * (H + j), w: hw, h: H, rotation: 0, mi: 0 });
    }
  }
  return tiles;
}

function tilesBasketweave(cfg: TextureConfig): Tile[] {
  const { rows, columns } = cfg.pattern;
  const mat = cfg.materials[0]!;
  const j = cfg.joints.horizontalSize;
  const W = mat.width, H = mat.height;
  const u = W + j;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const alt = (r + c) % 2 === 1;
      tiles.push({ x: c * u, y: r * u, w: alt ? H : W, h: alt ? W : H, rotation: 0, mi: 0 });
    }
  }
  return tiles;
}

function tilesHexagonal(cfg: TextureConfig): Tile[] {
  const { rows, columns } = cfg.pattern;
  const mat = cfg.materials[0]!;
  const j = cfg.joints.horizontalSize;
  const s = mat.width;
  const hexW = s + j;
  const hexH = s * 0.866 + j;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    const ox = r % 2 === 1 ? hexW / 2 : 0;
    for (let c = 0; c < columns; c++)
      tiles.push({ x: c * hexW + ox, y: r * hexH, w: s, h: s, rotation: 0, mi: 0 });
  }
  return tiles;
}

const LAYOUT_MAP: Partial<Record<PatternType, (cfg: TextureConfig) => Tile[]>> = {
  running_bond: tilesRunningBond,
  stretcher_bond: tilesRunningBond,
  flemish_bond: tilesRunningBond,
  english_bond: tilesRunningBond,
  soldier_course: tilesStackBond,
  subway: tilesRunningBond,
  stack_bond: tilesStackBond,
  herringbone: tilesHerringbone,
  chevron: tilesChevron,
  basketweave: tilesBasketweave,
  hexagonal: tilesHexagonal,
  pinwheel: tilesBasketweave,
  windmill: tilesBasketweave,
  parquet_straight: tilesStackBond,
  parquet_diagonal: tilesHerringbone,
  ashlar: tilesRunningBond,
  cobblestone: tilesStackBond,
  versailles: tilesBasketweave,
  crazy_paving: tilesStackBond,
};

// ======= Draw a single tile =======

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3
    ? c.split('').map(x => x + x).join('')
    : c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbAdjust([r, g, b]: [number, number, number], delta: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v + delta)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  edgeStyle: string,
  baseRgb: [number, number, number],
  toneVariation: number,
  rng: () => number,
  jointH: number, jointV: number,
  scale: number,
) {
  const jx = jointV * scale / 2;
  const jy = jointH * scale / 2;
  const tw = w * scale - jointV * scale;
  const th = h * scale - jointH * scale;

  const delta = (rng() - 0.5) * toneVariation * 1.5;
  ctx.fillStyle = rgbAdjust(baseRgb, delta);

  const r = edgeStyle === 'handmade' ? 3 * scale : edgeStyle === 'rough' ? 5 * scale : edgeStyle === 'fine' ? 1.5 * scale : 0;

  if (r > 0) {
    ctx.beginPath();
    ctx.moveTo(x + jx + r, y + jy);
    ctx.arcTo(x + jx + tw, y + jy, x + jx + tw, y + jy + th, r);
    ctx.arcTo(x + jx + tw, y + jy + th, x + jx, y + jy + th, r);
    ctx.arcTo(x + jx, y + jy + th, x + jx, y + jy, r);
    ctx.arcTo(x + jx, y + jy, x + jx + tw, y + jy, r);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x + jx, y + jy, tw, th);
  }

  // subtle top-left highlight
  if (edgeStyle !== 'none') {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + jx, y + jy, tw * 0.5, th * 0.2);
    ctx.fillRect(x + jx, y + jy, tw * 0.2, th * 0.5);
    ctx.restore();
  }

  // subtle grain dots
  if (toneVariation > 15) {
    ctx.save();
    ctx.globalAlpha = 0.025 + (toneVariation / 100) * 0.04;
    for (let i = 0; i < 12; i++) {
      const nx = x + jx + rng() * tw;
      const ny = y + jy + rng() * th;
      ctx.fillStyle = rng() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(nx, ny, 1.5 * scale, 1.5 * scale);
    }
    ctx.restore();
  }
}

// ======= Main renderer =======

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  cfg: TextureConfig,
  canvasW: number,
  canvasH: number,
): void {
  const rng = seededRng(cfg.seed);
  const mat = cfg.materials[0]!;
  const baseColor = mat.source.type === 'solid' ? mat.source.color : '#b8b0a8';
  const baseRgb = hexToRgb(baseColor);
  const jointColor = cfg.joints.tint ?? '#d4cfc6';
  const edgeStyle = mat.edges.style;
  const toneVariation = mat.toneVariation;
  const jH = cfg.joints.horizontalSize;
  const jV = cfg.joints.verticalSize;

  // Compute tile layout
  const layoutFn = LAYOUT_MAP[cfg.pattern.type] ?? tilesRunningBond;
  const tiles = layoutFn(cfg);
  if (!tiles.length) return;

  // Bounding box of the tile set
  let maxX = 0, maxY = 0;
  for (const t of tiles) {
    maxX = Math.max(maxX, t.x + t.w + jV);
    maxY = Math.max(maxY, t.y + t.h + jH);
  }

  // Scale so the tile set is ~40% of canvas width to enable tiling
  const targetW = canvasW * 0.42;
  const scale = targetW / maxX;
  const tileSetH = maxY * scale;
  const tileSetW = maxX * scale;

  // Fill with joint/mortar color first
  ctx.fillStyle = jointColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Tile the pattern across the entire canvas
  const startX = -(tileSetW % tileSetW);
  for (let ty = -tileSetH; ty < canvasH + tileSetH; ty += tileSetH) {
    for (let tx = 0; tx < canvasW + tileSetW; tx += tileSetW) {
      for (const tile of tiles) {
        drawTile(
          ctx,
          tx + tile.x * scale,
          ty + tile.y * scale,
          tile.w, tile.h,
          edgeStyle,
          baseRgb,
          toneVariation,
          rng,
          jH, jV,
          scale,
        );
      }
    }
  }
}

// ======= Dotted border overlay =======

export function drawDottedBorder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
) {
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
