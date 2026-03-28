import { z } from 'zod';
import { textureConfigSchema } from './config.schema';

// ======= Auth Schemas =======

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

// ======= Project Schemas =======

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  config: textureConfigSchema,
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const saveDraftSchema = z.object({
  config: textureConfigSchema,
});

export const createVersionSchema = z.object({
  config: textureConfigSchema,
  thumbnail: z.string().optional(),
});

// ======= Upload Schemas =======

export const createCropSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
});

// ======= Export Schemas =======

export const mapTypeSchema = z.enum([
  'diffuse',
  'bump',
  'specular',
  'normal',
  'displacement',
  'roughness',
  'metalness',
]);

export const createExportSchema = z.object({
  projectId: z.string().min(1),
  versionId: z.string().min(1),
  maps: z.array(mapTypeSchema).min(1),
  width: z.number().int().min(100).max(8192),
  height: z.number().int().min(100).max(8192),
  format: z.enum(['png', 'jpg', 'tiff', 'exr']),
  bitDepth: z.union([z.literal(8), z.literal(16)]),
});

// ======= Library Schemas =======

export const libraryQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// ======= Billing Schemas =======

export const createCheckoutSchema = z.object({
  planId: z.enum(['pro_monthly', 'pro_yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ======= Pagination =======

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
