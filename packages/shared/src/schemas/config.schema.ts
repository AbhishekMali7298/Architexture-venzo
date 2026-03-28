import { z } from 'zod';

// ======= Reusable Schemas =======

export const imageAdjustmentsSchema = z.object({
  brightness: z.number().min(-100).max(100),
  contrast: z.number().min(-100).max(100),
  hue: z.number().min(-180).max(180),
  saturation: z.number().min(-100).max(100),
  invertColors: z.boolean(),
});

export const imageAdjustmentsWithOpacitySchema = imageAdjustmentsSchema.extend({
  opacity: z.number().min(0).max(100),
});

export const materialAssetRefSchema = z.object({
  path: z.string().min(1),
  mimeType: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const materialSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('library'), assetId: z.string().min(1) }),
  z.object({ type: z.literal('upload'), uploadId: z.string().min(1) }),
  z.object({ type: z.literal('solid'), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }),
  z.object({
    type: z.literal('image'),
    asset: materialAssetRefSchema,
    fallbackColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  z.object({
    type: z.literal('generated'),
    recipe: z.string().min(1),
    asset: materialAssetRefSchema.nullable(),
    fallbackColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
]);

// ======= PBR =======

export const pbrMapConfigSchema = z.object({
  geometry: z.boolean(),
  edgeDepth: z.number().min(0).max(100),
  imageSource: z.enum(['none', 'grayscale', 'find_edges']),
  adjustments: imageAdjustmentsWithOpacitySchema,
});

export const pbrConfigSchema = z.object({
  bump: pbrMapConfigSchema,
  specular: pbrMapConfigSchema,
  normal: pbrMapConfigSchema,
  displacement: pbrMapConfigSchema,
  roughness: pbrMapConfigSchema.extend({ baseRoughness: z.number().min(0).max(100) }),
  metalness: pbrMapConfigSchema.extend({ baseMetalness: z.number().min(0).max(100) }),
});

// ======= Placement =======

export const ruleSequenceSchema = z.object({
  pattern: z.array(z.enum(['hit', 'miss'])).min(1),
  shift: z.number().int().min(0),
});

export const placementRulesSchema = z.object({
  rows: z.array(ruleSequenceSchema),
  columns: z.array(ruleSequenceSchema),
});

// ======= Pattern =======

export const patternCategorySchema = z.enum([
  'brick_bond',
  'paving',
  'parquetry',
  'geometric',
  'organic',
  'random',
  'roofing',
]);

export const patternTypeSchema = z.enum([
  'running_bond',
  'stack_bond',
  'flemish_bond',
  'english_bond',
  'herringbone',
  'chevron',
  'basketweave',
  'hexagonal',
  'ashlar',
  'stretcher_bond',
  'soldier_course',
  'crazy_paving',
  'cobblestone',
  'subway',
  'pinwheel',
  'windmill',
  'parquet_straight',
  'parquet_diagonal',
  'versailles',
]);

export const patternConfigSchema = z.object({
  type: patternTypeSchema,
  category: patternCategorySchema,
  rows: z.number().int().min(1).max(100),
  columns: z.number().int().min(1).max(100),
  angle: z.number().min(0).max(360),
  stretchers: z.number().int().min(1).max(20),
  weaves: z.number().int().min(1).max(20),
});

// ======= Material =======

export const materialConfigSchema = z.object({
  id: z.string().min(1),
  definitionId: z.string().min(1).nullable(),
  source: materialSourceSchema,
  uploadWidth: z.number().positive().nullable(),
  width: z.number().positive(),
  height: z.number().positive(),
  minWidth: z.number().positive(),
  minHeight: z.number().positive(),

  appearance: z.object({
    lightIntensity: z.number().min(0).max(100),
    surface: z.enum(['none', 'vermiculated', 'rough', 'grooved', 'voids']),
    surfaceScale: z.number().min(0).max(100),
  }),

  adjustments: imageAdjustmentsSchema,
  tint: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),

  edges: z.object({
    style: z.enum(['none', 'fine', 'handmade', 'rough', 'uneven']),
    perimeterScale: z.number().min(0).max(100),
    profileWidth: z.number().min(0).max(100),
    excludeSides: z.array(z.number().int().min(1).max(6)),
  }),

  profile: z.string().nullable(),
  finish: z.string().nullable(),
  toneVariation: z.number().min(0).max(100),
  randomiseFillAngle: z.boolean(),

  placement: z.object({
    mode: z.enum(['random', 'defined', 'manual']),
    frequency: z.number().min(0).max(100),
    rules: placementRulesSchema.nullable(),
  }),

  pbr: pbrConfigSchema,
});

// ======= Joints =======

export const jointsConfigSchema = z.object({
  materialSource: materialSourceSchema,
  tint: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  horizontalSize: z.number().min(0),
  verticalSize: z.number().min(0),
  linkedDimensions: z.boolean(),
  shadowOpacity: z.number().min(0).max(100),
  recess: z.boolean(),
  concave: z.boolean(),
  adjustments: imageAdjustmentsSchema,
});

// ======= Hatch =======

export const hatchConfigSchema = z.object({
  format: z.enum(['autocad', 'revit_model', 'revit_drafting', 'dxf', 'svg', 'png']),
  expressJoints: z.boolean(),
  depth: z.number().min(0).max(100),
});

// ======= Full TextureConfig =======

export const textureConfigSchema = z.object({
  version: z.literal(1),
  seed: z.number().int().min(0).max(2147483647),
  units: z.enum(['mm', 'inches']),
  pattern: patternConfigSchema,
  materials: z.array(materialConfigSchema).min(1).max(5),
  joints: jointsConfigSchema,
  hatch: hatchConfigSchema.nullable(),
  surfaceProfile: z.string().nullable(),
  surfaceFinish: z.string().nullable(),
  output: z.object({
    widthPx: z.number().int().min(100).max(8192),
    heightPx: z.number().int().min(100).max(8192),
  }),
});

// ======= Inferred Types =======

export type TextureConfigInput = z.input<typeof textureConfigSchema>;
export type TextureConfigOutput = z.output<typeof textureConfigSchema>;
