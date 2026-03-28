import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  bigserial,
  inet,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';

// ==================== USERS ====================

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    avatarUrl: text('avatar_url'),
    plan: text('plan').notNull().default('free'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_stripe').on(table.stripeCustomerId),
  ],
);

// ==================== SESSIONS ====================

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sessions_user').on(table.userId),
    index('idx_sessions_expires').on(table.expiresAt),
  ],
);

// ==================== PLANS ====================

export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  stripePriceId: text('stripe_price_id'),
  maxResolution: integer('max_resolution').notNull(),
  maxExportsPerHour: integer('max_exports_per_hour').notNull(),
  maxUploads: integer('max_uploads').notNull(),
  maxVersionsPerProject: integer('max_versions_per_project').notNull(),
  allowsPbrExport: boolean('allows_pbr_export').notNull().default(false),
  allowsHatchExport: boolean('allows_hatch_export').notNull().default(false),
  allowsUpload: boolean('allows_upload').notNull().default(false),
  allowsMultiMaterial: boolean('allows_multi_material').notNull().default(false),
  allowsCommercialUse: boolean('allows_commercial_use').notNull().default(false),
  priceCents: integer('price_cents').notNull(),
  interval: text('interval'),
});

// ==================== SUBSCRIPTIONS ====================

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    status: text('status').notNull(),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAt: timestamp('cancel_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_subscriptions_user').on(table.userId),
    index('idx_subscriptions_stripe').on(table.stripeSubscriptionId),
  ],
);

// ==================== PROJECTS ====================

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    currentVersionId: text('current_version_id'),
    draftConfig: jsonb('draft_config'),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_projects_user').on(table.userId),
    index('idx_projects_updated').on(table.updatedAt),
  ],
);

// ==================== PROJECT VERSIONS ====================

export const projectVersions = pgTable(
  'project_versions',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    version: integer('version').notNull(),
    config: jsonb('config').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_versions_project_version').on(table.projectId, table.version),
    index('idx_versions_project').on(table.projectId),
  ],
);

// ==================== UPLOADS ====================

export const uploads = pgTable(
  'uploads',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    widthPx: integer('width_px').notNull(),
    heightPx: integer('height_px').notNull(),
    storageKey: text('storage_key').notNull(),
    thumbnailKey: text('thumbnail_key'),
    sha256Hash: text('sha256_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_uploads_user').on(table.userId),
    index('idx_uploads_hash').on(table.sha256Hash),
  ],
);

// ==================== UPLOAD CROPS ====================

export const uploadCrops = pgTable(
  'upload_crops',
  {
    id: text('id').primaryKey(),
    uploadId: text('upload_id')
      .notNull()
      .references(() => uploads.id),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    storageKey: text('storage_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_crops_upload').on(table.uploadId)],
);

// ==================== EXPORTS ====================

export const exports_ = pgTable(
  'exports',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    versionId: text('version_id')
      .notNull()
      .references(() => projectVersions.id),
    maps: text('maps').array().notNull(),
    widthPx: integer('width_px').notNull(),
    heightPx: integer('height_px').notNull(),
    format: text('format').notNull(),
    bitDepth: integer('bit_depth').notNull().default(8),
    status: text('status').notNull().default('queued'),
    progress: integer('progress').notNull().default(0),
    downloadUrl: text('download_url'),
    downloadExpiresAt: timestamp('download_expires_at', { withTimezone: true }),
    storageKey: text('storage_key'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_exports_user').on(table.userId),
    index('idx_exports_status').on(table.status),
  ],
);

// ==================== SHARE LINKS ====================

export const shareLinks = pgTable(
  'share_links',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    versionId: text('version_id')
      .notNull()
      .references(() => projectVersions.id),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('idx_share_token').on(table.token)],
);

// ==================== PUBLISHED TEXTURES ====================

export const publishedTextures = pgTable(
  'published_textures',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    versionId: text('version_id')
      .notNull()
      .references(() => projectVersions.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    thumbnailUrl: text('thumbnail_url').notNull(),
    previewUrls: jsonb('preview_urls').notNull(),
    config: jsonb('config').notNull(),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_published_slug').on(table.slug),
    index('idx_published_category').on(table.category),
  ],
);

// ==================== LIBRARY ASSETS ====================

export const libraryAssets = pgTable(
  'library_assets',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    manufacturerId: text('manufacturer_id'),
    sourceImageKey: text('source_image_key').notNull(),
    thumbnailKey: text('thumbnail_key').notNull(),
    physicalWidthMm: numeric('physical_width_mm'),
    defaultConfig: jsonb('default_config'),
    isPro: boolean('is_pro').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_library_category').on(table.category, table.sortOrder)],
);

// ==================== COLLECTIONS ====================

export const collections = pgTable('collections', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const collectionItems = pgTable(
  'collection_items',
  {
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.projectId] })],
);

// ==================== AUDIT LOG ====================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    metadata: jsonb('metadata'),
    ipAddress: inet('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_user').on(table.userId),
    index('idx_audit_action').on(table.action),
  ],
);

// ==================== USAGE EVENTS ====================

export const usageEvents = pgTable(
  'usage_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id').notNull(),
    eventType: text('event_type').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_usage_user_type').on(table.userId, table.eventType)],
);
