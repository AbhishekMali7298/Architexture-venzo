import { getPatternByType, type PatternCategory, type PatternDefinition, type PatternType, type TextureConfig } from '@textura/shared';

function cloneConfig(config: TextureConfig): TextureConfig {
  return JSON.parse(JSON.stringify(config)) as TextureConfig;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyPatternDefinition(
  config: TextureConfig,
  definition: PatternDefinition,
  activeMaterialIndex = 0,
) {
  const next = cloneConfig(config);
  const activeMaterial = next.materials[activeMaterialIndex] ?? next.materials[0];

  next.pattern.type = definition.type;
  next.pattern.category = definition.category;
  next.pattern.rows = clamp(next.pattern.rows, definition.parameterRanges.rows.min, definition.parameterRanges.rows.max);
  next.pattern.columns = clamp(
    next.pattern.columns,
    definition.parameterRanges.columns.min,
    definition.parameterRanges.columns.max,
  );
  next.pattern.angle = clamp(
    definition.defaults.angle,
    definition.parameterRanges.angle.min,
    definition.parameterRanges.angle.max,
  );
  next.pattern.stretchers = clamp(
    definition.defaults.stretchers,
    definition.parameterRanges.stretchers?.min ?? definition.defaults.stretchers,
    definition.parameterRanges.stretchers?.max ?? definition.defaults.stretchers,
  );
  next.pattern.weaves = clamp(
    definition.defaults.weaves,
    definition.parameterRanges.weaves?.min ?? definition.defaults.weaves,
    definition.parameterRanges.weaves?.max ?? definition.defaults.weaves,
  );

  if (activeMaterial) {
    activeMaterial.width = Math.max(activeMaterial.minWidth, activeMaterial.width);
    activeMaterial.height = Math.max(activeMaterial.minHeight, activeMaterial.height);
  }

  return next;
}

export function sanitizePatternConfig(config: TextureConfig): TextureConfig {
  const definition = getPatternByType(config.pattern.type) ?? getPatternByType('stack_bond');
  if (!definition) {
    return cloneConfig(config);
  }

  return applyPatternDefinition(config, definition);
}

export function applyPatternTypeSelection(
  config: TextureConfig,
  type: PatternType,
  category: PatternCategory,
  activeMaterialIndex = 0,
) {
  const definition = getPatternByType(type);
  if (!definition) {
    const next = cloneConfig(config);
    next.pattern.type = type;
    next.pattern.category = category;
    return next;
  }

  return applyPatternDefinition(config, definition, activeMaterialIndex);
}
