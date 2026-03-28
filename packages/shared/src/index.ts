// Types
export type {
  TextureConfig,
  PatternCategory,
  PatternType,
  PatternConfig,
  MaterialAssetRef,
  MaterialSource,
  SurfaceType,
  EdgeStyle,
  PlacementMode,
  MaterialConfig,
  ImageAdjustments,
  ImageAdjustmentsWithOpacity,
  PlacementRules,
  RuleSequence,
  PBRMapConfig,
  PBRConfig,
  MapType,
  JointsConfig,
  HatchFormat,
  HatchConfig,
  SurfaceProfile,
  SurfaceFinish,
  TilePlacement,
  PatternOutput,
  JointSegment,
  EditorTab,
  EditorSection,
  EditorUIState,
  WorkerMessage,
  WorkerResponse,
  ExportFormat,
  ExportStatus,
} from './types/config';

export type { PatternDefinition } from './constants/patterns';
export type { MaterialDefinition, MaterialCategory } from './constants/materials';

export type {
  PlanId,
  PlanFeatures,
  Plan,
  SubscriptionStatus,
  Subscription,
  UserSession,
} from './types/plans';

export type {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  SessionResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectListItem,
  ProjectDetailResponse,
  SaveDraftRequest,
  CreateVersionRequest,
  CreateVersionResponse,
  UploadResponse,
  CreateExportRequest,
  CreateExportResponse,
  ExportProgressEvent,
  ExportCompleteEvent,
  LibraryMaterial,
  LibraryMaterialDetail,
  ShareLinkResponse,
  PaginatedResponse,
  CheckoutSessionResponse,
  BillingStatusResponse,
  ErrorResponse,
} from './types/api';

// Schemas
export {
  textureConfigSchema,
  patternConfigSchema,
  patternCategorySchema,
  patternTypeSchema,
  materialConfigSchema,
  materialSourceSchema,
  materialAssetRefSchema,
  imageAdjustmentsSchema,
  imageAdjustmentsWithOpacitySchema,
  pbrConfigSchema,
  pbrMapConfigSchema,
  jointsConfigSchema,
  hatchConfigSchema,
  placementRulesSchema,
  ruleSequenceSchema,
} from './schemas/config.schema';

export {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createProjectSchema,
  updateProjectSchema,
  saveDraftSchema,
  createVersionSchema,
  createCropSchema,
  createExportSchema,
  mapTypeSchema,
  libraryQuerySchema,
  createCheckoutSchema,
  paginationSchema,
} from './schemas/api.schema';

// Constants
export {
  PATTERN_CATALOG,
  PATTERN_CATEGORIES,
  getPatternsByCategory,
  getPatternByType,
  getDefaultPatternConfig,
} from './constants/patterns';

export {
  MATERIAL_CATEGORIES,
  MATERIAL_LIBRARY,
  SPECIAL_SOURCES,
  getMaterialCategory,
  getMaterialById,
  getMaterialsByCategory,
} from './constants/materials';

export {
  PLAN_LIMITS,
  PLANS,
  RATE_LIMITS,
  UPLOAD_LIMITS,
  canUsePro,
  getPlanFeatures,
} from './constants/limits';
