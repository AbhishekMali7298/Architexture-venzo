import type { PlanId, PlanFeatures, Plan } from '../types/plans';

/**
 * Plan feature limits — used for both client-side gating UI
 * and server-side enforcement.
 */
export const PLAN_LIMITS: Record<PlanId, PlanFeatures> = {
  free: {
    maxResolution: 1000,
    maxExportsPerHour: 5,
    maxUploads: 0,
    maxVersionsPerProject: 10,
    allowsPbrExport: false,
    allowsHatchExport: false,
    allowsUpload: false,
    allowsMultiMaterial: false,
    allowsCommercialUse: false,
  },
  pro_monthly: {
    maxResolution: 8192,
    maxExportsPerHour: 50,
    maxUploads: 100,
    maxVersionsPerProject: 100,
    allowsPbrExport: true,
    allowsHatchExport: true,
    allowsUpload: true,
    allowsMultiMaterial: true,
    allowsCommercialUse: true,
  },
  pro_yearly: {
    maxResolution: 8192,
    maxExportsPerHour: 50,
    maxUploads: 100,
    maxVersionsPerProject: 100,
    allowsPbrExport: true,
    allowsHatchExport: true,
    allowsUpload: true,
    allowsMultiMaterial: true,
    allowsCommercialUse: true,
  },
};

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    stripePriceId: null,
    features: PLAN_LIMITS.free,
    priceCents: 0,
    interval: null,
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    stripePriceId: null, // Set from env
    features: PLAN_LIMITS.pro_monthly,
    priceCents: 699,
    interval: 'month',
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    stripePriceId: null, // Set from env
    features: PLAN_LIMITS.pro_yearly,
    priceCents: 5990,
    interval: 'year',
  },
];

/**
 * Check if a plan allows a specific feature.
 */
export function canUsePro(planId: PlanId): boolean {
  return planId === 'pro_monthly' || planId === 'pro_yearly';
}

/**
 * Get features for a plan.
 */
export function getPlanFeatures(planId: PlanId): PlanFeatures {
  return PLAN_LIMITS[planId];
}

/**
 * Rate limit constants.
 */
export const RATE_LIMITS = {
  AUTH: { requests: 10, windowMinutes: 15 },
  API: { requests: 100, windowMinutes: 1 },
  UPLOADS: { requests: 20, windowMinutes: 60 },
  EXPORTS_FREE: { requests: 5, windowMinutes: 60 },
  EXPORTS_PRO: { requests: 50, windowMinutes: 60 },
  PUBLIC_LIBRARY: { requests: 60, windowMinutes: 1 },
} as const;

/**
 * Upload constraints.
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'] as const,
  THUMBNAIL_SIZE_PX: 256,
} as const;
