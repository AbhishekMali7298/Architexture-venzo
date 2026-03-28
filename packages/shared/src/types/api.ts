import type { TextureConfig, ExportFormat, MapType, ExportStatus } from './config';
import type { PlanId } from './plans';

// ======= Auth =======

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    plan: PlanId;
    createdAt: string;
  };
  sessionToken: string;
}

export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    plan: PlanId;
    avatarUrl: string | null;
  };
}

// ======= Projects =======

export interface CreateProjectRequest {
  name: string;
  config: TextureConfig;
}

export interface CreateProjectResponse {
  id: string;
  name: string;
  currentVersionId: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface ProjectDetailResponse {
  id: string;
  name: string;
  currentVersionId: string;
  config: TextureConfig;
  thumbnailUrl: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDraftRequest {
  config: TextureConfig;
}

export interface CreateVersionRequest {
  config: TextureConfig;
  thumbnail?: string;
}

export interface CreateVersionResponse {
  versionId: string;
  version: number;
  savedAt: string;
}

// ======= Uploads =======

export interface UploadResponse {
  id: string;
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
  thumbnailUrl: string;
  createdAt: string;
}

// ======= Exports =======

export interface CreateExportRequest {
  projectId: string;
  versionId: string;
  maps: MapType[];
  width: number;
  height: number;
  format: ExportFormat;
  bitDepth: 8 | 16;
}

export interface CreateExportResponse {
  id: string;
  status: ExportStatus;
  estimatedSeconds: number;
}

export interface ExportProgressEvent {
  percent: number;
  currentMap: string;
}

export interface ExportCompleteEvent {
  downloadUrl: string;
  expiresAt: string;
}

// ======= Library =======

export interface LibraryMaterial {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  isPro: boolean;
}

export interface LibraryMaterialDetail extends LibraryMaterial {
  sourceImageUrl: string;
  physicalWidthMm: number | null;
  defaultConfig: TextureConfig | null;
}

// ======= Sharing =======

export interface ShareLinkResponse {
  token: string;
  url: string;
  createdAt: string;
}

// ======= Pagination =======

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ======= Billing =======

export interface CheckoutSessionResponse {
  url: string;
}

export interface BillingStatusResponse {
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

// ======= Common =======

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
