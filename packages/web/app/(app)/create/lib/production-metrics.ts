import { getPatternByType, type TextureConfig } from '@textura/shared';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';
import { getPatternLayout } from './pattern-layout';

export type SheetPreviewPreset = 'none' | '4x8' | '4x10' | 'custom';

const MM_PER_INCH = 25.4;

function cloneConfig(config: TextureConfig) {
  return JSON.parse(JSON.stringify(config)) as TextureConfig;
}

function cloneConfigWithPatternSize(
  config: TextureConfig,
  rows: number,
  columns: number,
): TextureConfig {
  const nextConfig = cloneConfig(config);
  nextConfig.pattern.rows = Math.max(1, Math.round(rows));
  nextConfig.pattern.columns = Math.max(1, Math.round(columns));
  return nextConfig;
}

function findClosestCount(
  config: TextureConfig,
  axis: 'rows' | 'columns',
  target: number,
  svgPatternModule: SvgPatternModule | null,
) {
  const pattern = getPatternByType(config.pattern.type);
  const max =
    axis === 'columns'
      ? pattern?.parameterRanges.columns.max ?? 10
      : pattern?.parameterRanges.rows.max ?? 10;
  let bestCount = 1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let count = 1; count <= max; count++) {
    const layout = getPatternLayout(
      axis === 'columns'
        ? cloneConfigWithPatternSize(config, config.pattern.rows, count)
        : cloneConfigWithPatternSize(config, count, config.pattern.columns),
      svgPatternModule,
    );
    const value = axis === 'columns' ? layout.totalWidth : layout.totalHeight;
    const distance = Math.abs(value - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCount = count;
    }
  }

  return bestCount;
}

export function fitPatternToTargetSize(
  config: TextureConfig,
  targetWidth: number,
  targetHeight: number,
  svgPatternModule: SvgPatternModule | null,
) {
  const columns = findClosestCount(config, 'columns', Math.max(1, targetWidth), svgPatternModule);
  const rows = findClosestCount(config, 'rows', Math.max(1, targetHeight), svgPatternModule);
  const nextConfig = cloneConfigWithPatternSize(config, rows, columns);
  const layout = getPatternLayout(nextConfig, svgPatternModule);

  return {
    rows,
    columns,
    config: nextConfig,
    actualWidth: layout.totalWidth,
    actualHeight: layout.totalHeight,
    widthDelta: layout.totalWidth - targetWidth,
    heightDelta: layout.totalHeight - targetHeight,
  };
}

export function getSheetDimensions(
  units: TextureConfig['units'],
  preset: SheetPreviewPreset,
  customWidth: number,
  customHeight: number,
) {
  if (preset === 'none') {
    return null;
  }

  if (preset === 'custom') {
    return {
      width: Math.max(1, customWidth),
      height: Math.max(1, customHeight),
      label: `Custom Sheet`,
    };
  }

  const baseInches = preset === '4x10' ? { width: 48, height: 120 } : { width: 48, height: 96 };
  const factor = units === 'mm' ? MM_PER_INCH : 1;

  return {
    width: baseInches.width * factor,
    height: baseInches.height * factor,
    label: preset === '4x10' ? '4 × 10 ft Sheet' : '4 × 8 ft Sheet',
  };
}

export function formatMeasurement(value: number, units: TextureConfig['units']) {
  const decimals = units === 'inches' ? 2 : 0;
  return `${value.toFixed(decimals)} ${units === 'inches' ? 'in' : 'mm'}`;
}

export function getSheetCoverageSummary(
  patternWidth: number,
  patternHeight: number,
  sheetWidth: number,
  sheetHeight: number,
) {
  const fitAcross = Math.max(0, Math.floor(sheetWidth / Math.max(patternWidth, 1)));
  const fitDown = Math.max(0, Math.floor(sheetHeight / Math.max(patternHeight, 1)));
  const usedWidth = fitAcross * patternWidth;
  const usedHeight = fitDown * patternHeight;

  return {
    fitAcross,
    fitDown,
    leftoverWidth: Math.max(0, sheetWidth - usedWidth),
    leftoverHeight: Math.max(0, sheetHeight - usedHeight),
  };
}
