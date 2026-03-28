ARCHITEXTURES_REBUILD_BLUEPRINT.md
1. Executive Summary
What Architextures Does
Architextures.org/create is a browser-based procedural texture editor targeting architects, interior designers, 3D artists, and visualization studios. Users select a pattern (brick bond, herringbone, chevron, hexagonal, stack, parquetry, etc.), configure geometric parameters (unit dimensions in mm/inches, rows, columns, angle, stretchers, weaves), assign materials from a library (stone, brick, wood, terrazzo, concrete, metal, tile, fabric, wallpaper, carpet, surfaces, finishes, landscaping, insulation, organic, acoustic) or upload custom images, adjust appearance (brightness, contrast, hue, saturation, tint, tone variation, edges, profiles, finishes, surfaces), configure joints (material, tint, horizontal/vertical sizing, shadow opacity, recess, concave), then export seamless tileable textures with PBR map variants (diffuse, bump, normal, displacement, roughness, metalness) plus CAD hatch patterns (AutoCAD .PAT, Revit model/drafting patterns, DXF, SVG, PNG). The output also includes a 3D preview (sphere) and a scene view. Pro features gate high-resolution downloads, PBR maps, hatch exports, custom uploads, multi-material placement, edge exclusion, and commercial licensing.

Observable System Characteristics
SPA editor with floating control panel, canvas fill background, blue dotted image border
Real-time preview updates on parameter change
Tab-based output views: Texture, Bump, Hatch, Displacement, Normal, Roughness, Metalness, 3D, Scene
Pattern categories: Brick Bond, Paving, Parquetry, Geometric, Organic, Random, Roofing
Material categories: 17 categories plus upload and solid fill
Multi-material support with placement rules (Random, Defined, Manual), frequency control, hit/miss row/column rules
Save/Import/Publish/Share/Download workflow with per-texture share links
Units: mm or inches (with feet input support)
Plugins: Rhino, SketchUp, Revit
Iframe API URL parameters mentioned in user guide (embeddable editor)
Manufacturer partnerships for material sourcing
Pro pricing: €6.99/month (observed from 80.lv article, may have changed)
Core System Design (Inferred)
Canvas 2D rendering on main thread (pattern geometry is simple enough)
Server-side image composition for material sampling and high-res export
MongoDB or PostgreSQL backend (small team, likely simpler stack)
Node.js backend (Ryan Canning is an architect-turned-web-developer, JS/TS likely)
Texture configs stored as JSON documents
Material library is curated + manufacturer-provided images
PBR maps computed algorithmically from geometry + source images
Hatch export is vector math (line segment generation)
Best Modern Rebuild Strategy
Principle	Approach
Preview rendering	WebGL2 fragment shaders in OffscreenCanvas Worker—60fps on parameter drag
Heavy compute	Rust→WASM for seamless tiling, PBR derivation, edge detection
High-res export	Server-side Rust binary in container (4K-8K generation)
Hatch generation	Pure geometry math—output DXF/SVG/PAT from pattern definition
State	Zustand + Immer with undo/redo via patches
Backend	Fastify (Node.js) + PostgreSQL + BullMQ
Storage	Cloudflare R2 (zero egress)
Auth	Lucia v3 or Better Auth (self-hosted, session-based)
Payments	Stripe Checkout + Webhooks
Deploy	Fly.io (app + workers), Cloudflare (CDN + R2)
Biggest Improvement Opportunities Over Target
Preview performance: Move from Canvas 2D main-thread to WebGL2 Worker. Current site visibly redraws on every parameter change with frame drops on complex patterns.
Offline capability: WASM + Service Worker means the editor works without connectivity.
Undo/redo: Current site has no visible undo. We add full command history.
API access: No public API exists. We expose a REST API for programmatic texture generation.
AI generation: Text-to-texture via fine-tuned diffusion models as V2 feature.
Export speed: Client-side WASM export for standard resolutions (≤2K), server only for 4K+.
16-bit PBR: Current site likely exports 8-bit PNGs. We support 16-bit PNG and EXR.
Real-time 3D preview: Current 3D view is static. We add interactive Three.js preview with real-time material application.
2. Product Reverse Engineering
Core User Flows (Detailed)
Flow 1: Create Texture from Scratch
Step	Observed Details	Confidence
Land on /create	Default texture loads (Granite Herringbone). Control panel on left. Canvas fills viewport with blue dotted border showing texture bounds. Background tiles the texture for seamless preview.	Confirmed
Select pattern	Dropdown with categories: Brick Bond, Paving, Parquetry, Geometric, Organic, Random, Roofing. Each has named variants (Running Bond, Stack, Flemish, Herringbone, Chevron, Basketweave, Hexagonal, Ashlar, Crazy Paving, etc.). Parameters: Rows, Columns, Weaves, Angle, Stretchers.	Confirmed
Configure dimensions	Width/Height in mm or inches. Min Width/Min Height constraints. Unit dimensions affect overall texture size (displayed as "1200 x 1200 mm").	Confirmed
Select material	Library browser with 17 categories + search. Solid Fill, Upload (Pro), Uploads history. Each material is a source image.	Confirmed
Adjust material appearance	Upload width, Width, Height, Min Width, Min Height. Light Intensity. Surface (None, Vermiculated, Rough, Grooved, Voids) with Scale. Adjustments (Brightness, Contrast, Hue, Saturation, Invert). Tint color picker. Edges (style dropdown + perimeter scale + profile width). Profile and Finish selectors. Tone variation slider. Randomise fill angle toggle.	Confirmed
Multi-material (Pro)	"Add Another Material" button. Placement: Random, Defined, Manual. Frequency slider. Rules with Hit/Miss per row/column with shift.	Confirmed
Configure joints	Joint material (Solid Fill, Architecture, Landscaping categories). Tint color. Horizontal/Vertical dimensions. Shadow opacity. Recess joints toggle. Concave joints toggle.	Confirmed
Switch output tab	Tabs: Texture, Bump (Pro), Hatch (Pro), Displacement, Normal, Roughness, Metalness, 3D, Scene	Confirmed
Configure PBR	Per-map settings: Geometry toggle, Edge depth, Source image (None, Grayscale, Find edges), Brightness/Contrast/Opacity/Invert per map. Roughness has Base roughness. Metalness has Base metalness. Bump/Normal shared settings.	Confirmed
Download	Format options: Texture (JPG), AutoCAD Hatch (Pro, .PAT), Revit Model Pattern (Pro), Revit Drafting Pattern (Pro), DXF hatch (Pro), SVG hatch (Pro), PNG hatch (Pro), Displacement (Pro), Bump (Pro), Normal (Pro), Metalness (Pro), Roughness (Pro). Resolution: px width x px height. License: Personal/educational (free), Commercial (Pro).	Confirmed
Save	Save as new texture, Update existing texture. Publish as new/update. Default settings save. Share link generation.	Confirmed
Flow 2: Edit Existing Library Texture
Step	Observed	Confidence
Browse library on homepage	Category filters, Maker filters. Click "Edit" on any texture.	Confirmed
Opens /create/{id}	Editor loads with pre-configured parameters for that texture. URL includes texture ID.	Confirmed
Modify and re-download	Same flow as create. "As new texture" or "Update existing texture" options.	Confirmed
Flow 3: Upload Custom Material (Pro)
Step	Observed	Confidence
Click Upload in material menu	File browser opens. Single file at a time.	Confirmed
Crop selection	"Select areas" to click-drag crop regions from source image. "Reset areas" and "Delete selected" controls.	Confirmed
Set upload width	Physical dimension mapping (mm) for accurate real-world scaling	Confirmed
Use in pattern	Uploaded image fills each tile unit. Seamlessness comes from pattern, not image.	Confirmed
Flow 4: Hatch Export
Step	Observed	Confidence
Switch to Hatch tab	Shows vector hatch preview. Format selector: AutoCAD hatch, Revit model/drafting pattern, DXF, SVG, PNG.	Confirmed
Configure hatch	Express joints toggle. Depth slider. Overlay options. Show Pattern Hatch toggle.	Confirmed
Download	Generates .PAT, .DXF, .SVG, or .PNG based on selection	Confirmed
Client-Side vs Server-Side (Detailed Assessment)
Component	Location	Evidence	Confidence
Pattern geometry computation	Client	Instant response to row/column changes, no network requests	High
Material image compositing	Client + Server	Preview is client-side canvas; high-res likely server	High
PBR map preview	Client	Tab switching shows PBR preview without network delay	High
PBR map export	Server	Download delay, export-resolution specific	High
Hatch vector generation	Client	Hatch preview is instant; .PAT/.DXF export may be client-side	Medium
Material library images	Server	Images loaded from server URLs	High
Upload processing	Server	File upload requires server storage	High
Save/load config	Server	Requires login, persisted across sessions	High
3D preview	Client	WebGL/Three.js sphere rendering visible	High
Likely Technical Weaknesses
Main-thread rendering: Canvas draw calls on main thread cause jank during complex pattern updates
No undo/redo: No evidence of undo functionality in any documentation
Single-threaded PBR: Switching between PBR tabs on complex textures shows delay
No offline mode: All material images fetched from server
Limited resolution: Free tier caps at 1000px; even pro likely has practical ceiling
No batch export: One texture at a time
No version history: Save overwrites or creates new; no apparent version timeline
No real-time collab: Single-user editing
Hatch export limitations: PAT format is inherently limited; no modern vector format optimization
3. Core Product Model
Complete Entity Model
typescript
Run Code

Copy code
// ======= Core Value Objects =======

interface TextureConfig {
  version: 1;                    // schema version for migration
  seed: number;                  // deterministic randomization
  units: 'mm' | 'inches';
  
  pattern: {
    type: string;                // 'running_bond' | 'stack_bond' | 'herringbone' | 'chevron' | 'basketweave' | 'hexagonal' | 'ashlar' | 'crazy_paving' | ...
    category: string;            // 'brick_bond' | 'paving' | 'parquetry' | 'geometric' | 'organic' | 'random' | 'roofing'
    rows: number;                // 1-100
    columns: number;             // 1-100
    angle: number;               // degrees, 0-360
    stretchers: number;          // pattern-specific
    weaves: number;              // pattern-specific
  };
  
  materials: MaterialConfig[];   // at least one; multi-material is Pro
  
  joints: {
    materialSource: MaterialSource;
    tint: string | null;         // hex
    horizontalSize: number;      // mm
    verticalSize: number;        // mm
    linkedDimensions: boolean;   // lock H/V to same value
    shadowOpacity: number;       // 0-1
    recess: boolean;
    concave: boolean;
    adjustments: ImageAdjustments;
  };
  
  output: {
    widthPx: number;
    heightPx: number;
  };
}

interface MaterialConfig {
  id: string;                     // unique within config
  source: MaterialSource;
  uploadWidth: number | null;     // mm, for uploaded images
  width: number;                  // mm, tile unit width
  height: number;                 // mm, tile unit height
  minWidth: number;               // mm
  minHeight: number;              // mm
  
  appearance: {
    lightIntensity: number;       // 0-100
    surface: 'none' | 'vermiculated' | 'rough' | 'grooved' | 'voids';
    surfaceScale: number;         // 0-100
  };
  
  adjustments: ImageAdjustments;
  tint: string | null;            // hex
  
  edges: {
    style: string;                // 'none' | 'fine' | 'handmade' | 'rough' | 'uneven'
    perimeterScale: number;       // 0-100
    profileWidth: number;         // 0-100
    excludeSides: number[];       // [1,2,3,4,5,6]
  };
  
  profile: string | null;         // surface profile ID
  finish: string | null;          // surface finish ID
  toneVariation: number;          // 0-100
  randomiseFillAngle: boolean;
  
  // Multi-material placement
  placement: {
    mode: 'random' | 'defined' | 'manual';
    frequency: number;            // 0-100, percentage
    rules: PlacementRules | null;
  };
  
  // PBR overrides per material
  pbr: PBRConfig;
}

type MaterialSource =
  | { type: 'library'; assetId: string }
  | { type: 'upload'; uploadId: string }
  | { type: 'solid'; color: string }

interface ImageAdjustments {
  brightness: number;             // -100 to 100
  contrast: number;               // -100 to 100
  hue: number;                    // -180 to 180
  saturation: number;             // -100 to 100
  invertColors: boolean;
}

interface PlacementRules {
  rows: RuleSequence[];
  columns: RuleSequence[];
}

interface RuleSequence {
  pattern: ('hit' | 'miss')[];    // repeating sequence
  shift: number;                  // offset
}

