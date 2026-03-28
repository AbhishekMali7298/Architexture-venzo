// ======= Plan & Subscription Types =======

export type PlanId = 'free' | 'pro_monthly' | 'pro_yearly';

export interface PlanFeatures {
  maxResolution: number;
  maxExportsPerHour: number;
  maxUploads: number;
  maxVersionsPerProject: number;
  allowsPbrExport: boolean;
  allowsHatchExport: boolean;
  allowsUpload: boolean;
  allowsMultiMaterial: boolean;
  allowsCommercialUse: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  stripePriceId: string | null;
  features: PlanFeatures;
  priceCents: number;
  interval: 'month' | 'year' | null;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'paused';

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  avatarUrl: string | null;
}
