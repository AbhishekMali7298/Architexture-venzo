import type { TextureConfig } from '@textura/shared';
import type { PatternPoint, PatternTile } from '../lib/pattern-layout';

type Vec2 = {
  x: number;
  y: number;
};

/**
 * Renders joint depth profiles as subtle gradients constrained to the actual
 * joint width. Each tile edge only paints into half of the gap, which keeps
 * shared joints from becoming double-darkened.
 * 
 * @deprecated Recess and concave joints have been removed. This function is kept for backward compatibility but does nothing.
 */
export function renderJointProfile(
  _ctx: CanvasRenderingContext2D,
  _config: TextureConfig,
  _layoutBounds: { x: number; y: number; width: number; height: number },
  _scale: number,
  _tiles: PatternTile[],
): void {
  // No-op: recess and concave joints have been removed
  return;
}