interface PBRConfig {
  bump: PBRMapConfig;
  specular: PBRMapConfig;       // observed on live site
  normal: PBRMapConfig;
  displacement: PBRMapConfig;
  roughness: PBRMapConfig & { baseRoughness: number };
  metalness: PBRMapConfig & { baseMetalness: number };
}

interface PBRMapConfig {
  geometry: boolean;              // include geometry contribution
  edgeDepth: number;              // 0-100
  imageSource: 'none' | 'grayscale' | 'find_edges';
  adjustments: ImageAdjustments & { opacity: number };
}

// ======= Surface Definitions =======

interface SurfaceProfile {
  id: string;
  name: string;
  repetitions: number;
  gradient: {
    start: string;                // hex
    end: string;                  // hex
    size: number;
    angle: number;
    mode: 'linear' | 'radial';
  };
  targetMap: 'texture' | 'bump' | 'displacement' | 'bump_normal' | 'roughness' | 'metalness';
}

interface SurfaceFinish {
  id: string;
  name: string;
  scale: number;
  textureUrl: string;             // pre-built finish texture
}


Entity Relationships
ruby

Copy code
User ──1:N── Project
User ──1:N── Upload
User ──1:1── Subscription
Subscription ──N:1── Plan
Project ──1:N── ProjectVersion
ProjectVersion ──1:1── TextureConfig (JSONB)
ProjectVersion ──N:1── Upload (via config.materials[].source.uploadId)
Project ──1:N── Export
Project ──0:1── PublishedTexture
PublishedTexture ──1:1── ShareLink
User ──1:N── Collection
Collection ──N:N── Project (via collection_items)
LibraryAsset ──N:1── Manufacturer
LibraryAsset ──1:1── TextureConfig (default config)

Immutability Rules
Entity	Mutability	Rationale
TextureConfig	Immutable per version	Reproducibility; undo history
ProjectVersion	Immutable (append-only)	Audit trail
Project metadata	Mutable (name, thumbnail)	User convenience
Upload original file	Immutable	Content-addressed storage
Upload crops	Immutable (derived)	Re-derivable
Export artifacts	Immutable	Generated output
Published snapshot	Immutable once published	Share link stability
Undo/Redo Design
typescript
Run Code

Copy code
// Using Immer produceWithPatches
import { produceWithPatches, enablePatches, Patch, applyPatches } from 'immer';
enablePatches();

interface UndoState {
  past: { patches: Patch[]; inversePatches: Patch[] }[];
  future: { patches: Patch[]; inversePatches: Patch[] }[];
  maxDepth: 50;
}

// On every config change:
function updateConfig(recipe: (draft: TextureConfig) => void) {
  const [nextConfig, patches, inversePatches] = produceWithPatches(config, recipe);
  undoState.past.push({ patches, inversePatches });
  undoState.future = []; // clear redo on new change
  if (undoState.past.length > undoState.maxDepth) undoState.past.shift();
  setConfig(nextConfig);
}

// Undo:
function undo() {
  const entry = undoState.past.pop();
  if (!entry) return;
  const prev = applyPatches(config, entry.inversePatches);
  undoState.future.push(entry);
  setConfig(prev);
}

// Redo:
function redo() {
  const entry = undoState.future.pop();
  if (!entry) return;
  const next = applyPatches(config, entry.patches);
  undoState.past.push(entry);
  setConfig(next);
}


Autosave Design
bash

Copy code
User edits config
  → Zustand subscriber fires
  → Debounce 3000ms (reset on each edit)
  → If projectId exists AND isDirty:
      PATCH /api/v1/projects/{id}/draft
      Body: { config: TextureConfig }
      Server upserts single draft row (not versioned)
  → On explicit "Save" click:
      POST /api/v1/projects/{id}/versions
      Server creates new ProjectVersion
      Client receives versionId, marks isDirty=false

4. Recommended Tech Stack
Frontend
Layer	Choice	Why	Rejected Alternative	Why Rejected
Framework	Next.js 15 (App Router)	SSR for marketing/SEO, CSR for editor, massive ecosystem, Codex-friendly	SvelteKit	Smaller ecosystem, fewer AI training examples
Language	TypeScript 5.5 (strict: true, exactOptionalPropertyTypes: true)	Shared types frontend↔backend	—	—
UI components	shadcn/ui (Radix + Tailwind)	Copy-paste components, full control, accessible	Headless UI, Ant Design	shadcn has best DX for custom design systems
Styling	Tailwind CSS v4	Utility-first, design tokens, no CSS-in-JS runtime	CSS Modules	Tailwind is faster to iterate
Editor state	Zustand 5 + Immer	Lightweight, supports middleware, patches for undo	Redux Toolkit	Overkill for single-store editor state
Server state	TanStack Query v5	Caching, background refresh, optimistic updates, devtools	SWR	TanStack has better mutation handling
Canvas rendering	WebGL2 via custom GLSL shaders + OffscreenCanvas	GPU-accelerated 2D texture composition at 60fps	Canvas 2D API	Canvas 2D is CPU-bound, no shader compositing
3D preview	Three.js (r170+)	Industry standard, PBR material preview on geometry	Babylon.js	Three.js is lighter for simple material preview
Compute kernel	Rust → wasm32-wasi via wasm-pack	5-20x over JS for pixel operations, seamless tiling, PBR derivation	AssemblyScript	Rust has better tooling and performance
Worker architecture	Dedicated Worker (render) + OffscreenCanvas	Non-blocking UI thread	SharedWorker	Dedicated Worker is simpler, sufficient
Form controls	Custom slider/input components wrapping Radix primitives	Texture editors need precision controls (drag, scroll, direct input)	react-hook-form	Forms are too simple here; we need direct state binding
Backend
Layer	Choice	Why	Rejected	Why Rejected
API server	Fastify 5 (Node.js 22)	Fast, TypeScript, schema validation, plugin system	Express	2x slower, less structured
Validation	Zod 3	Shared with frontend, TypeScript inference, composable	Typebox	Zod has better ecosystem
ORM	Drizzle ORM	SQL-first, type-safe, fast, good migration tooling	Prisma	Prisma is slower at runtime and heavier
Database	PostgreSQL 16 (Neon serverless or Fly Postgres)	JSONB for configs, ACID, mature, excellent indexing	MongoDB	Relational data (users, subs, exports) needs ACID
Cache	Upstash Redis (serverless)	Sessions, rate limiting, queue backend, key-value cache	Dragonfly	Upstash has better serverless DX
Job queue	BullMQ 5	Redis-backed, retries, priorities, progress tracking, cron	pg-boss	BullMQ has richer feature set
Export worker	Rust binary (texgen-cli) in Docker	Native speed for 4K/8K pixel ops, memory efficient	Node + Sharp	Sharp is C++ bindings but still slower; Rust gives 3-5x improvement for large images
Hatch generator	TypeScript module (shared client/server)	Vector math is simple enough; share code with client preview	—	—
Infrastructure
Layer	Choice	Why
App hosting	Fly.io	Multi-region, Machines API for worker scaling, Postgres hosting, good pricing
Object storage	Cloudflare R2	S3-compatible, zero egress fees, global
CDN	Cloudflare	Integrated with R2, edge caching, WAF
DNS	Cloudflare	Integrated
Container registry	GitHub Container Registry (ghcr.io)	Free for public/org, integrated with Actions
CI/CD	GitHub Actions	Standard, Codex-compatible
Monitoring (errors)	Sentry	Best error tracking, source maps, performance
Monitoring (metrics)	Grafana Cloud (free tier)	Prometheus-compatible, dashboards
Analytics	PostHog	Product analytics, feature flags, session replay
Auth	Better Auth	Self-hosted, session-based, PostgreSQL adapter, no vendor lock (Lucia v3 deprecated)
Payments	Stripe (Checkout + Customer Portal + Webhooks)	Industry standard
Email (transactional)	Resend	Simple API, good deliverability
Feature flags	PostHog (included)	Unified with analytics
5. System Architecture
Architecture Diagram
bash

