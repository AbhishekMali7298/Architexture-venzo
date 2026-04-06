import type { TextureConfig } from '@textura/shared';

export interface StackTile {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StackLayout {
  tiles: StackTile[];
  totalWidth: number;
  totalHeight: number;
}

export function getStackLayout(config: TextureConfig): StackLayout {
  const material = config.materials[0]!;
  const columns = Math.max(1, Math.floor(config.pattern.columns || 1));
  const rows = Math.max(1, Math.floor(config.pattern.rows || 1));
  const tileWidth = Math.max(1, material.width);
  const tileHeight = Math.max(1, material.height);
  const jointHorizontal = Math.max(0, config.joints.horizontalSize);
  const jointVertical = Math.max(0, config.joints.verticalSize);
  const stepX = tileWidth + jointVertical;
  const stepY = tileHeight + jointHorizontal;
  const tiles: StackTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      tiles.push({
        x: column * stepX,
        y: row * stepY,
        width: tileWidth,
        height: tileHeight,
      });
    }
  }

  return {
    tiles,
    totalWidth: columns * tileWidth + Math.max(0, columns - 1) * jointVertical + jointVertical,
    totalHeight: rows * tileHeight + Math.max(0, rows - 1) * jointHorizontal + jointHorizontal,
  };
}
