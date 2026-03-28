import type { TextureConfig, PatternType } from '@textura/shared';

/**
 * Represents a single tile in the rendered pattern.
 */
export interface RenderedTile {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  materialIndex: number;
}

/**
 * Represents a joint line between tiles.
 */
export interface RenderedJoint {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

/**
 * Output of the pattern layout engine.
 */
export interface PatternLayout {
  tiles: RenderedTile[];
  joints: RenderedJoint[];
  totalWidth: number;
  totalHeight: number;
}

// ======= Seeded Random =======

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

// ======= Layout Generators =======

function layoutRunningBond(config: TextureConfig): PatternLayout {
  const { rows, columns } = config.pattern;
  const mat = config.materials[0]!;
  const jH = config.joints.horizontalSize;
  const jV = config.joints.verticalSize;
  const tileW = mat.width;
  const tileH = mat.height;

  const tiles: RenderedTile[] = [];
  const joints: RenderedJoint[] = [];

  for (let r = 0; r < rows; r++) {
    const offsetX = r % 2 === 1 ? (tileW + jV) / 2 : 0;
    for (let c = 0; c < columns; c++) {
      const x = c * (tileW + jV) + offsetX;
      const y = r * (tileH + jH);
      tiles.push({ x, y, width: tileW, height: tileH, rotation: 0, materialIndex: 0 });
    }

    // Horizontal joint line
    if (r > 0) {
      const y = r * (tileH + jH) - jH / 2;
      joints.push({ x1: 0, y1: y, x2: columns * (tileW + jV) + tileW, y2: y, width: jH });
    }
  }

  const totalWidth = columns * (tileW + jV) + tileW / 2;
  const totalHeight = rows * (tileH + jH);
  return { tiles, joints, totalWidth, totalHeight };
}

function layoutStackBond(config: TextureConfig): PatternLayout {
  const { rows, columns } = config.pattern;
  const mat = config.materials[0]!;
  const jH = config.joints.horizontalSize;
  const jV = config.joints.verticalSize;
  const tileW = mat.width;
  const tileH = mat.height;

  const tiles: RenderedTile[] = [];
  const joints: RenderedJoint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      tiles.push({
        x: c * (tileW + jV),
        y: r * (tileH + jH),
        width: tileW,
        height: tileH,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  const totalWidth = columns * (tileW + jV);
  const totalHeight = rows * (tileH + jH);
  return { tiles, joints, totalWidth, totalHeight };
}

function layoutHerringbone(config: TextureConfig): PatternLayout {
  const { rows, columns } = config.pattern;
  const mat = config.materials[0]!;
  const jH = config.joints.horizontalSize;
  const tileW = mat.width;
  const tileH = mat.height;

  const tiles: RenderedTile[] = [];
  const joints: RenderedJoint[] = [];
  const unit = tileW + jH;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const baseX = c * unit;
      const baseY = r * unit;

      // Horizontal tile
      tiles.push({
        x: baseX,
        y: baseY,
        width: tileW,
        height: tileH,
        rotation: 0,
        materialIndex: 0,
      });

      // Vertical tile
      tiles.push({
        x: baseX + tileH + jH,
        y: baseY,
        width: tileH,
        height: tileW,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  const totalWidth = columns * unit + tileH + jH;
  const totalHeight = rows * unit;
  return { tiles, joints, totalWidth, totalHeight };
}

function layoutChevron(config: TextureConfig): PatternLayout {
  const { rows, columns } = config.pattern;
  const mat = config.materials[0]!;
  const jH = config.joints.horizontalSize;
  const tileW = mat.width;
  const tileH = mat.height;

  const tiles: RenderedTile[] = [];
  const joints: RenderedJoint[] = [];
  const halfW = tileW / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const baseX = c * tileW;
      const baseY = r * (tileH + jH);

      // Left-leaning tile
      tiles.push({
        x: baseX,
        y: baseY,
        width: halfW,
        height: tileH,
        rotation: 0,
        materialIndex: 0,
      });

      // Right-leaning tile
      tiles.push({
        x: baseX + halfW + jH,
        y: baseY,
        width: halfW,
        height: tileH,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  const totalWidth = columns * tileW + jH;
  const totalHeight = rows * (tileH + jH);
  return { tiles, joints, totalWidth, totalHeight };
}

function layoutBasketweave(config: TextureConfig): PatternLayout {
  const { rows, columns } = config.pattern;
  const mat = config.materials[0]!;
  const jH = config.joints.horizontalSize;
  const tileW = mat.width;
  const tileH = mat.height;

  const tiles: RenderedTile[] = [];
  const joints: RenderedJoint[] = [];
  const unitSize = tileW + jH;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const x = c * unitSize;
      const y = r * unitSize;
      const isAlternate = (r + c) % 2 === 1;

      if (isAlternate) {
        // Vertical pair
        tiles.push({ x, y, width: tileH, height: tileW, rotation: 0, materialIndex: 0 });
      } else {
        // Horizontal pair
        tiles.push({ x, y, width: tileW, height: tileH, rotation: 0, materialIndex: 0 });
      }
    }
  }

  const totalWidth = columns * unitSize;
  const totalHeight = rows * unitSize;
  return { tiles, joints, totalWidth, totalHeight };
}

function layoutHexagonal(config: TextureConfig): PatternLayout {
  const { rows, columns } = config.pattern;
  const mat = config.materials[0]!;
  const jH = config.joints.horizontalSize;
  const size = mat.width;

  const tiles: RenderedTile[] = [];
  const joints: RenderedJoint[] = [];
  const hexW = size + jH;
  const hexH = (size * Math.sqrt(3)) / 2 + jH;

  for (let r = 0; r < rows; r++) {
    const offsetX = r % 2 === 1 ? hexW / 2 : 0;
    for (let c = 0; c < columns; c++) {
      tiles.push({
        x: c * hexW + offsetX,
        y: r * hexH,
        width: size,
        height: size,
        rotation: 0,
        materialIndex: 0,
      });
    }
  }

  const totalWidth = columns * hexW + hexW / 2;
  const totalHeight = rows * hexH;
  return { tiles, joints, totalWidth, totalHeight };
}

function layoutSubway(config: TextureConfig): PatternLayout {
  // Subway is the same as running bond
  return layoutRunningBond(config);
}

// ======= Layout Router =======

const LAYOUT_MAP: Partial<Record<PatternType, (config: TextureConfig) => PatternLayout>> = {
  running_bond: layoutRunningBond,
  stack_bond: layoutStackBond,
  herringbone: layoutHerringbone,
  chevron: layoutChevron,
  basketweave: layoutBasketweave,
  hexagonal: layoutHexagonal,
  subway: layoutSubway,
  stretcher_bond: layoutRunningBond,
  soldier_course: layoutStackBond,
  flemish_bond: layoutRunningBond,
  english_bond: layoutRunningBond,
  ashlar: layoutRunningBond,
  cobblestone: layoutStackBond,
  pinwheel: layoutBasketweave,
  windmill: layoutBasketweave,
  parquet_straight: layoutStackBond,
  parquet_diagonal: layoutStackBond,
  versailles: layoutStackBond,
  crazy_paving: layoutStackBond,
};

export function computePatternLayout(config: TextureConfig): PatternLayout {
  const layoutFn = LAYOUT_MAP[config.pattern.type] ?? layoutRunningBond;
  return layoutFn(config);
}

// ======= Canvas 2D Renderer =======

/**
 * Render patterns + tiles + joints onto a canvas.
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextureConfig,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const layout = computePatternLayout(config);
  const rng = seededRandom(config.seed);

  // Calculate scale to fit the pattern in the canvas
  const scaleX = canvasWidth / layout.totalWidth;
  const scaleY = canvasHeight / layout.totalHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  const offsetX = (canvasWidth - layout.totalWidth * scale) / 2;
  const offsetY = (canvasHeight - layout.totalHeight * scale) / 2;

  // Clear
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background (joint/mortar color)
  const jointColor = config.joints.tint ?? '#d4cfc6';
  ctx.fillStyle = jointColor;
  ctx.fillRect(
    offsetX,
    offsetY,
    layout.totalWidth * scale,
    layout.totalHeight * scale,
  );

  // Render tiles
  for (const tile of layout.tiles) {
    const mat = config.materials[tile.materialIndex] ?? config.materials[0]!;
    const baseColor = mat.source.type === 'solid' ? mat.source.color : '#b0a090';

    // Apply tone variation
    const variation = mat.toneVariation;
    const r = rng();
    const variationAmount = (r - 0.5) * variation * 0.4;
    const tileColor = adjustBrightness(baseColor, variationAmount);

    ctx.save();
    ctx.translate(offsetX + tile.x * scale, offsetY + tile.y * scale);

    if (tile.rotation !== 0) {
      ctx.translate((tile.width * scale) / 2, (tile.height * scale) / 2);
      ctx.rotate((tile.rotation * Math.PI) / 180);
      ctx.translate(-(tile.width * scale) / 2, -(tile.height * scale) / 2);
    }

    // Tile fill
    ctx.fillStyle = tileColor;
    const tileX = config.joints.verticalSize * scale / 2;
    const tileY = config.joints.horizontalSize * scale / 2;
    const tileW = tile.width * scale - config.joints.verticalSize * scale;
    const tileH = tile.height * scale - config.joints.horizontalSize * scale;

    // Rounded corners for handmade edges
    const cornerRadius = mat.edges.style === 'handmade' ? 2 : mat.edges.style === 'rough' ? 3 : 0;
    if (cornerRadius > 0) {
      roundRect(ctx, tileX, tileY, tileW, tileH, cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(tileX, tileY, tileW, tileH);
    }

    // Edge shadow for depth
    if (mat.edges.style !== 'none') {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      if (cornerRadius > 0) {
        roundRect(ctx, tileX, tileY, tileW, tileH, cornerRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(tileX, tileY, tileW, tileH);
      }
    }

    // Subtle texture noise
    if (variation > 10) {
      ctx.globalAlpha = 0.03 + (variation / 100) * 0.05;
      for (let i = 0; i < 20; i++) {
        const nx = tileX + rng() * tileW;
        const ny = tileY + rng() * tileH;
        const ns = 1 + rng() * 3;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(nx, ny, ns, ns);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // Joint shadow overlay
  const shadowOpacity = config.joints.shadowOpacity / 100;
  if (shadowOpacity > 0) {
    ctx.strokeStyle = `rgba(0,0,0,${shadowOpacity * 0.4})`;
    ctx.lineWidth = Math.max(1, config.joints.horizontalSize * scale * 0.5);

    for (const tile of layout.tiles) {
      const tileX = offsetX + tile.x * scale + config.joints.verticalSize * scale / 2;
      const tileY = offsetY + tile.y * scale + config.joints.horizontalSize * scale / 2;
      const tileW = tile.width * scale - config.joints.verticalSize * scale;
      const tileH = tile.height * scale - config.joints.horizontalSize * scale;

      // Bottom shadow
      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileH + 1);
      ctx.lineTo(tileX + tileW, tileY + tileH + 1);
      ctx.stroke();

      // Right shadow
      ctx.beginPath();
      ctx.moveTo(tileX + tileW + 1, tileY);
      ctx.lineTo(tileX + tileW + 1, tileY + tileH);
      ctx.stroke();
    }
  }

  // Blue dotted border (like Architextures)
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(100, 140, 240, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    offsetX - 2,
    offsetY - 2,
    layout.totalWidth * scale + 4,
    layout.totalHeight * scale + 4,
  );
  ctx.setLineDash([]);
}

// ======= Helpers =======

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + Math.round(amount * 255)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + Math.round(amount * 255)));
  const b = Math.max(0, Math.min(255, (num & 0xff) + Math.round(amount * 255)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