Copy code
                           ┌──────────────────────────────┐
                           │       CLOUDFLARE EDGE         │
                           │  ┌────────┐ ┌──────────────┐ │
                           │  │  CDN   │ │   R2 Storage  │ │
                           │  │(cached │ │ /materials/   │ │
                           │  │ static)│ │ /uploads/     │ │
                           │  │        │ │ /exports/     │ │
                           │  │        │ │ /thumbnails/  │ │
                           │  └───┬────┘ └──────┬───────┘ │
                           └──────┼─────────────┼─────────┘
                                  │             │
                    ┌─────────────▼─────────────▼──────────────┐
                    │            FLY.IO CLUSTER                 │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │       Next.js App (2 machines)       │  │
                    │  │  • SSR: /, /pricing, /gallery,       │  │
                    │  │    /texture/[slug]                    │  │
                    │  │  • CSR: /create, /dashboard           │  │
                    │  │  • Serves static + WASM bundles       │  │
                    │  └──────────────┬──────────────────────┘  │
                    │                 │ internal                 │
                    │  ┌──────────────▼──────────────────────┐  │
                    │  │    Fastify API (2 machines)          │  │
                    │  │  • /api/v1/projects/*                │  │
                    │  │  • /api/v1/uploads/*                 │  │
                    │  │  • /api/v1/exports/*                 │  │
                    │  │  • /api/v1/auth/*                    │  │
                    │  │  • /api/v1/billing/webhook           │  │
                    │  │  • /api/v1/library/*                 │  │
                    │  └────────┬──────────┬────────────────┘  │
                    │           │          │                    │
                    │  ┌────────▼────┐ ┌───▼──────────────┐    │
                    │  │ Upstash     │ │ Fly Postgres     │    │
                    │  │ Redis       │ │ (primary +       │    │
                    │  │ • Sessions  │ │  read replica)   │    │
                    │  │ • BullMQ    │ │                  │    │
                    │  │ • Rate lim  │ │                  │    │
                    │  │ • Cache     │ │                  │    │
                    │  └─────────────┘ └──────────────────┘    │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │  Export Workers (Fly Machines, 0-N)  │  │
                    │  │  • Rust binary: texgen-cli           │  │
                    │  │  • Picks jobs from BullMQ            │  │
                    │  │  • Reads config + material assets    │  │
                    │  │  • Generates high-res maps           │  │
                    │  │  • Uploads results to R2             │  │
                    │  │  • Scale to 0 when idle              │  │
                    │  └─────────────────────────────────────┘  │
                    └───────────────────────────────────────────┘

Request Flow: Preview Render (Client-Only, No Network)
markdown

Copy code
1. User drags "Rows" slider from 6 to 8
2. Zustand store: updateConfig(d => { d.pattern.rows = 8 })
3. Immer produces patches → pushed to undo stack
4. isDirty = true
5. Zustand render subscriber fires (16ms debounce via requestAnimationFrame)
6. Post message to Render Worker:
   { type: 'render', config: TextureConfig, width: 1024, height: 1024, mapType: 'diffuse' }
7. Worker:
   a. Calls WASM: computePatternGeometry(config.pattern) → TileGrid
   b. For each tile in grid:
      - Determine material (single or multi-material placement)
      - Sample material source image (pre-loaded ImageBitmap in worker)
      - Apply adjustments (brightness, contrast, hue, saturation, tint)
      - Apply tone variation (seeded random per tile)
      - Apply edge style (darken perimeter pixels)
      - Apply surface profile/finish overlay
      - Write pixels to output buffer
   c. Fill joint regions with joint material + tint + shadow
   d. Apply recess/concave joint depth as shadow
   e. Transfer output ImageBitmap to main thread
8. Main thread: drawImage on visible <canvas>
9. Background tiling: CSS background-image with data URL or second canvas
10. Total budget: <32ms for 1024x1024 preview

Request Flow: Export (Server-Side)
yaml

Copy code
1. User clicks Download → selects: Texture + Normal + Roughness, 4096x4096, PNG
2. Client: POST /api/v1/exports
   {
     projectId: "proj_01J...",
     versionId: "ver_01J...",
     maps: ["diffuse", "normal", "roughness"],
     width: 4096,
     height: 4096,
     format: "png",
     bitDepth: 16
   }
3. API server:
   a. Verify auth + check plan allows 4096px + PBR maps
   b. Load project version config from DB
   c. Insert export row: { id: "exp_01J...", status: "queued", ... }
   d. Enqueue BullMQ job: { exportId, config, outputSpec, uploadAssetUrls: [...] }
   e. Return 202: { exportId: "exp_01J...", status: "queued" }
4. Client: opens SSE connection GET /api/v1/exports/exp_01J.../stream
5. Worker Machine picks up job:
   a. Download material source images from R2 (cached locally)
   b. Execute: texgen-cli render \
        --config config.json \
        --output /tmp/exp_01J.../ \
        --maps diffuse,normal,roughness \
        --width 4096 --height 4096 \
        --format png --bit-depth 16
   c. texgen-cli process:
      i.   Parse config, initialize PRNG from seed
      ii.  Compute tile geometry
      iii. For each map type, render full resolution
      iv.  Write PNG files to /tmp/
   d. Package: zip -j /tmp/exp_01J.../export.zip /tmp/exp_01J.../*.png
   e. Upload export.zip to R2: /exports/exp_01J.../export.zip
   f. Generate signed URL (1 hour expiry)
   g. Update DB: export.status = 'complete', export.downloadUrl = signedUrl
   h. Publish SSE event: { status: 'complete', downloadUrl: '...' }
6. Client receives SSE, shows Download button
7. User clicks → browser downloads ZIP from signed R2 URL

Request Flow: Hatch Export (Client-Side Possible)
sql

Copy code
1. User switches to Hatch tab, selects AutoCAD format
2. Client computes hatch geometry from pattern config:
   a. For each tile boundary → generate line segments
   b. Apply joint lines
   c. Convert to AutoCAD PAT format (angle, origin, delta, dash pattern per line family)
3. Client generates .PAT file content as string
4. Client triggers download via Blob + URL.createObjectURL
5. No server round-trip needed for basic hatch formats
6. For high-complexity hatches (Revit patterns), server may be needed

6. Frontend Blueprint
App Shell
php
Run Code

Copy code
<html>
  <body>
    <RootLayout>                    // Next.js App Router layout
      <AuthProvider>                // Session context
        <QueryClientProvider>       // TanStack Query
          <PostHogProvider>         // Analytics
            {children}
          </PostHogProvider>
        </QueryClientProvider>
      </AuthProvider>
    </RootLayout>
  </body>
</html>


Route Structure
bash

Copy code
app/
├── (marketing)/
│   ├── page.tsx                    → / (landing, SSR)
│   ├── pricing/page.tsx            → /pricing (SSR)
│   ├── gallery/page.tsx            → /gallery (SSR, paginated)
│   ├── texture/[slug]/page.tsx     → /texture/:slug (SSR, OG tags)
│   └── layout.tsx                  → marketing layout (nav + footer)
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── layout.tsx
├── (app)/
│   ├── create/page.tsx             → /create (CSR, dynamic import)
│   ├── create/[projectId]/page.tsx → /create/:id (CSR)
│   ├── dashboard/page.tsx          → /dashboard
│   ├── dashboard/exports/page.tsx
│   ├── dashboard/collections/page.tsx
│   ├── account/page.tsx
│   ├── account/billing/page.tsx
│   ├── account/uploads/page.tsx
│   └── layout.tsx                  → app layout (sidebar nav)
└── api/                            → API proxy (or direct Fastify)

Editor State Boundaries
typescript
Run Code

Copy code
EditorStore (Zustand)
├── config: TextureConfig           ← Source of truth for rendering
├── ui: {                           ← Not persisted
│   activeTab: 'texture' | 'bump' | 'hatch' | 'displacement' | 'normal' | 'roughness' | 'metalness' | '3d' | 'scene'
│   activeMaterialIndex: number
│   zoom: number
│   pan: { x: number, y: number }
│   leftPanelOpen: boolean
│   rightPanelOpen: boolean
│   activeSection: 'pattern' | 'material' | 'joints'
│   colorPickerOpen: string | null
│   showBorder: boolean
│   tileBackground: boolean
│ }
├── project: {                      ← Server-synced
│   id: string | null
│   name: string
│   isDirty: boolean
│   lastSavedAt: Date | null
│   currentVersionId: string | null
│ }
├── undo: UndoState
├── rendering: {                    ← Worker communication
│   isRendering: boolean
│   lastRenderTime: number
│   previewBitmap: ImageBitmap | null
│   activeMapBitmap: ImageBitmap | null
│ }
└── materialAssets: Map<string, ImageBitmap>   ← Loaded material images


Data Fetching Strategy
Data	Method	Cache
Material library (categories, thumbnails)	TanStack Query, staleTime: 24h	Aggressive cache
Material source images	Fetch as ImageBitmap in Worker, LRU cache (50 items)	In-memory
Project list (dashboard)	TanStack Query, staleTime: 30s	Background refresh
Project config (on load)	TanStack Query, one-shot	Cache until mutation
Export status	SSE stream	Real-time
User session	TanStack Query + cookie	staleTime: 5min
Autosave Strategy
typescript
Run Code

Copy code
// In Zustand subscribe middleware
const AUTOSAVE_DEBOUNCE = 3000; // ms
let autosaveTimer: ReturnType<typeof setTimeout>;

editorStore.subscribe(
  (state) => state.config,
  (config) => {
    editorStore.setState({ project: { ...project, isDirty: true } });
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
      const { project } = editorStore.getState();
      if (!project.id) return; // unsaved project, skip
      await api.patch(`/projects/${project.id}/draft`, { config });
      // Do NOT create version; just persist draft
    }, AUTOSAVE_DEBOUNCE);
  }
);


Keyboard Shortcuts
Key	Action
Ctrl+Z	Undo
Ctrl+Shift+Z / Ctrl+Y	Redo
Ctrl+S	Save (create version)
Ctrl+E	Export dialog
Ctrl+0	Reset zoom
Ctrl++ / Ctrl+-	Zoom in/out
Space+drag	Pan canvas
[ / ]	Decrease/increase active slider value
Tab	Cycle active panel section
Escape	Close modal/color picker
Responsive Behavior
Breakpoint	Layout
≥1280px	Full editor: left panel + canvas + optional right panel
1024-1279px	Left panel overlay (collapsible), full canvas
768-1023px	Bottom sheet panel, canvas above
<768px	Full-screen panel or canvas (toggle), simplified controls
Folder Structure (Frontend)
python
Run Code

Copy code
packages/web/
├── app/                            # Next.js App Router
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (app)/
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── ui/                         # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── slider.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── popover.tsx
│   │   ├── color-picker.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   ├── editor/                     # Editor-specific components
│   │   ├── EditorShell.tsx
│   │   ├── EditorCanvas.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── PatternPanel.tsx
│   │   ├── MaterialPanel.tsx
│   │   ├── MaterialBrowser.tsx
│   │   ├── JointsPanel.tsx
│   │   ├── PBRPanel.tsx
│   │   ├── HatchPanel.tsx
│   │   ├── OutputTabs.tsx
│   │   ├── AdjustmentsControl.tsx
│   │   ├── EdgeSettings.tsx
│   │   ├── PlacementRules.tsx
│   │   ├── ExportDialog.tsx
│   │   ├── SaveDialog.tsx
│   │   ├── ShareDialog.tsx
│   │   ├── ThreeDPreview.tsx
│   │   └── DimensionInput.tsx
│   ├── dashboard/
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ExportHistory.tsx
│   │   └── CollectionList.tsx
│   └── marketing/
│       ├── Hero.tsx
│       ├── FeatureGrid.tsx
│       └── PricingTable.tsx
├── features/
│   ├── auth/
│   │   ├── useSession.ts
│   │   └── AuthGuard.tsx
│   ├── editor/
│   │   ├── useEditorStore.ts       # Zustand store
│   │   ├── useRenderWorker.ts      # Worker communication hook
│   │   ├── useAutosave.ts
│   │   ├── useUndoRedo.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useCanvasInteraction.ts # Pan/zoom
│   │   └── useMaterialLoader.ts    # Async material image loading
│   ├── export/
│   │   ├── useExport.ts
│   │   └── useExportStream.ts      # SSE hook
│   └── billing/
│       ├── usePlan.ts
│       └── PlanGate.tsx
├── lib/
│   ├── api.ts                      # Fetch wrapper with auth
│   ├── constants.ts
│   ├── patterns.ts                 # Pattern catalog definitions
│   ├── materials.ts                # Material category definitions
│   └── formatters.ts               # Dimension formatting (mm, inches, feet)
├── workers/
│   ├── render.worker.ts            # Dedicated render worker
│   ├── wasm-loader.ts              # WASM initialization
│   └── render-protocol.ts          # Message types
├── types/
│   ├── config.ts                   # TextureConfig types (shared)
│   ├── api.ts                      # API request/response types
│   └── editor.ts                   # UI state types
├── public/
│   ├── wasm/
│   │   └── texgen_bg.wasm
│   └── patterns/                   # Pattern thumbnail images
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json


7. Rendering & Texture Engine Design
Pattern Geometry System
Pattern Definition
Each pattern is defined as a tile placement function that takes grid parameters and returns an array of TilePlacement objects.

typescript
Run Code

Copy code
interface TilePlacement {
  id: number;                    // unique tile index (for deterministic seeding)
  x: number;                     // top-left x in output space (mm)
  y: number;                     // top-left y in output space (mm)
  width: number;                 // tile width (mm)
  height: number;                // tile height (mm)
  rotation: number;              // degrees
  materialIndex: number;         // which material to use (multi-material)
  clipPath: Float32Array | null; // for non-rectangular tiles (hex, crazy paving)
  flipX: boolean;
  flipY: boolean;
}

interface PatternOutput {
  tiles: TilePlacement[];
  totalWidth: number;            // mm
  totalHeight: number;           // mm
  seamlessPeriodX: number;       // mm, for seamless tiling
  seamlessPeriodY: number;       // mm
  jointSegments: JointSegment[]; // for explicit joint rendering
}

interface JointSegment {
  x1: number; y1: number;
  x2: number; y2: number;
  width: number;                 // joint width in mm
  isHorizontal: boolean;
}


Pattern Implementations (Pseudocode)
php
Run Code

Copy code
function runningBond(config):
  tiles = []
  for row in 0..config.rows:
    offset = (row % 2 == 1) ? config.unitWidth * config.offsetFraction : 0
    for col in 0..config.columns:
      x = col * (config.unitWidth + config.jointH) + offset
      y = row * (config.unitHeight + config.jointV)
      // Wrap tiles that overflow for seamlessness
      if x + config.unitWidth > totalWidth:
        // Split tile: render partial on right, partial on left
        tiles.push(makeTile(x, y, totalWidth - x, config.unitHeight, ...))
        tiles.push(makeTile(0, y, config.unitWidth - (totalWidth - x), config.unitHeight, ...))
      else:
        tiles.push(makeTile(x, y, config.unitWidth, config.unitHeight, ...))
  return { tiles, totalWidth, totalHeight, ... }

function herringbone(config):
  // 45° or custom angle zigzag pattern
  tiles = []
  angle = config.angle  // typically 45
  for row in 0..config.rows:
    for col in 0..config.columns:
      // Alternating horizontal and vertical placement
      isVertical = (row + col) % 2 == 0
      x = col * config.unitHeight * cos(angle)
      y = row * config.unitWidth * sin(angle)
      rotation = isVertical ? 90 : 0
      tiles.push(makeTile(x, y, config.unitWidth, config.unitHeight, rotation))
  return { tiles, ... }

function hexagonal(config):
  // Hex grid with pointy-top or flat-top orientation
  tiles = []
  hexWidth = config.unitWidth
  hexHeight = config.unitWidth * sqrt(3) / 2
  for row in 0..config.rows:
    offset = (row % 2 == 1) ? hexWidth * 0.75 : 0
    for col in 0..config.columns:
      cx = col * hexWidth * 1.5 + offset
      cy = row * hexHeight
      clipPath = computeHexClipPath(cx, cy, hexWidth / 2)
      tiles.push({ x: cx, y: cy, clipPath, ... })
  return { tiles, ... }


Multi-Material Placement
typescript
Run Code

Copy code
function assignMaterials(
  tiles: TilePlacement[],
  materials: MaterialConfig[],
  seed: number
): void {
  const rng = createPRNG(seed);  // seedrandom or similar
  
  for (const tile of tiles) {
    if (materials.length === 1) {
      tile.materialIndex = 0;
      continue;
    }
    
    const secondary = materials[1]; // simplification; extend for N materials
    
    switch (secondary.placement.mode) {
      case 'random':
        tile.materialIndex = rng() < (secondary.placement.frequency / 100) ? 1 : 0;
        break;
        
      case 'defined':
        const rules = secondary.placement.rules!;
        const rowHit = evaluateRule(rules.rows, tile.row);
        const colHit = evaluateRule(rules.columns, tile.col);
        tile.materialIndex = (rowHit && colHit) ? 1 : 0;
        break;
        
      case 'manual':
        // User has clicked specific tiles; stored in config as manualPlacements
        tile.materialIndex = isManuallySelected(tile.row, tile.col) ? 1 : 0;
        break;
    }
  }
}

function evaluateRule(sequences: RuleSequence[], index: number): boolean {
  // Evaluate hit/miss pattern with shift
  for (const seq of sequences) {
    const shifted = (index + seq.shift) % seq.pattern.length;
    if (seq.pattern[shifted] === 'miss') return false;
  }
  return true;
}


Material Sampling
less

Copy code
function sampleMaterial(
  material: MaterialConfig,
  tile: TilePlacement,
  sourceImage: ImageData,
  rng: PRNG,
  outputBuffer: Uint8ClampedArray,
  outputStride: number,
  outputX: number,
  outputY: number,
  tileWidthPx: number,
  tileHeightPx: number
):
  // 1. Determine source region
  if material.source.type == 'solid':
    fillSolid(outputBuffer, material.tint, outputX, outputY, tileWidthPx, tileHeightPx)
    return
  
  // 2. Compute source UV mapping
  //    sourceImage might be larger than one tile; sample a region
  //    Use tile.id as seed for which region to sample (tone variation)
  tileRng = createPRNG(rng.seed + tile.id)
  
  if material.randomiseFillAngle:
    sampleRotation = tileRng() * 360
  else:
    sampleRotation = 0
  
  // 3. Compute source crop based on tile dimensions vs source dimensions
  srcScaleX = material.width / sourceImage.physicalWidthMm
  srcScaleY = material.height / sourceImage.physicalHeightMm
  
  // Random offset within source for variation
  srcOffsetX = floor(tileRng() * (sourceImage.width - tileWidthPx * srcScaleX))
  srcOffsetY = floor(tileRng() * (sourceImage.height - tileHeightPx * srcScaleY))
  
  // 4. Bilinear sample from source into output
  for py in 0..tileHeightPx:
    for px in 0..tileWidthPx:
      srcX = srcOffsetX + px * srcScaleX
      srcY = srcOffsetY + py * srcScaleY
      [r, g, b, a] = bilinearSample(sourceImage, srcX, srcY, sampleRotation)
      
      // 5. Apply tone variation
      toneFactor = 1.0 + (tileRng() - 0.5) * 2 * (material.toneVariation / 100)
      r *= toneFactor; g *= toneFactor; b *= toneFactor
      
      // 6. Apply adjustments (brightness, contrast, hue, saturation, tint)
      [r, g, b] = applyAdjustments(r, g, b, material.adjustments, material.tint)
      
      // 7. Apply edge darkening
      [r, g, b] = applyEdgeStyle(r, g, b, px, py, tileWidthPx, tileHeightPx, material.edges)
      
      // 8. Write to output
      idx = ((outputY + py) * outputStride + (outputX + px)) * 4
      outputBuffer[idx] = clamp(r, 0, 255)
      outputBuffer[idx+1] = clamp(g, 0, 255)
      outputBuffer[idx+2] = clamp(b, 0, 255)
      outputBuffer[idx+3] = 255

Seamless Tiling Strategy
The pattern geometry itself ensures seamlessness. Key principle: the tile grid wraps at the texture boundary.

sql

Copy code
1. totalWidth = columns * (unitWidth + jointH)
2. totalHeight = rows * (unitHeight + jointV)
3. Tiles that extend past totalWidth are SPLIT:
   - Portion that fits → rendered at right edge
   - Overflow → rendered at left edge (x=0)
4. Same for vertical overflow
5. This ensures that when the texture tiles left-right and top-bottom,
   the split tiles reconstruct seamlessly.
6. For patterns with row offsets (running bond), the offset pattern must
   have a period that divides evenly into the total width.
   If not, snap columns to nearest valid count.
7. Joints at boundaries must match: left edge joint = right edge joint continuation.

For material sampling seamlessness (within each tile):

vbnet

Copy code
- Each tile samples from a potentially non-seamless source image
- Since tiles have joints between them, the source image does NOT need to be seamless
- The pattern structure (joints) hides the seams
- This is a key insight from Architextures' approach: seamlessness comes from the pattern, not the source

PBR Map Generation Pipeline
Normal Map (from geometry + source image)
less

Copy code
function generateNormalMap(
  config: TextureConfig,
  tiles: TilePlacement[],
  diffuseMap: ImageData,
  outputWidth: number,
  outputHeight: number
): ImageData
  // Step 1: Generate height map
  heightMap = new Float32Array(outputWidth * outputHeight)
  
  // Base height: tiles = 1.0, joints = 0.0
  for each pixel (x, y):
    if isJointPixel(x, y, tiles, config.joints):
      baseHeight = 0.0
      if config.joints.concave:
        // Concave joint profile: parabolic curve across joint width
        distFromCenter = distanceToJointCenter(x, y) / (jointWidth / 2)
        baseHeight = -0.3 * (1 - distFromCenter^2)
    else:
      baseHeight = 1.0
      // Apply edge depth
      edgeDist = distanceToNearestEdge(x, y, currentTile)
      if edgeDist < edgeWidth:
        baseHeight -= config.pbr.normal.edgeDepth * (1 - edgeDist / edgeWidth)
    
    heightMap[y * outputWidth + x] = baseHeight
  
  // Step 2: Apply surface profile/finish to height
  if config has surfaceProfile:
    applyProfileToHeight(heightMap, profile)
  
  // Step 3: Optionally blend source image into height
  if config.pbr.normal.imageSource == 'grayscale':
    for each pixel:
      gray = luminance(diffuseMap[pixel])
      heightMap[pixel] = lerp(heightMap[pixel], gray/255, opacity)
  elif config.pbr.normal.imageSource == 'find_edges':
    edges = sobelEdgeDetect(diffuseMap)
    for each pixel:
      heightMap[pixel] = lerp(heightMap[pixel], edges[pixel], opacity)
  
  // Step 4: Compute normal from height via Sobel/Scharr operator
  normalMap = new ImageData(outputWidth, outputHeight)
  for each pixel (x, y):
    // Central differences
    dzdx = (heightAt(x+1, y) - heightAt(x-1, y)) * strength
    dzdy = (heightAt(x, y+1) - heightAt(x, y-1)) * strength
    normal = normalize([-dzdx, -dzdy, 1.0])
    // Encode to RGB: map [-1,1] → [0,255]
    normalMap[pixel].r = (normal.x * 0.5 + 0.5) * 255
    normalMap[pixel].g = (normal.y * 0.5 + 0.5) * 255  // OpenGL convention
    normalMap[pixel].b = (normal.z * 0.5 + 0.5) * 255
  
  return normalMap

Roughness Map
java
Run Code

Copy code
function generateRoughnessMap(config, tiles, diffuseMap, width, height):
  roughMap = new ImageData(width, height)
  
  for each pixel (x, y):
    if isJointPixel(x, y, tiles):
      // Joints are fully rough by default
      value = 255  // white = rough
    else:
      // Base roughness from config
      value = config.pbr.roughness.baseRoughness * 255 / 100
      
      // Optionally blend source image
      if config.pbr.roughness.imageSource == 'grayscale':
        srcGray = luminance(diffuseMap[pixel])
        // Darken blend mode: min(base, source)
        value = min(value, applyAdjustments(srcGray, config.pbr.roughness.adjustments))
      elif config.pbr.roughness.imageSource == 'find_edges':
        edgeValue = sobelEdgeDetect(diffuseMap)[pixel]
        value = min(value, applyAdjustments(edgeValue, ...))
    
    roughMap[pixel] = { r: value, g: value, b: value, a: 255 }
  
  return roughMap


Displacement Map
java
Run Code

Copy code
function generateDisplacementMap(config, tiles, diffuseMap, width, height):
  dispMap = new ImageData(width, height)
  
  for each pixel (x, y):
    if isJointPixel(x, y, tiles):
      value = 0  // black = recessed
      if config.joints.recess:
        value = 0
    else:
      value = 200  // light gray = raised
      
      // Apply geometry: edges, profiles, finishes
      edgeDist = distanceToNearestEdge(x, y, currentTile)
      if edgeDist < edgeWidth:
        value -= config.pbr.displacement.edgeDepth * 2.55 * (1 - edgeDist/edgeWidth)
      
      // Apply surface profile
      if hasProfile:
        profileValue = evaluateProfile(x, y, profile)
        value *= profileValue
      
      // Apply source image
      if config.pbr.displacement.imageSource != 'none':
        srcValue = ... // grayscale or edge-detected
        value = darkenBlend(value, srcValue * opacity)
    
    dispMap[pixel] = { r: value, g: value, b: value, a: 255 }
  
  return dispMap


Deterministic Rendering
Every random operation must use seeded PRNG:

typescript
Run Code

Copy code
// Master seed from config
const masterRng = seedrandom(config.seed.toString());

// Per-tile seed: deterministic from tile position
function tileSeed(tileRow: number, tileCol: number): number {
  return masterRng.int32() ^ (tileRow * 65537 + tileCol * 4099);
}

// Tone variation, fill angle rotation, material sampling offset
// all derived from tileSeed → same config always produces identical output


CPU vs GPU Tradeoffs
Operation	Best Location	Rationale
Pattern geometry computation	CPU (WASM)	Simple math, <1ms for typical grids
Material image sampling + compositing	GPU (WebGL2)	Pixel-parallel, texture sampling is GPU's strength
Adjustment filters (brightness, contrast, hue)	GPU (fragment shader)	Per-pixel, embarrassingly parallel
Edge detection (Sobel)	GPU (fragment shader)	Convolution kernel is classic GPU workload
Normal map from height	GPU (fragment shader)	Per-pixel derivatives
Tone variation	CPU (WASM)	Per-tile random seed, drives per-tile uniform
High-res export (4K+)	Server CPU (Rust)	Exceeds browser memory/time budgets
3D preview	GPU (Three.js/WebGL2)	Standard 3D rendering
Preview vs Export Rendering
Dimension	Preview	Export
Resolution	512-1024px (fit to viewport)	User-specified (1000-8192px)
Bit depth	8-bit (canvas)	8 or 16-bit
PBR maps	One at a time (active tab)	All selected maps simultaneously
Location	Client (Worker + WebGL)	Client (≤2K) or Server (>2K)
Speed target	<32ms	<30s
Format	ImageBitmap (display)	PNG/JPG/TIFF/EXR (file)
Render Worker Protocol
typescript
Run Code

Copy code
// render-protocol.ts (shared types)

type WorkerMessage =
  | { type: 'init'; wasmUrl: string }
  | { type: 'loadMaterial'; materialId: string; imageBitmap: ImageBitmap }
  | { type: 'render'; config: TextureConfig; width: number; height: number; mapType: MapType }
  | { type: 'exportLocal'; config: TextureConfig; width: number; height: number; maps: MapType[]; format: 'png' | 'jpg' }

type WorkerResponse =
  | { type: 'initComplete' }
  | { type: 'materialLoaded'; materialId: string }
  | { type: 'renderComplete'; bitmap: ImageBitmap; renderTimeMs: number }
  | { type: 'exportComplete'; files: { name: string; blob: Blob }[] }
  | { type: 'progress'; percent: number }
  | { type: 'error'; message: string }


Texture Project JSON Config Schema (Complete)
json

Copy code
{
  "$schema": "https://textura.app/schemas/texture-config-v1.json",
  "version": 1,
  "seed": 42,
  "units": "mm",
  "pattern": {
    "type": "running_bond",
    "category": "brick_bond",
    "rows": 6,
    "columns": 4,
    "angle": 0,
    "stretchers": 1,
    "weaves": 1
  },
  "materials": [
    {
      "id": "mat_primary",
      "source": { "type": "library", "assetId": "lib_red_brick_01" },
      "uploadWidth": null,
      "width": 215,
      "height": 65,
      "minWidth": 200,
      "minHeight": 60,
      "appearance": {
        "lightIntensity": 50,
        "surface": "none",
        "surfaceScale": 50
      },
      "adjustments": {
        "brightness": 0,
        "contrast": 10,
        "hue": 0,
        "saturation": 0,
        "invertColors": false
      },
      "tint": null,
      "edges": {
        "style": "handmade",
        "perimeterScale": 50,
        "profileWidth": 30,
        "excludeSides": []
      },
      "profile": null,
      "finish": null,
      "toneVariation": 40,
      "randomiseFillAngle": false,
      "placement": {
        "mode": "random",
        "frequency": 100,
        "rules": null
      },
      "pbr": {
        "bump": {
          "geometry": true,
          "edgeDepth": 50,
          "imageSource": "none",
          "adjustments": {
            "brightness": 0,
            "contrast": 0,
            "hue": 0,
            "saturation": 0,
            "invertColors": false,
            "opacity": 100
          }
        },
        "normal": {
          "geometry": true,
          "edgeDepth": 50,
          "imageSource": "find_edges",
          "adjustments": {
            "brightness": 0,
            "contrast": 20,
            "hue": 0,
            "saturation": 0,
            "invertColors": false,
            "opacity": 60
          }
        },
        "displacement": {
          "geometry": true,
          "edgeDepth": 50,
          "imageSource": "grayscale",
          "adjustments": {
            "brightness": 0,
            "contrast": 0,
            "hue": 0,
            "saturation": 0,
            "invertColors": false,
            "opacity": 40
          }
        },
        "roughness": {
          "geometry": true,
          "edgeDepth": 30,
          "baseRoughness": 70,
          "imageSource": "grayscale",
          "adjustments": {
            "brightness": -10,
            "contrast": 20,
            "hue": 0,
            "saturation": 0,
            "invertColors": false,
            "opacity": 50
          }
        },
        "metalness": {
          "geometry": false,
          "edgeDepth": 0,
          "baseMetalness": 0,
          "imageSource": "none",
          "adjustments": {
            "brightness": 0,
            "contrast": 0,
            "hue": 0,
            "saturation": 0,
            "invertColors": false,
            "opacity": 100
          }
        }
      }
    }
  ],
  "joints": {
    "materialSource": { "type": "solid", "color": "#8a8278" },
    "tint": null,
    "horizontalSize": 10,
    "verticalSize": 10,
    "shadowOpacity": 30,
    "recess": true,
    "concave": false,
    "adjustments": {
      "brightness": 0,
      "contrast": 0,
      "hue": 0,
      "saturation": 0,
      "invertColors": false
    }
  },
  "surfaceProfile": null,
  "surfaceFinish": null,
  "hatch": {
    "format": "autocad",
    "expressJoints": true,
    "depth": 50
  },
  "output": {
    "widthPx": 2048,
    "heightPx": 2048
  }
}

8. Backend & API Design
Domain Modules
csharp

Copy code
api/
├── auth/          # Session management, login, signup, password reset
├── projects/      # CRUD, versions, drafts, publish
├── uploads/       # File upload, crop, processing
├── exports/       # Job creation, status, download
├── library/       # Material catalog, pattern catalog
├── billing/       # Stripe webhooks, plan checks
├── sharing/       # Share links, public texture pages
├── admin/         # Internal tools, user management
└── common/        # Middleware, error handling, validation

API Design: REST (not GraphQL)
Rationale: REST is simpler, better cached, more Codex-friendly, and sufficient for this product's data access patterns. GraphQL adds complexity without clear benefit since we don't have deep nested queries.

Endpoint Specification
Auth
Method	Path	Purpose	Auth
POST	/api/v1/auth/signup	Create account	Public
POST	/api/v1/auth/login	Create session	Public
POST	/api/v1/auth/logout	Destroy session	Authenticated
POST	/api/v1/auth/forgot-password	Send reset email	Public
POST	/api/v1/auth/reset-password	Reset with token	Public
GET	/api/v1/auth/session	Get current session	Authenticated
Request: POST /api/v1/auth/signup

json

Copy code
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "Jane Architect"
}

Response: 201

json

Copy code
{
  "user": {
    "id": "usr_01JCXYZ...",
    "email": "user@example.com",
    "name": "Jane Architect",
    "plan": "free",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "sessionToken": "ses_01JCXYZ..."
}

Projects
Method	Path	Purpose	Auth
GET	/api/v1/projects	List user's projects	Auth
POST	/api/v1/projects	Create project	Auth
GET	/api/v1/projects/:id	Get project + current config	Auth (owner)
PATCH	/api/v1/projects/:id	Update metadata (name)	Auth (owner)
DELETE	/api/v1/projects/:id	Soft delete	Auth (owner)
PATCH	/api/v1/projects/:id/draft	Upsert autosave draft	Auth (owner)
POST	/api/v1/projects/:id/versions	Create named version	Auth (owner)
GET	/api/v1/projects/:id/versions	List versions	Auth (owner)
GET	/api/v1/projects/:id/versions/:vid	Get specific version	Auth (owner)
POST	/api/v1/projects/:id/publish	Publish to gallery	Auth (owner)
POST	/api/v1/projects/:id/share	Generate share link	Auth (owner)
Request: POST /api/v1/projects

json

Copy code
{
  "name": "Red Brick Running Bond",
  "config": { /* TextureConfig JSON */ }
}

