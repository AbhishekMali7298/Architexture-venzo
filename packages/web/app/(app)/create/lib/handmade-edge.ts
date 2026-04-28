import type { PatternTile } from './pattern-layout';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileRenderShape {
  points: any[];
  bounds: Bounds;
}

export function isPresetEdgeStyle(_style: any) {
  return false;
}

export function getDefaultEdgeWidth(_style: any) {
  return 25;
}

export function getDefaultEdgeScale(_style: any) {
  return 1;
}

export function getTileRenderShape(
  tile: PatternTile,
  _material: any,
  _seed: number,
  _tileIndex: number,
): TileRenderShape {
  return {
    points: tile.points,
    bounds: tile.bounds,
  };
}
