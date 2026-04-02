import type { PatternOrientation, PatternType } from '@textura/shared';

export function supportsPatternOrientationToggle(type: PatternType) {
  return type !== 'none';
}

export function isVerticalPatternOrientation(orientation: PatternOrientation | null | undefined) {
  return (orientation ?? 'horizontal') === 'vertical';
}

export function togglePatternOrientation(orientation: PatternOrientation | null | undefined): PatternOrientation {
  return isVerticalPatternOrientation(orientation) ? 'horizontal' : 'vertical';
}

export function orientDimensions(
  width: number,
  height: number,
  orientation: PatternOrientation | null | undefined,
) {
  return isVerticalPatternOrientation(orientation)
    ? { width: height, height: width }
    : { width, height };
}

export function orientNormalizedOutline(
  outline: ReadonlyArray<{ x: number; y: number }> | undefined,
  orientation: PatternOrientation | null | undefined,
) {
  if (!outline?.length || !isVerticalPatternOrientation(orientation)) {
    return outline;
  }

  return outline.map((point) => ({
    x: 1 - point.y,
    y: point.x,
  }));
}