Response: 201

json

Copy code
{
  "id": "proj_01JD...",
  "name": "Red Brick Running Bond",
  "currentVersionId": "ver_01JD...",
  "thumbnailUrl": null,
  "createdAt": "2025-01-15T10:05:00Z"
}

Request: POST /api/v1/projects/:id/versions

json

Copy code
{
  "config": { /* TextureConfig JSON */ },
  "thumbnail": "data:image/webp;base64,..."
}

Response: 201

json

Copy code
{
  "versionId": "ver_01JD...",
  "version": 3,
  "savedAt": "2025-01-15T10:10:00Z"
}

Uploads
Method	Path	Purpose	Auth
POST	/api/v1/uploads	Upload material image	Auth (Pro)
GET	/api/v1/uploads	List user's uploads	Auth
DELETE	/api/v1/uploads/:id	Delete upload	Auth (owner)
POST	/api/v1/uploads/:id/crops	Create crop region	Auth (owner)
GET	/api/v1/uploads/:id/image	Get image (signed URL redirect)	Auth (owner)
Request: POST /api/v1/uploads

less

Copy code
Content-Type: multipart/form-data
file: <binary>

Response: 201

json

Copy code
{
  "id": "upl_01JD...",
  "filename": "custom_marble.jpg",
  "width": 3000,
  "height": 2000,
  "sizeBytes": 2456789,
  "thumbnailUrl": "https://cdn.textura.app/uploads/upl_01JD.../thumb.webp",
  "createdAt": "2025-01-15T10:12:00Z"
}

