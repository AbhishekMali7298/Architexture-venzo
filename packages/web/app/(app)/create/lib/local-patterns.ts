import type { PatternCategory, PatternType } from '@textura/shared';

export interface LocalPatternOption {
  id: string;
  type: PatternType;
  category: PatternCategory;
  displayName: string;
  description: string;
  previewAssetPath: string;
}

export const LOCAL_PATTERN_OPTIONS: LocalPatternOption[] = [
  {
    id: 'common',
    type: 'running_bond',
    category: 'brick_bond',
    displayName: 'Common',
    description: 'Offset masonry layout using your uploaded common bond preview.',
    previewAssetPath: 'patterns/common.svg',
  },
  {
    id: 'stack',
    type: 'stack_bond',
    category: 'brick_bond',
    displayName: 'Stack',
    description: 'Bricks stacked directly on top of each other.',
    previewAssetPath: 'patterns/stack.svg',
  },
  {
    id: 'flemish',
    type: 'flemish_bond',
    category: 'brick_bond',
    displayName: 'Flemish',
    description: 'Alternating stretchers and headers.',
    previewAssetPath: 'patterns/flemish.svg',
  },
  {
    id: 'stretcher',
    type: 'stretcher_bond',
    category: 'brick_bond',
    displayName: 'Stretcher',
    description: 'Linear stretcher bond using your uploaded preview.',
    previewAssetPath: 'patterns/stretcher.svg',
  },
  {
    id: 'chevron',
    type: 'chevron',
    category: 'geometric',
    displayName: 'Chevron',
    description: 'V-shaped pattern with angled cuts.',
    previewAssetPath: 'patterns/chevron.svg',
  },
  {
    id: 'herringbone',
    type: 'herringbone',
    category: 'paving',
    displayName: 'Herringbone',
    description: 'Zigzag paving layout from your uploaded preview.',
    previewAssetPath: 'patterns/herringbone.svg',
  },
];

export function getLocalPatternOptionByType(type: PatternType) {
  return LOCAL_PATTERN_OPTIONS.find((pattern) => pattern.type === type) ?? null;
}