Exports
Method	Path	Purpose	Auth
POST	/api/v1/exports	Create export job	Auth
GET	/api/v1/exports/:id	Get export status	Auth (owner)
GET	/api/v1/exports/:id/stream	SSE status stream	Auth (owner)
GET	/api/v1/exports	List export history	Auth
Request: POST /api/v1/exports

json

Copy code
{
  "projectId": "proj_01JD...",
  "versionId": "ver_01JD...",
  "maps": ["diffuse", "normal", "roughness", "displacement"],
  "width": 4096,
  "height": 4096,
  "format": "png",
  "bitDepth": 16
}

Response: 202

json

Copy code
{
  "id": "exp_01JD...",
  "status": "queued",
  "estimatedSeconds": 15
}

SSE Stream: GET /api/v1/exports/:id/stream

vbnet

Copy code
event: progress
data: {"percent": 25, "currentMap": "diffuse"}

event: progress
data: {"percent": 50, "currentMap": "normal"}

event: progress
data: {"percent": 75, "currentMap": "roughness"}

event: complete
data: {"downloadUrl": "https://r2.textura.app/exports/exp_01JD.../export.zip?X-Amz-Signature=...","expiresAt": "2025-01-15T11:15:00Z"}

Library
Method	Path	Purpose	Auth
GET	/api/v1/library/patterns	List available patterns	Public
GET	/api/v1/library/materials	List materials (paginated, filterable)	Public
GET	/api/v1/library/materials/:id	Material detail + source image URL	Public
GET	/api/v1/library/textures	Published texture gallery	Public
GET	/api/v1/library/textures/:slug	Published texture detail + config	Public
Billing
Method	Path	Purpose	Auth
POST	/api/v1/billing/checkout	Create Stripe Checkout session	Auth
POST	/api/v1/billing/portal	Create Stripe Customer Portal session	Auth
POST	/api/v1/billing/webhook	Stripe webhook receiver	Stripe signature
GET	/api/v1/billing/status	Current plan + usage	Auth
Sharing
Method	Path	Purpose	Auth
GET	/api/v1/share/:token	Get shared texture config (public)	Public
ID Strategy
ULID (Universally Unique Lexicographically Sortable Identifier) with type prefix:

usr_01JD... (users)
proj_01JD... (projects)
ver_01JD... (versions)
upl_01JD... (uploads)
exp_01JD... (exports)
pub_01JD... (published)
shr_01JD... (share links)
lib_01JD... (library assets)
Generated via ulidx package. Prefixed IDs prevent accidental cross-entity lookups.

Validation Strategy
typescript
Run Code

Copy code
// Shared Zod schemas in packages/shared/
export const textureConfigSchema = z.object({
  version: z.literal(1),
  seed: z.number().int().min(0).max(2147483647),
  units: z.enum(['mm', 'inches']),
  pattern: patternSchema,
  materials: z.array(materialConfigSchema).min(1).max(5),
  joints: jointsSchema,
  output: z.object({
    widthPx: z.number().int().min(100).max(8192),
    heightPx: z.number().int().min(100).max(8192),
  }),
  // ...
});

// Fastify route:
app.post('/api/v1/projects', {
  schema: {
    body: zodToJsonSchema(createProjectSchema),
  },
  preHandler: [requireAuth],
  handler: async (request, reply) => {
    const body = createProjectSchema.parse(request.body);
    // ...
  }
});


Pagination
Cursor-based for lists:

bash

Copy code
GET /api/v1/projects?cursor=proj_01JD...&limit=20

Response includes:

json

Copy code
{
  "items": [...],
  "nextCursor": "proj_01JE...",
  "hasMore": true
}

Rate Limiting
Endpoint Group	Limit	Window
Auth (login/signup)	10 requests	15 minutes
API (authenticated)	100 requests	1 minute
Uploads	20 uploads	1 hour
Exports	10 exports	1 hour (free), 50/hour (pro)
Public library	60 requests	1 minute
Implemented via Upstash Redis sliding window.

9. Database Schema
sql

Copy code
-- ==================== USERS ====================

CREATE TABLE users (
  id          TEXT PRIMARY KEY,           -- 'usr_01JD...'
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  password_hash TEXT NOT NULL,            -- argon2id
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'team'
  stripe_customer_id TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ                 -- soft delete
);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_stripe ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ==================== SESSIONS ====================

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ==================== PLANS ====================

CREATE TABLE plans (
  id              TEXT PRIMARY KEY,       -- 'free', 'pro_monthly', 'pro_yearly', 'team_monthly'
  name            TEXT NOT NULL,
  stripe_price_id TEXT,
  max_resolution  INTEGER NOT NULL,       -- max export px dimension
  max_exports_per_hour INTEGER NOT NULL,
  max_uploads     INTEGER NOT NULL,       -- total upload slots
  max_versions_per_project INTEGER NOT NULL,
  allows_pbr_export BOOLEAN NOT NULL DEFAULT false,
  allows_hatch_export BOOLEAN NOT NULL DEFAULT false,
  allows_upload   BOOLEAN NOT NULL DEFAULT false,
  allows_multi_material BOOLEAN NOT NULL DEFAULT false,
  allows_commercial_use BOOLEAN NOT NULL DEFAULT false,
  price_cents     INTEGER NOT NULL,
  interval        TEXT                    -- 'month' | 'year' | null (free)
);

-- Seed data:
INSERT INTO plans VALUES
  ('free', 'Free', NULL, 1000, 5, 0, 10, false, false, false, false, false, 0, NULL),
  ('pro_monthly', 'Pro Monthly', 'price_xxx', 8192, 50, 100, 100, true, true, true, true, true, 699, 'month'),
  ('pro_yearly', 'Pro Yearly', 'price_yyy', 8192, 50, 100, 100, true, true, true, true, true, 5990, 'year');

-- ==================== SUBSCRIPTIONS ====================

CREATE TABLE subscriptions (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES users(id),
  plan_id               TEXT NOT NULL REFERENCES plans(id),
  stripe_subscription_id TEXT UNIQUE,
  status                TEXT NOT NULL,      -- 'active' | 'past_due' | 'canceled' | 'paused'
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- ==================== PROJECTS ====================

CREATE TABLE projects (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id),
  name                TEXT NOT NULL,
  thumbnail_url       TEXT,
  current_version_id  TEXT,               -- FK added after project_versions created
  draft_config        JSONB,              -- autosave draft (overwritten)
  is_published        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_projects_user ON projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);

-- ==================== PROJECT VERSIONS ====================

CREATE TABLE project_versions (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  version     INTEGER NOT NULL,           -- auto-incremented per project
  config      JSONB NOT NULL,             -- full TextureConfig
  thumbnail_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, version)
);
CREATE INDEX idx_versions_project ON project_versions(project_id, version DESC);

ALTER TABLE projects ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES project_versions(id);

-- ==================== UPLOADS ====================

CREATE TABLE uploads (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  filename        TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  width_px        INTEGER NOT NULL,
  height_px       INTEGER NOT NULL,
  storage_key     TEXT NOT NULL,           -- R2 key: 'uploads/{userId}/{uploadId}/original.{ext}'
  thumbnail_key   TEXT,
  sha256_hash     TEXT NOT NULL,           -- for deduplication
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_uploads_user ON uploads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_uploads_hash ON uploads(sha256_hash);

-- ==================== UPLOAD CROPS ====================

CREATE TABLE upload_crops (
  id          TEXT PRIMARY KEY,
  upload_id   TEXT NOT NULL REFERENCES uploads(id),
  x           INTEGER NOT NULL,
  y           INTEGER NOT NULL,
  width       INTEGER NOT NULL,
  height      INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crops_upload ON upload_crops(upload_id);

-- ==================== EXPORTS ====================

CREATE TABLE exports (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  project_id      TEXT NOT NULL REFERENCES projects(id),
  version_id      TEXT NOT NULL REFERENCES project_versions(id),
  maps            TEXT[] NOT NULL,          -- {'diffuse','normal','roughness'}
  width_px        INTEGER NOT NULL,
  height_px       INTEGER NOT NULL,
  format          TEXT NOT NULL,            -- 'png' | 'jpg' | 'tiff'
  bit_depth       INTEGER NOT NULL DEFAULT 8,
  status          TEXT NOT NULL DEFAULT 'queued', -- 'queued' | 'processing' | 'complete' | 'failed'
  progress        INTEGER NOT NULL DEFAULT 0,     -- 0-100
  download_url    TEXT,                     -- signed R2 URL
  download_expires_at TIMESTAMPTZ,
  storage_key     TEXT,                     -- R2 key for cleanup
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exports_user ON exports(user_id, created_at DESC);
CREATE INDEX idx_exports_status ON exports(status) WHERE status IN ('queued', 'processing');

-- ==================== SHARE LINKS ====================

CREATE TABLE share_links (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  version_id  TEXT NOT NULL REFERENCES project_versions(id),
  token       TEXT NOT NULL UNIQUE,        -- short random token for URL
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ                  -- null = never expires
);
CREATE UNIQUE INDEX idx_share_token ON share_links(token);

-- ==================== PUBLISHED TEXTURES ====================

CREATE TABLE published_textures (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  version_id      TEXT NOT NULL REFERENCES project_versions(id),
  user_id         TEXT NOT NULL REFERENCES users(id),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  thumbnail_url   TEXT NOT NULL,
  preview_urls    JSONB NOT NULL,           -- {"diffuse": "...", "normal": "...", "sphere": "..."}
  config          JSONB NOT NULL,           -- snapshot of config at publish time
  view_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_published_slug ON published_textures(slug);
CREATE INDEX idx_published_category ON published_textures(category, created_at DESC);

-- ==================== LIBRARY ASSETS (admin-managed) ====================

CREATE TABLE library_assets (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,            -- 'stone' | 'brick' | 'wood' | etc.
  manufacturer_id TEXT,
  source_image_key TEXT NOT NULL,
  thumbnail_key   TEXT NOT NULL,
  physical_width_mm NUMERIC,               -- real-world width of source
  default_config  JSONB,                    -- default TextureConfig for this material
  is_pro          BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_library_category ON library_assets(category, sort_order);
CREATE INDEX idx_library_search ON library_assets USING gin(to_tsvector('english', name));

-- ==================== COLLECTIONS ====================

CREATE TABLE collections (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE collection_items (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  project_id    TEXT NOT NULL REFERENCES projects(id),
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, project_id)
);

-- ==================== AUDIT LOG ====================

CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT,
  action      TEXT NOT NULL,               -- 'project.create' | 'export.complete' | 'billing.subscribe'
  resource_type TEXT,
  resource_id TEXT,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
-- Partition by month for large-scale cleanup:
-- CREATE TABLE audit_logs (...) PARTITION BY RANGE (created_at);

-- ==================== USAGE EVENTS (for analytics/billing) ====================

CREATE TABLE usage_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  event_type  TEXT NOT NULL,               -- 'render' | 'export' | 'upload' | 'download'
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usage_user_type ON usage_events(user_id, event_type, created_at DESC);

What Belongs Where
Data	Storage	Rationale
User records, projects, subscriptions	PostgreSQL	Relational, ACID
TextureConfig	PostgreSQL JSONB	Queryable, versioned with project
Material source images	R2	Binary blobs, CDN-served
Upload originals + crops	R2	Binary, user-specific
Export ZIPs	R2	Large binary, time-limited access
Thumbnails	R2 + CDN cache	Small binary, frequently accessed
Session tokens	Redis	Fast lookup, TTL expiry
Rate limit counters	Redis	Atomic increment, TTL
Export job queue	Redis (BullMQ)	Transient, ordered
Material library metadata cache	Redis	24h TTL, avoid DB hits
10. File Storage & Asset Pipeline
Storage Key Structure (R2)
bash

Copy code
/materials/{assetId}/source.jpg           # Library material images (admin-managed)
/materials/{assetId}/thumb_256.webp
/uploads/{userId}/{uploadId}/original.{ext}
/uploads/{userId}/{uploadId}/thumb_256.webp
/uploads/{userId}/{uploadId}/crops/{cropId}.jpg
/exports/{exportId}/export.zip
/thumbnails/{projectId}/{versionId}.webp
/published/{publishedId}/preview_diffuse.webp
/published/{publishedId}/preview_normal.webp
/published/{publishedId}/preview_sphere.webp

Upload Pipeline
vbnet

Copy code
1. Client: POST /api/v1/uploads (multipart/form-data)
2. Server (Fastify):
   a. Check auth + plan allows upload
   b. Check file size ≤ 20MB
   c. Check Content-Type ∈ ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
   d. Stream to temp file (do NOT buffer in memory)
   e. Validate image with Sharp:
      - Verify it's a valid image (catches malformed/polyglot files)
      - Extract dimensions
      - Strip EXIF (privacy)
      - Compute SHA-256 hash
   f. Check deduplication: if hash exists for this user, return existing upload
   g. Upload original to R2
   h. Generate 256px thumbnail via Sharp → upload to R2
   i. Insert upload row in DB
   j. Return upload metadata
3. Cleanup: delete temp file

Security Controls for Uploads
diff

Copy code
- Max file size: 20MB (enforced at reverse proxy + app level)
- Allowed types: JPEG, PNG, WebP, TIFF only
- Magic byte verification: read first 8 bytes, verify matches declared Content-Type
- Image validation: Sharp.metadata() to confirm valid image
- EXIF stripping: Sharp.rotate() to apply orientation then strip all metadata
- No SVG uploads (XSS vector)
- Content-Disposition: attachment on all download URLs (prevent inline execution)
- Separate R2 bucket from application code (no path traversal risk)
- Signed URLs for all private assets (1 hour expiry)
- Rate limit: 20 uploads/hour

Cleanup Lifecycle
Asset	Retention	Cleanup
Export ZIPs	7 days after creation	Daily cron job
Draft thumbnails	30 days after last update	Weekly cron
Deleted upload originals	30 days after soft delete	Weekly cron
Published previews	Indefinite (while published)	On unpublish
Quotas
Plan	Max Uploads	Max Storage	Max Export Size
Free	0	0	1000px
Pro	100 files	500MB total	8192px
Team	500 files	2GB total	8192px
11. Performance Engineering Plan
Performance Budgets
Metric	Target	Measurement
First Contentful Paint (/)	<1.2s	Lighthouse
First Contentful Paint (/create)	<2.0s	Lighthouse
Editor interactive (TTI)	<3.0s	Lighthouse
WASM module load	<500ms	Performance.mark
Preview render (512×512)	<16ms	Worker postMessage round-trip
Preview render (1024×1024)	<32ms	Worker postMessage round-trip
Parameter change → preview update	<50ms	requestAnimationFrame callback
Save (POST /versions)	<300ms (p95)	Server-side
Export job (2K, 3 maps)	<10s	Queue → complete
Export job (4K, 6 maps)	<30s	Queue → complete
Material library load	<200ms	API response
JS bundle (editor chunk)	<250KB gzipped	Build output
WASM binary	<500KB gzipped	Build output
Total page weight (/create)	<1.5MB	Network tab
API response (p95)	<100ms	Server metrics
Database query (p95)	<20ms	Query analyzer
Optimization Strategies
First Load
Next.js static generation for marketing pages (ISR, 1 hour revalidation)
Dynamic import for editor components (next/dynamic with ssr: false)
WASM loaded lazily after editor shell renders (show skeleton → load engine)
Material thumbnails: WebP, 256px, lazy-loaded with loading="lazy"
Font: System font stack (no web fonts download)
Code splitting: Editor, dashboard, marketing are separate chunks
Editor Responsiveness
OffscreenCanvas in Dedicated Worker: All rendering off main thread
requestAnimationFrame debounce: Coalesce rapid slider drags into single render
Abort previous render: If new config arrives while rendering, abort and restart
ImageBitmap transfer: Zero-copy transfer from Worker to main thread canvas
Material image pre-loading: Load material ImageBitmaps into Worker on material selection, before user edits
Rendering Latency
WebGL2 fragment shaders for compositing: GPU does per-pixel work
WASM for geometry computation: <1ms for tile grid calculation
Typed arrays everywhere: Float32Array for height maps, Uint8ClampedArray for pixel data
No garbage collection pressure: Pre-allocate buffers, reuse between renders
Caching
Material library metadata: Redis, 24h TTL
Material source images: CDN cached indefinitely (content-addressed keys)
Published texture pages: CDN cached 1 hour, stale-while-revalidate
User session: Redis, 30-day TTL
Pattern catalog: Embedded in JS bundle (static data)
Export Optimization
Parallel map generation: Rust binary generates all requested maps in a single pass (shared geometry computation)
Memory mapping: For 8K images (32MB per map), use memory-mapped files to avoid OOM
Streaming ZIP: Write ZIP entries as maps complete (don't wait for all)
Pre-warm workers: Keep 1 Fly Machine warm for instant first job pickup
Database
Read replica for dashboard queries and library browsing
JSONB indexing: CREATE INDEX idx_config_pattern ON project_versions USING gin ((config->'pattern')); for gallery filtering
Connection pooling: PgBouncer or Neon's built-in pooler
Prepared statements: Drizzle generates parameterized queries by default
Profiling Plan
Lighthouse CI in GitHub Actions on every PR (performance regression gate)
Sentry Performance for real user monitoring (Core Web Vitals)
Worker.postMessage timestamps for render latency tracking
BullMQ job metrics exported to Grafana (queue depth, processing time)
PostgreSQL pg_stat_statements for slow query detection
12. Security Review & Hardening Plan
Security Checklist (Pre-Launch)
Authentication & Sessions
 Passwords hashed with argon2id (memory: 64MB, iterations: 3, parallelism: 4)
 Session tokens: cryptographically random, 256-bit, stored in Redis with 30-day TTL
 Session cookie: HttpOnly, Secure, SameSite=Lax, Path=/
 Login rate limiting: 10 attempts per 15 minutes per IP
 Account lockout after 20 failed attempts (temporary, 1 hour)
 Password reset tokens: single-use, 1-hour expiry, invalidated on use
 No password in URL parameters or logs
CSRF / XSS / CSP
 CSRF: SameSite cookie + Origin header verification on mutations
 CSP header: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.r2.dev https://*.cloudflare.com data:; connect-src 'self' https://api.stripe.com; frame-ancestors 'none'; base-uri 'self'
 X-Content-Type-Options: nosniff
 X-Frame-Options: DENY
 Referrer-Policy: strict-origin-when-cross-origin
 All user-generated text rendered via React (auto-escaped)
 No dangerouslySetInnerHTML anywhere
 No eval() or new Function()
SSRF Prevention
 Upload URLs: direct file upload only, no URL-based fetch
 No user-controlled URLs fetched server-side (except Stripe webhooks to known endpoints)
 Internal service communication via private network (Fly.io internal DNS)
Upload Security
 File size limit: 20MB (nginx + app level)
 Content-Type whitelist: image/jpeg, image/png, image/webp, image/tiff
 Magic byte verification before processing
 Image processed through Sharp (which uses libvips—handles malformed images safely)
 EXIF/metadata stripped
 No SVG uploads (XSS risk)
 Uploaded files stored with random keys (no user-controlled filenames in storage path)
 Content-Disposition: attachment on all served uploads
 Uploads in separate R2 bucket from application assets
Image Processing Sandboxing
 Sharp runs in the API server process (libvips is memory-safe)
 Rust export binary runs in isolated Docker container
 Export container has: no network access (except R2), no filesystem persistence, CPU/memory limits
 OOM killer configured on export containers (max 4GB RAM)
 Export timeout: 5 minutes hard limit
Access Control
 Every API endpoint checks session authentication
 Resource ownership verified: WHERE user_id = $sessionUserId
 Plan-gated features checked server-side at export time (never trust client)
 Published textures are read-only public; edit requires ownership
 Share links give read-only access to config (no edit, no export without auth)
 Admin endpoints require separate admin role flag
Signed URLs
 All R2 private assets served via signed URLs (1-hour expiry)
 Export download URLs expire in 1 hour
 Signed URL generation is server-side only
 No permanent public URLs for user uploads
Secret Management
 All secrets in environment variables (Fly.io secrets)
 No secrets in code, config files, or Docker images
 Stripe webhook secret verified on every webhook
 Database credentials rotated quarterly
 .env files in .gitignore
Abuse Prevention
 Rate limiting on all endpoints (Redis sliding window)
 Export quota per hour per user (plan-based)
 Upload quota per user (plan-based)
 Suspicious activity detection: >100 exports/day, >50 uploads/day → flag for review
 Free accounts limited to 5 exports/hour
 Bot protection: Cloudflare Turnstile on signup
Billing Security
 Plan checks always server-side from fresh DB read (never cached plan status)
 Stripe webhook signature verification (stripe.webhooks.constructEvent)
 Subscription downgrades take effect at period end
 No feature access between payment failure and plan update
Audit Logging
 All auth events logged (login, logout, password reset)
 All billing events logged
 All export completions logged
 All publish/share events logged
 Logs include user_id, IP, timestamp, resource
Dependency Risk
 npm audit in CI pipeline (fail on critical)
 Dependabot enabled for security updates
 Lock file committed (pnpm-lock.yaml)
 Minimal production dependencies (no test/dev deps in Docker)
 Supply chain: use --frozen-lockfile in CI
Data Privacy
 User data exportable (GDPR right of access)
 Account deletion cascades to all user data (GDPR right to erasure)
 Upload originals deleted on account deletion
 No analytics PII (PostHog configured to anonymize IPs)
 Cookie consent banner for EU users
Top Attack Vectors & Mitigations
Attack	Mitigation
Malicious image upload (ImageTragick-style)	Magic byte check + Sharp validation + no ImageMagick
Free-tier abuse (mass exports)	Rate limiting + export quota + IP tracking
Credential stuffing	Rate limiting + lockout + Turnstile on signup
IDOR (accessing other users' projects)	Ownership check on every resource access
Billing bypass (fake plan check)	Server-side plan verification from DB at export time
XSS via project name	React auto-escaping + CSP
SSRF via webhook manipulation	Stripe signature verification + no user-controlled URLs
ZIP bomb export DoS	Export container memory/CPU limits + timeout
13. Scalability & Reliability
Horizontal Scaling
Component	Scaling Model	Trigger
Next.js app	Fly Machines, 2-4 instances	CPU >70%
Fastify API	Fly Machines, 2-4 instances	CPU >70% or request latency >200ms
Export workers	Fly Machines, 0-N (scale to zero)	Queue depth >0
PostgreSQL	Vertical (Neon scales compute) + read replica	Query latency
Redis	Upstash serverless (auto-scales)	—
R2	Infinite (managed)	—
Stateless Design
No server-side session state: sessions in Redis
No file system state: all assets in R2
Any app instance can handle any request
Export workers are stateless: pull job, process, upload result, die
Retry & Idempotency
Exports: BullMQ retries 3 times with exponential backoff (10s, 60s, 300s)
Export idempotency: Same (projectId + versionId + outputSpec hash) → return existing export if complete
Webhook idempotency: Stripe webhook events have unique IDs; store processed event IDs in Redis (24h TTL)
Save idempotency: Version number auto-incremented server-side; duplicate saves just create new versions
Failure Handling
Failure	Handling
Export worker OOM	Container killed, BullMQ retry on different machine
Export worker timeout	5-minute deadline, mark as failed, notify user
R2 upload failure	Retry 3x, then fail export
DB connection failure	Drizzle connection pool retry, circuit breaker at 5 failures
Redis down	Sessions fall back to DB lookup (slower); exports queue stalls (acceptable for minutes)
Backup Strategy
PostgreSQL: Neon automatic point-in-time recovery (7-day retention) OR Fly Postgres daily snapshots
R2: Cross-region replication enabled
Redis: Upstash automatic persistence; data is reconstructible (sessions = user re-logs in; queue = re-enqueue)
SLO Targets
SLO	Target
API availability	99.9% (43 min downtime/month)
Editor availability	99.5% (3.6 hours/month; client can work offline)
Export completion rate	99% of jobs succeed
Export latency (2K)	p99 < 30s
API latency	p99 < 500ms
14. Developer Experience & Repository Structure
Monorepo with pnpm Workspaces + Turborepo
graphql

Copy code
textura/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + test + typecheck on PR
│   │   ├── deploy-preview.yml        # Deploy preview on PR (Fly.io preview apps)
│   │   ├── deploy-production.yml     # Deploy on main merge
│   │   └── security-audit.yml        # Weekly npm audit + Snyk
│   └── dependabot.yml
├── packages/
│   ├── shared/                       # Shared types + validation
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── config.ts         # TextureConfig + all sub-types
│   │   │   │   ├── api.ts            # Request/Response types
│   │   │   │   ├── patterns.ts       # Pattern type definitions
│   │   │   │   └── plans.ts          # Plan feature flags
│   │   │   ├── schemas/
│   │   │   │   ├── config.schema.ts  # Zod schema for TextureConfig
│   │   │   │   ├── api.schema.ts     # Zod schemas for API bodies
│   │   │   │   └── index.ts
│   │   │   ├── constants/
│   │   │   │   ├── patterns.ts       # Pattern catalog data
│   │   │   │   ├── materials.ts      # Material category definitions
│   │   │   │   └── limits.ts         # Plan limits
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                          # Next.js frontend (see Section 6)
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── workers/
│   │   ├── types/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   ├── api/                          # Fastify backend
│   │   ├── src/
│   │   │   ├── server.ts             # Fastify app setup
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── uploads.ts
│   │   │   │   ├── exports.ts
│   │   │   │   ├── library.ts
│   │   │   │   ├── billing.ts
│   │   │   │   └── sharing.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   ├── upload.service.ts
│   │   │   │   ├── export.service.ts
│   │   │   │   ├── billing.service.ts
│   │   │   │   └── storage.service.ts
│   │   │   ├── jobs/
│   │   │   │   ├── worker.ts         # BullMQ worker entry point
│   │   │   │   ├── export.job.ts
│   │   │   │   └── cleanup.job.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Drizzle schema definitions
│   │   │   │   ├── migrations/
│   │   │   │   ├── seed.ts
│   │   │   │   └── client.ts         # DB connection
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   └── error-handler.ts
│   │   │   └── lib/
│   │   │       ├── redis.ts
│   │   │       ├── storage.ts        # R2 client
│   │   │       ├── stripe.ts
│   │   │       └── email.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── texgen/                       # Rust WASM + CLI
│       ├── crates/
│       │   ├── texgen-core/          # Core rendering logic (shared)
│       │   │   ├── src/
│       │   │   │   ├── lib.rs
│       │   │   │   ├── pattern.rs    # Pattern geometry computation
│       │   │   │   ├── material.rs   # Material sampling
│       │   │   │   ├── compositing.rs # Image compositing
│       │   │   │   ├── pbr.rs        # PBR map generation
│       │   │   │   ├── adjustments.rs # Color adjustments
│       │   │   │   ├── edges.rs      # Edge effects
│       │   │   │   ├── seamless.rs   # Seamless tiling logic
│       │   │   │   ├── hatch.rs      # Hatch vector generation
│       │   │   │   └── config.rs     # TextureConfig deserialization
│       │   │   └── Cargo.toml
│       │   ├── texgen-wasm/          # WASM bindings
│       │   │   ├── src/lib.rs
│       │   │   └── Cargo.toml
│       │   └── texgen-cli/           # CLI binary for server export
│       │       ├── src/main.rs
│       │       ├── Dockerfile
│       │       └── Cargo.toml
│       └── Cargo.toml                # Workspace
├── infra/
│   ├── fly.toml                      # Fly.io app config
│   ├── fly.worker.toml               # Fly.io worker config
│   └── scripts/
│       ├── setup-db.sh
│       ├── seed-materials.sh
│       └── create-r2-buckets.sh
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── CONTRIBUTING.md
│   └── DEPLOYMENT.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .eslintrc.cjs
├── .prettierrc
├── .nvmrc                            # Node 22
└── README.md

Local Dev Setup
bash

Copy code
# Prerequisites: Node 22, pnpm 9, Rust/cargo, wasm-pack, Docker

git clone <repo> && cd textura
pnpm install

# Start infrastructure
docker compose up -d  # PostgreSQL + Redis

# Setup database
pnpm --filter api db:migrate
pnpm --filter api db:seed

# Build WASM
cd packages/texgen && wasm-pack build crates/texgen-wasm --target web --out-dir ../../web/public/wasm

# Start dev servers (concurrent)
pnpm dev  # Runs: next dev (port 3000) + fastify dev (port 3001)

docker-compose.yml (local dev)
yaml

Copy code
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: textura
      POSTGRES_USER: textura
      POSTGRES_PASSWORD: textura_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
volumes:
  pgdata:

Environment Strategy
Env	Purpose	Infra
local	Development	Docker Compose (PG + Redis), Next.js + Fastify dev mode
preview	PR preview	Fly.io preview app, Neon branch, Upstash dev Redis
staging	Pre-production	Fly.io staging, Neon staging branch, Upstash staging
production	Live	Fly.io production, Neon production, Upstash production
Testing Setup
bash

Copy code
packages/shared/    → vitest (unit tests for schemas/validation)
packages/web/       → vitest (unit) + Playwright (e2e)
packages/api/       → vitest (unit + integration with test DB)
packages/texgen/    → cargo test (Rust unit tests)

Integration test DB: Each test file gets a fresh schema via CREATE SCHEMA test_{random}; SET search_path TO test_{random};.

15. Step-by-Step Build Plan
Phase 0: Discovery + Spike (Week 1)
Goal: Validate core rendering approach, set up monorepo.

Deliverables:

Monorepo scaffolded (turbo + pnpm + packages)
Rust WASM spike: render a simple running bond pattern as ImageData
WebGL2 spike: composite material image onto tile geometry via fragment shader
Canvas rendering benchmark: compare Canvas 2D vs WebGL2 vs WASM-only for 1024×1024
Decision doc on rendering approach
Success Criteria: Can render a 1024×1024 running bond texture with material image in <32ms in a Worker.

Phase 1: Core Editor Shell (Weeks 2-3)
Goal: Functional editor UI with pattern selection and parameter controls.

Deliverables:

Next.js app with /create route
Editor layout (panels, canvas, toolbar)
Zustand store with TextureConfig model
Pattern panel: category selector, variant picker, row/column/angle controls
Canvas component rendering preview from Worker
5 pattern algorithms implemented (running bond, stack, herringbone, stretcher, basketweave)
Basic keyboard shortcuts (undo/redo, zoom)
Undo/redo via Immer patches
Dependencies: Phase 0 rendering spike validated.

Risks: WebGL2 complexity may slow UI work; mitigate by starting with Canvas 2D and upgrading later.

Success Criteria: User can select pattern, adjust rows/columns, see live preview update.

Phase 2: Material System (Weeks 4-5)
Goal: Material selection, image sampling, appearance controls.

Deliverables:

Material browser component (categories, search, thumbnails)
Material source image loading into Worker (ImageBitmap)
Material sampling into tile geometry
Appearance controls: brightness, contrast, hue, saturation, tint
Tone variation (per-tile randomization)
Edge styles (fine, handmade, rough, uneven)
Solid fill material
Joint rendering (color, sizing, shadow opacity, recess, concave)
50+ library materials seeded in DB
Dependencies: Phase 1 editor shell.

Success Criteria: User can select materials, adjust appearance, see realistic tile textures.

Phase 3: Uploads + Multi-Material (Weeks 6-7)
Goal: Custom uploads and multi-material placement.

Deliverables:

Upload pipeline (Fastify route, Sharp processing, R2 storage)
Upload crop tool UI
Upload material integration in editor
Multi-material UI ("Add Another Material")
Placement modes: Random, Defined, Manual
Placement rules (hit/miss row/column)
Frequency slider
Dependencies: Phase 2 + auth (basic login needed for uploads).

Success Criteria: Pro user can upload image, crop regions, use in multi-material pattern.

Phase 4: PBR Maps (Weeks 8-9)
Goal: Generate all PBR map types.

Deliverables:

Height map generation from geometry
Normal map via Sobel operator
Displacement map
Roughness map with base roughness + image source
Metalness map
Bump map
Per-map PBR settings UI panel
Image source options (none, grayscale, find edges)
Per-map adjustment controls
Tab switching between map previews
Dependencies: Phase 2 materials (need source images for PBR derivation).

Success Criteria: All 6 PBR map types render correctly in preview, match target site's output quality.

Phase 5: Save / Version / Share (Weeks 10-11)
Goal: Project persistence and sharing.

Deliverables:

Auth system (signup, login, sessions via Lucia)
Project CRUD API
Version creation on save
Draft autosave
Dashboard with project grid
Version history view
Share link generation
Public texture detail page (/texture/[slug])
Collection management
Dependencies: Phase 1 editor (save config), auth.

Success Criteria: User can sign up, create project, save versions, share link, reload project.

Phase 6: Export Pipeline (Weeks 12-14)
Goal: High-quality export with server-side rendering.

Deliverables:

Rust CLI binary (texgen-cli): render all map types at arbitrary resolution
BullMQ job queue for exports
Export API endpoints
SSE progress streaming
ZIP packaging
Client-side export for ≤2K resolution (WASM)
Download dialog UI with format/resolution options
Plan-gated resolution and format checks
Hatch export: AutoCAD .PAT, DXF, SVG
Dependencies: Phase 4 (PBR maps), Phase 5 (auth for plan checks).

Risks: Rust CLI binary is the most complex component. Start with Node.js + Sharp fallback, then optimize with Rust.

Success Criteria: User can export 4K texture with 6 PBR maps as ZIP in <30 seconds.

Phase 7: Billing + Pro Features (Weeks 15-16)
Goal: Monetization.

Deliverables:

Stripe Checkout integration
Stripe Customer Portal (manage subscription)
Webhook handler (subscribe, cancel, payment failure)
Plan feature gating (resolution, PBR export, upload, multi-material, hatch, commercial license)
Pricing page
Pro badge/indicators in editor
Upgrade prompts at gate points
Dependencies: Phase 5 (auth), Phase 6 (exports gated by plan).

Success Criteria: User can subscribe, features unlock, subscription lifecycle works.

Phase 8: Performance Hardening (Weeks 17-18)
Goal: Meet all performance budgets.

Deliverables:

Lighthouse CI in pipeline (fail PR if regression >5%)
WebGL2 shader optimization for preview
Worker render pipeline profiling and optimization
CDN caching strategy for library assets
Database query optimization (EXPLAIN ANALYZE all hot paths)
Bundle size audit and tree-shaking
Image lazy loading throughout
Preloading strategy (WASM, critical materials)
Success Criteria: All performance budget targets met (see Section 11).

Phase 9: Security Hardening (Week 19)
Goal: Complete security checklist.

Deliverables:

All security checklist items (Section 12) verified
Penetration testing (self or contracted)
CSP headers deployed and tested
Rate limiting verified under load
Upload security verified with malformed files
Dependency audit clean
Success Criteria: All checklist items checked, no critical findings.

Phase 10: Launch Readiness (Week 20)
Goal: Production deployment.

Deliverables:

Production infrastructure provisioned
DNS configured
Monitoring dashboards
Error alerting (Sentry → Slack)
Backup verification
Load test (100 concurrent users)
Documentation (API docs, user guide)
Terms of Use, Privacy Policy
Cookie consent
Launch announcement
Success Criteria: System handles 100 concurrent editors, 20 simultaneous exports, zero errors.

16. MVP vs V2 vs V3
MVP (Weeks 1-20, launch)
10+ pattern types (brick bonds, herringbone, stack, chevron, basketweave, hexagonal, parquetry, ashlar)
Material library (100+ materials across 10 categories)
Full appearance controls (adjustments, edges, tint, tone variation)
Joint configuration
PBR map generation (all 6 types)
Hatch export (AutoCAD .PAT, SVG, DXF)
Custom upload (Pro)
Multi-material placement (Pro)
Save/load/version
Share links
Export (PNG/JPG, up to 8K for Pro)
Auth + billing (Stripe)
Basic dashboard
V2 (Months 4-6)
Surface profiles and finishes (detailed geometric overlays)
3D interactive preview (Three.js sphere/cube with real-time material)
Scene view (room preview with material applied)
TIFF/EXR export (16-bit HDR)
Batch export (multiple textures)
Public gallery with search
Rhino plugin
SketchUp plugin
Revit plugin
Iframe embed API (with URL parameters for white-labeling)
Team accounts + shared libraries
Advanced patterns (random stone, crazy paving, organic)
Offline mode (Service Worker + WASM)
V3 (Months 7-12)
AI text-to-texture (fine-tuned SDXL on material textures)
AI material enhancement (upscale low-res uploads, generate missing PBR maps from photo)
Public API (REST, API keys, rate-limited)
Manufacturer integrations (direct from product catalogs)
Version diffing (visual comparison of versions)
Real-time collaboration (CRDT-based shared editing)
Custom pattern editor (draw your own tile layout)
Substance-style node graph for advanced material authoring
Mobile editor (touch-optimized)
Marketplace (user-created textures for sale)
Strict Deferrals (NOT in MVP)
3D scene view
Plugins (Rhino, SketchUp, Revit)
Iframe embed API
Team accounts
AI features
Public API
Marketplace
Real-time collab
Node graph editor
Mobile optimization beyond basic responsive
17. Recommended Final Architecture
Final Stack
Layer	Technology
Frontend framework	Next.js 15 (App Router)
Frontend language	TypeScript 5.5 (strict)
UI library	shadcn/ui (Radix + Tailwind 4)
Editor state	Zustand 5 + Immer
Server state	TanStack Query v5
Preview rendering	WebGL2 + OffscreenCanvas in Dedicated Worker
Compute engine	Rust → WASM (wasm-pack, wasm32-unknown-unknown)
3D preview (V2)	Three.js
Backend	Node.js 22 + Fastify 5
ORM	Drizzle ORM
Database	PostgreSQL 16 (Neon serverless)
Cache / Queue	Upstash Redis + BullMQ 5
Object storage	Cloudflare R2
CDN	Cloudflare
Export worker	Rust binary (texgen-cli) in Docker on Fly Machines
Auth	Better Auth (PostgreSQL + Redis session store)
Payments	Stripe (Checkout + Webhooks + Customer Portal)
Email	Resend
Monitoring	Sentry (errors) + Grafana Cloud (metrics)
Analytics	PostHog (self-hosted or cloud)
CI/CD	GitHub Actions + Turborepo
Hosting	Fly.io (app + API + workers)
Infra-as-code	Fly.io CLI + scripts (not Terraform for this scale)
Final Architecture Summary
java
Run Code

Copy code
Client (Browser)
├── Next.js shell (SSR marketing, CSR editor)
├── Render Worker (Dedicated Worker + OffscreenCanvas)
│   ├── WASM module (texgen-wasm): geometry, sampling, PBR
│   └── WebGL2 context: compositing, shader effects
├── Zustand store: TextureConfig + UI state + undo history
└── TanStack Query: server data cache

Server
├── Fastify API (stateless, horizontal scaled)
│   ├── Auth (Lucia sessions → Redis)
│   ├── Project CRUD (→ PostgreSQL)
│   ├── Upload pipeline (→ Sharp → R2)
│   ├── Export orchestration (→ BullMQ → Redis)
│   └── Billing (→ Stripe)
├── Export Workers (Fly Machines, scale-to-zero)
│   ├── texgen-cli (Rust binary)
│   ├── Pull job from BullMQ
│   ├── Read assets from R2
│   ├── Generate maps at resolution
│   ├── Package ZIP → R2
│   └── Update DB + notify via SSE
├── PostgreSQL (Neon): users, projects, versions, exports
├── Redis (Upstash): sessions, queue, rate limits, cache
└── R2 (Cloudflare): materials, uploads, exports, thumbnails


Final Rendering Approach
Preview (client):

Zustand config change → debounced 16ms → Worker message
Worker: WASM computes tile geometry (<1ms)
Worker: WebGL2 fragment shader composites materials onto tiles, applies adjustments, renders joints
Worker: readPixels → ImageBitmap → transferBack
Main thread: drawImage to visible canvas
Total: <32ms for 1024×1024
Export ≤2K (client):

Same Worker pipeline but at target resolution
Canvas.toBlob() → download
Export >2K (server):

POST /exports → BullMQ job
texgen-cli reads config JSON + material images
Renders all maps sequentially at target resolution
Writes PNG/TIFF/EXR files
ZIPs → R2 → signed URL
Final Security Model
Session-based auth (HttpOnly cookies, Redis store)
Server-side plan enforcement on all gated operations
Signed URLs for all private assets
CSP + SameSite + no eval
Upload validation (type, size, magic bytes, Sharp processing)
Rate limiting per endpoint group
Audit logging for all mutations
Argon2id password hashing
No user-controlled paths in storage keys
Final Deployment Model
markdown

Copy code
Main branch merge → GitHub Actions:
  1. Typecheck (tsc --noEmit)
  2. Lint (eslint)
  3. Test (vitest + cargo test)
  4. Build web (next build)
  5. Build API (tsc)
  6. Build WASM (wasm-pack build)
  7. Build texgen-cli Docker image
  8. Push images to ghcr.io
  9. Deploy web → Fly.io (rolling)
  10. Deploy API → Fly.io (rolling)
  11. Deploy worker → Fly.io (rolling)
  12. Run DB migrations (drizzle-kit push)
  13. Smoke test (health checks)
  14. Notify Slack

18. Tasks Codex Can Execute Immediately
Group A: Shared Package (packages/shared)
Create packages/shared/src/types/config.ts with all TextureConfig TypeScript interfaces from Section 3
Create packages/shared/src/schemas/config.schema.ts with Zod validation for TextureConfig
Create packages/shared/src/schemas/api.schema.ts with Zod schemas for all API request/response bodies
Create packages/shared/src/constants/patterns.ts with pattern catalog (type, category, name, defaults, parameter ranges)
Create packages/shared/src/constants/materials.ts with material category definitions and IDs
Create packages/shared/src/constants/limits.ts with plan feature limits (max resolution, quotas, feature flags per plan)
Create packages/shared/src/types/plans.ts with Plan and PlanFeatures interfaces
Write unit tests for all Zod schemas (valid configs, boundary values, invalid values)
Group B: Database & API Scaffolding (packages/api)
Create Drizzle schema (packages/api/src/db/schema.ts) matching Section 9 SQL exactly
Generate initial Drizzle migration from schema
Create database seed script (packages/api/src/db/seed.ts) with test users, plans, 10 sample library materials
Create Fastify app entry point (packages/api/src/server.ts) with CORS, error handling, request logging
Create auth middleware (packages/api/src/middleware/auth.ts) that extracts session from cookie, loads user
Create rate limiting middleware using Upstash Redis sliding window
Create storage service (packages/api/src/lib/storage.ts) with R2 upload/download/signedUrl/delete methods
Implement POST /api/v1/auth/signup endpoint with argon2id hashing
Implement POST /api/v1/auth/login endpoint with session creation in Redis
Implement POST /api/v1/auth/logout endpoint with session deletion
Implement GET /api/v1/auth/session endpoint
Implement GET /api/v1/projects (list, cursor-paginated, owner-only)
Implement POST /api/v1/projects (create with initial version)
Implement GET /api/v1/projects/:id (load with current version config)
Implement PATCH /api/v1/projects/:id/draft (autosave upsert)
Implement POST /api/v1/projects/:id/versions (create new version, update current_version_id)
Implement POST /api/v1/uploads with Sharp validation, EXIF stripping, R2 upload, thumbnail generation
Implement GET /api/v1/library/materials (paginated, filterable by category)
Implement POST /api/v1/exports with plan check, BullMQ job enqueue
Implement GET /api/v1/exports/:id/stream SSE endpoint
Implement BullMQ worker entry