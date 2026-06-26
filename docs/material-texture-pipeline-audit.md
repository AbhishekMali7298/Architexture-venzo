# Material Texture Pipeline Audit And Redesign Report

## Scope

This report audits the current texture rendering pipeline for the create editor, identifies the causes of visible repetition, and proposes a backwards-compatible redesign that adds automatic preprocessing, seamless tiling, stochastic variation, deterministic randomness, and export-safe caching.

No runtime code was changed as part of this audit.

## 1. Current Architecture

### High-level flow

Current preview and raster export flow:

1. `TextureConfig` stores pattern parameters, material source, joint source, output size, and a global seed in [packages/shared/src/types/config.ts](../packages/shared/src/types/config.ts).
2. The editor updates `config.pattern.rows` and `config.pattern.columns` directly in Zustand via [packages/web/app/(app)/create/store/editor-store.ts](../packages/web/app/(app)/create/store/editor-store.ts).
3. The create page resolves the active material and pattern state, then mounts `BackgroundCanvas` in [packages/web/app/(app)/create/page.tsx](../packages/web/app/(app)/create/page.tsx).
4. `BackgroundCanvas` resolves a renderable material URL and joint URL using `getMaterialRenderableImageUrl()` / `getMaterialSourceRenderableImageUrl()` and loads them through `useMaterialImage()` in [packages/web/app/(app)/create/components/background-canvas.tsx](../packages/web/app/(app)/create/components/background-canvas.tsx).
5. `useMaterialImage()` caches raw `HTMLImageElement` objects keyed only by URL in [packages/web/app/(app)/create/lib/material-image-cache.ts](../packages/web/app/(app)/create/lib/material-image-cache.ts).
6. The preview renderer calls `renderBackground()` or `renderEmbossBackground()` in [packages/web/app/(app)/create/engine/background-renderer.ts](../packages/web/app/(app)/create/engine/background-renderer.ts).
7. Raster exports call `renderToCanvas()` in [packages/web/app/(app)/create/engine/material-renderer.ts](../packages/web/app/(app)/create/engine/material-renderer.ts) through [packages/web/app/(app)/create/lib/project-export.ts](../packages/web/app/(app)/create/lib/project-export.ts).
8. Vector exports embed the same source image as an SVG `<pattern>` in [packages/web/app/(app)/create/lib/vector-export.ts](../packages/web/app/(app)/create/lib/vector-export.ts).

### Current material loading

- Material asset resolution lives in [packages/web/app/(app)/create/lib/material-assets.ts](../packages/web/app/(app)/create/lib/material-assets.ts).
- For `source.type === 'image'`, the render asset is passed through directly.
- For `source.type === 'upload'`, the current helper does not resolve an uploaded render asset; it falls back to definition assets if present.
- There is no preprocessing layer, derived asset layer, or metadata describing seamlessness, lighting quality, or tileability.

### Current UV / texture placement behavior

- Texture placement is not true UV mapping. The system creates a repeated 2D canvas pattern from the source image in `createMaterialPattern()` at [packages/web/app/(app)/create/engine/material-fill.ts](../packages/web/app/(app)/create/engine/material-fill.ts).
- `pattern.setTransform()` uses a single `imageDrawBox` transform to scale and translate the repeating source image.
- Every filled tile or stroke then samples from that same repeated pattern space.
- In practice, the whole editor uses one shared texture field per material layer, not per-tile randomized sampling.

### Current row / column handling

- User row and column counts are written in [packages/web/app/(app)/create/store/editor-store.ts](../packages/web/app/(app)/create/store/editor-store.ts).
- Geometry generation happens in `getPatternLayout()` at [packages/web/app/(app)/create/lib/pattern-layout.ts](../packages/web/app/(app)/create/lib/pattern-layout.ts).
- `getPatternLayout()` selects a pattern generator, builds tile polygons and strokes, and returns `totalWidth`, `totalHeight`, `contentWidth`, and `contentHeight`.
- Renderers derive `baseWidth` and `baseHeight` by dividing `layout.totalWidth` by `columns` and `layout.totalHeight` by `rows`.

### Current canvas rendering

- Preview canvas setup happens in `BackgroundCanvas` and repaints the full viewport on each relevant state change.
- `renderBackground()` and `renderEmbossBackground()` calculate preview bounds, scale, and a `worldImageDrawBox`.
- `fillMaterialSurface()` clips tile polygons and fills them by drawing the same repeating source image pattern.
- `renderSheetPreview()` repeats the whole module across rows and columns for sheet mode, but still uses the same material pattern transform for every repeat.
- `material-renderer.ts` does the same for raster export.

### Current export flow

- PNG/JPG/PDF raster exports render through the same repeated canvas path in [packages/web/app/(app)/create/lib/project-export.ts](../packages/web/app/(app)/create/lib/project-export.ts).
- SVG export embeds one repeated material pattern in [packages/web/app/(app)/create/lib/vector-export.ts](../packages/web/app/(app)/create/lib/vector-export.ts).
- DXF export is vector geometry only and does not solve material repetition.
- Placeholder bump and roughness maps are synthetic gradients, not derived from the actual material.

### Important exact touchpoints

- Material source of truth: `TextureConfig` in `packages/shared/src/types/config.ts:7-24`, `:60-105`
- Row/column edits: `packages/web/app/(app)/create/store/editor-store.ts:536-557`
- Preview image loading: `packages/web/app/(app)/create/components/background-canvas.tsx:35-43`
- Raw image cache: `packages/web/app/(app)/create/lib/material-image-cache.ts:10-39`
- Repeat-pattern creation: `packages/web/app/(app)/create/engine/material-fill.ts:66-99`
- Pattern fill application: `packages/web/app/(app)/create/engine/material-fill.ts:122-201`
- Sheet preview repetition: `packages/web/app/(app)/create/engine/background-renderer.ts:178-266`
- Raster export repetition: `packages/web/app/(app)/create/engine/material-renderer.ts:84-142`, `:177-203`
- SVG material pattern embedding: `packages/web/app/(app)/create/lib/vector-export.ts:160-180`

## 2. Problems Found

### Problem A: Identical source image repetition

The renderer repeats the exact same bitmap with no variant generation.

Why it happens:

- `createMaterialPattern()` creates one `CanvasPattern` from one source image.
- All tiles sample that same pattern space.
- There is no tile-specific crop, per-tile transform, or variant selection.

Result:

- repeated grain
- repeated knots
- repeated defects
- repeated brightness clusters
- repeated saturation clusters
- obvious banding when rows/columns increase

### Problem B: Shared world-space alignment across tiles

The renderer uses one `worldImageDrawBox` for entire preview/export passes.

Why it happens:

- `background-renderer.ts` and `material-renderer.ts` compute a single `worldImageDrawBox`.
- That box is reused for all tile fills and all repeated module instances.
- Even when a shape is clipped differently, it samples the same underlying repeated image transform.

Result:

- visual lockstep across adjacent tiles
- seams line up in predictable columns/rows
- pattern repetition becomes more obvious at larger repeat counts

### Problem C: No seamlessness generation

The pipeline assumes the source image is already tileable.

Why it happens:

- no offset-seam analysis
- no edge blending
- no quilting / synthesis
- no border repair
- no gradient-domain solve

Result:

- visible seams at repeat boundaries
- horizontal and vertical banding
- edge brightness jumps
- cut-off veins or grain streaks

### Problem D: Baked lighting is preserved and amplified

Uploaded or library images may contain captured shadows, highlights, and directional lighting.

Why it happens:

- there is no lighting analysis stage
- no low-frequency illumination separation
- no shadow detection mask
- no exposure flattening

Result:

- repeated shadows
- repeated hot spots
- directional lighting repeating every tile
- fake-looking shading once the pattern is repeated

### Problem E: No histogram or color normalization

The renderer uses the source bitmap as-is.

Why it happens:

- current image adjustments are manual UI-side color tweaks only
- there is no automatic albedo normalization pass
- no luminance range conditioning
- no saturation stabilization

Result:

- patches with different global tone tile badly
- seam transitions become more obvious
- repeated contrast islands draw the eye

### Problem F: No stochastic variation

There is currently no per-tile variation model.

Why it happens:

- no seeded tile hash
- no per-tile transform synthesis
- no multi-variant atlas
- no subtle parameter jitter

Result:

- AAAA / AAAA / AAAA repetition signature
- eye catches motif recurrence quickly
- large fields look synthetic

### Problem G: Deterministic seed is underused

The config has a `seed`, but it is not driving texture variation.

Why it happens:

- `config.seed` participates in tile edge rendering, not in bitmap sample diversification
- material fills do not derive tile-local randomness from `(seed, row, column, tileIndex)`

Result:

- no stable stochasticity
- no opportunity for repeat-safe variation without flicker

### Problem H: Preview and export are coupled to raw source images

Exports bypass any chance to use higher-quality derived material assets.

Why it happens:

- `project-export.ts` reloads raw images and renders them directly
- `vector-export.ts` embeds the same raw image directly into SVG

Result:

- any visible repetition in preview survives into exports
- future preprocessing cannot be preview-only; it must be shared across all outputs

### Problem I: Current caching is too shallow

The cache stores only original decoded images.

Why it happens:

- `material-image-cache.ts` caches `HTMLImageElement` by URL
- no cache keys for preprocessing options, quality tier, output scale, seamless variants, or analysis results

Result:

- expensive future image processing would rerun too often unless architecture changes
- no worker/offscreen ownership model exists yet

### Problem J: Vector export cannot support advanced stochastic fills as-is

SVG export currently assumes one reusable repeated pattern.

Why it happens:

- one embedded `<pattern>` is used as the fill source
- no atlas, no per-tile pattern indirection, no raster fallback for advanced materials

Result:

- advanced seamless stochastic materials would diverge from current SVG output if not redesigned carefully

## 3. Root Causes

### Root cause summary

1. The engine treats the source bitmap as final albedo instead of raw capture data.
2. Texture mapping is a single repeated pattern transform, not a tile-sampling system.
3. There is no material preprocessing stage between asset load and render.
4. There is no derived-material cache shared between preview and export.
5. Deterministic randomness exists in config but not in texture sampling.
6. Vector export assumes pattern reuse, which blocks more advanced stochastic material rendering unless explicitly redesigned.

## 4. Proposed Rendering Pipeline

### Target pipeline

Upload or library material
-> asset decode and metadata capture
-> quality validation
-> lighting and shadow analysis
-> albedo normalization
-> seamless tile generation
-> variant atlas synthesis
-> deterministic stochastic sampler
-> pattern rendering
-> export

### Proposed stages

#### Stage 1: Asset decode and metadata capture

Input:

- original asset URL or blob

Output:

- decoded `ImageBitmap`
- intrinsic width/height
- color space summary
- coarse material statistics

Notes:

- Prefer `createImageBitmap()` for decoded runtime assets.
- Preserve original asset as immutable source.

#### Stage 2: Quality validation

Compute:

- resolution adequacy
- edge mismatch score
- illumination asymmetry
- highlight clipping
- shadow strength
- repetition risk score
- directional grain estimate

Output:

- warnings such as:
  - material contains strong lighting
  - texture is not seamless
  - texture resolution is too low
  - texture contains visible shadows

#### Stage 3: Lighting and shadow analysis

Goal:

- separate low-frequency illumination from high-frequency material detail

Suggested approach:

- work in linear RGB or Lab
- estimate illumination field using large-radius blur / guided filter / rolling guidance filter
- compute reflectance approximation by dividing or subtracting low-frequency field
- detect strong shadow/highlight masks from luminance residuals

Output:

- normalized diffuse-like albedo candidate
- shadow mask
- directional light confidence

#### Stage 4: Color and exposure normalization

Goal:

- flatten exposure and reduce global tone drift without destroying grain

Suggested approach:

- luminance remap around robust percentiles
- mild local contrast preservation
- saturation clamping in Lab/HSV
- optional gray-world or shades-of-gray white balance correction

Important:

- avoid aggressive histogram equalization on the final texture; use constrained normalization, not “photo filter” behavior

#### Stage 5: Seamless tile generation

Goal:

- generate a tileable base material with no visible border seams

Recommended algorithm stack:

1. Offset the normalized albedo by half width/height.
2. Detect seam conflict energy in the central cross.
3. Repair seams using patch-based quilting with minimum-error boundary cuts.
4. Finish with gradient-domain or multiband blending to remove luminance discontinuities.
5. Reproject back to original edge continuity and revalidate seam score.

Reasoning:

- pure feathering is too soft
- pure Poisson can smear structured grain
- quilting preserves wood/marble/stone character better
- a hybrid quilting + gradient-domain finish is a strong quality/performance compromise

#### Stage 6: Texture variant generation

Goal:

- create multiple near-identical but non-identical variants for stochastic use

Recommended output:

- base seamless tile
- 6 to 12 derived variants

Variant operations:

- crop jitter within safe overlap bounds
- small exposure perturbation
- small saturation perturbation
- small contrast perturbation
- micro hue offset
- optional flip
- optional 180 rotation for isotropic materials
- optional 90 rotation only when material anisotropy classifier allows it

Important:

- wood grain usually should not receive arbitrary 90 degree rotation
- stone / terrazzo / concrete can allow more transform freedom

#### Stage 7: Deterministic stochastic sampler

Goal:

- map each logical tile to a stable variant and transform without flicker

Sampling inputs:

- `config.seed`
- tile logical row
- tile logical column
- tile index within module
- pattern repeat phase index

Sampling outputs per tile:

- variant index
- UV offset
- brightness delta within +-2 percent
- saturation delta within +-2 percent
- hue delta within +-1 percent
- contrast delta within +-2 percent
- roughness delta
- normal intensity delta
- optional flipX / flipY
- optional rotation class

Implementation note:

- use a fast deterministic integer hash, for example xxhash-style or mulberry/hash-combine style logic
- never use `Math.random()` in render paths

#### Stage 8: Pattern rendering

Replace “shared repeating canvas pattern” with “tile-local sample transform”.

New render concept:

- each tile still uses current geometry and emboss
- fill source becomes a sampled variant atlas or offscreen seamless bitmap
- each tile receives its own transform matrix derived from seeded randomness
- preview and export share the same sampler rules

#### Stage 9: Export

Preview, PNG, JPG, PDF:

- use the same preprocessed derived material pipeline

SVG:

- keep current vector geometry
- for simple materials, optionally emit pattern fills
- for stochastic advanced materials, add a rasterized material layer under vector strokes/emboss overlays or tile-specific clipped image defs

DXF:

- unchanged geometry export

## 5. Algorithms To Use

### Best-fit recommendation

For this product, I recommend:

1. Illumination flattening via low-frequency reflectance separation.
2. Seam synthesis via minimum-error quilting on offset seams.
3. Seam cleanup via multiband or gradient-domain blending.
4. Multi-variant atlas generation from the seamless base.
5. Deterministic tile hashing for transform and variant selection.

### Why this combination

- Better than simple edge feathering for structured grain.
- Safer than fully procedural synthesis for user-provided materials.
- Preserves the recognizable character of the uploaded source.
- Scales to realtime preview because synthesis can be cached offline per material.

### Approaches considered

#### Offset seam generation only

- too weak by itself
- good as a diagnostic and preparation step

#### Edge blending only

- fastest
- lowest quality
- tends to blur wood grain and marble veining

#### Poisson blending only

- good for luminance continuity
- insufficient alone for strongly structured texture seams

#### Patch-based synthesis / image quilting

- best balance for natural materials
- preserves stochastic structure
- very suitable here

#### Full texture synthesis

- highest ceiling
- highest complexity and performance cost
- probably overkill for phase 1 unless current material quality is extremely poor

## 6. Performance Considerations

### Requirements

The runtime must stay smooth even with `100 x 100` logical tiles.

### Strategy

Do not preprocess per frame.

Instead:

1. Decode once.
2. Analyze once per source asset.
3. Generate seamless base once per preprocessing recipe.
4. Generate variant atlas once per recipe.
5. Reuse cached `ImageBitmap` or `OffscreenCanvas`.
6. Render tiles using lightweight seeded transform lookups.

### Recommended caches

#### Asset cache

Key:

- raw asset URL or content fingerprint

Value:

- decoded `ImageBitmap`
- source metadata

#### Analysis cache

Key:

- asset fingerprint + analysis version

Value:

- quality metrics
- warnings
- anisotropy classification
- seam scores

#### Derived material cache

Key:

- asset fingerprint + preprocessing recipe version

Value:

- normalized albedo
- seamless base
- variant atlas
- optional derived roughness/normal helpers

#### Tile transform cache

Key:

- `(seed, pattern type, rows, columns, tile index, repeat phase)`

Value:

- variant selection and transform params

### Runtime optimizations

- Move preprocessing into a worker.
- Use `OffscreenCanvas` when available.
- Store final derived outputs as `ImageBitmap`.
- Avoid recreating canvas patterns for every tile when a variant atlas can be drawn by `drawImage` with transforms.
- Keep overlay and emboss caching already present, but make it material-aware.

### Practical note on current 100 x 100 requirement

True `10,000` tile rendering with many clip paths on the main thread will still be expensive if each tile is redrawn every interaction. To stay smooth:

- cache the material field separately from strokes/emboss
- avoid recomputing tile transforms when only zoom/export size changes
- consider rasterizing repeating pattern modules into chunks for preview mode

## 7. Files To Modify

### Existing files very likely to change

- [packages/shared/src/types/config.ts](../packages/shared/src/types/config.ts)
  - add derived material metadata references and warning fields in a backwards-compatible way
- [packages/web/app/(app)/create/lib/material-assets.ts](../packages/web/app/(app)/create/lib/material-assets.ts)
  - resolve original asset vs derived render asset vs export asset
- [packages/web/app/(app)/create/lib/material-image-cache.ts](../packages/web/app/(app)/create/lib/material-image-cache.ts)
  - upgrade from raw image cache to decoded/derived material cache
- [packages/web/app/(app)/create/engine/material-fill.ts](../packages/web/app/(app)/create/engine/material-fill.ts)
  - replace shared repeat pattern assumption with sampled tile transforms
- [packages/web/app/(app)/create/engine/background-renderer.ts](../packages/web/app/(app)/create/engine/background-renderer.ts)
  - consume derived materials and deterministic tile transforms
- [packages/web/app/(app)/create/engine/material-renderer.ts](../packages/web/app/(app)/create/engine/material-renderer.ts)
  - mirror the new runtime for raster export
- [packages/web/app/(app)/create/lib/project-export.ts](../packages/web/app/(app)/create/lib/project-export.ts)
  - ensure exports use the same processed materials
- [packages/web/app/(app)/create/lib/vector-export.ts](../packages/web/app/(app)/create/lib/vector-export.ts)
  - define compatibility path for advanced stochastic materials
- [packages/web/app/(app)/create/components/background-canvas.tsx](../packages/web/app/(app)/create/components/background-canvas.tsx)
  - initiate async preprocessing state and warning display
- [packages/web/app/(app)/create/page.tsx](../packages/web/app/(app)/create/page.tsx)
  - surface warnings and future upload/preprocess controls

### New files/modules recommended

- `packages/web/app/(app)/create/lib/material-analysis.ts`
- `packages/web/app/(app)/create/lib/material-preprocess-worker.ts`
- `packages/web/app/(app)/create/lib/material-derived-cache.ts`
- `packages/web/app/(app)/create/lib/material-variant-atlas.ts`
- `packages/web/app/(app)/create/lib/tile-random.ts`
- `packages/web/app/(app)/create/lib/material-seamless.ts`
- `packages/web/app/(app)/create/lib/material-quality.ts`

## 8. Risks

### Risk 1: Over-normalization

If lighting removal is too aggressive, wood and stone can look flat or synthetic.

Mitigation:

- preserve mid/high-frequency detail
- use gentle normalization
- keep source and processed previews comparable during development

### Risk 2: Seam repair can blur grain

If blend windows are too wide, natural detail softens.

Mitigation:

- prefer quilting with minimum-error cuts over naive feathering
- use multiband finishing sparingly

### Risk 3: SVG parity

Advanced stochastic fills are harder to express in clean vector form.

Mitigation:

- preserve current SVG path for basic materials
- allow raster-underlay fallback for advanced preprocessed materials

### Risk 4: Cache invalidation complexity

Derived materials depend on source asset, preprocessing version, and material class.

Mitigation:

- version all cache recipes explicitly
- keep cache keys deterministic and serializable

### Risk 5: Browser memory pressure

Multiple variants and atlases can consume significant memory.

Mitigation:

- cap atlas resolution
- evict least recently used derived assets
- generate preview-tier and export-tier derivatives separately

### Risk 6: Backwards compatibility

Existing saved configs do not include preprocessing metadata.

Mitigation:

- default missing metadata to “raw material, preprocess lazily”
- keep the old source field valid

## 9. Migration Plan

### Phase A: Architecture without behavior break

Add derived material types and cache interfaces without changing current rendering results.

### Phase B: Shared preprocessing foundation

Implement asset decode, analysis, and warning generation behind feature flags or compatibility wrappers.

### Phase C: Seamless base generation

Generate one cached seamless material per source and verify parity in preview and export.

### Phase D: Deterministic stochastic sampling

Introduce per-tile stable transforms and subtle variant selection while preserving current geometry and emboss.

### Phase E: Export parity

Switch raster exports to the same derived pipeline and add SVG fallback strategy for advanced materials.

### Phase F: PBR integration

Use processed albedo and material statistics to improve roughness/normal variation later without breaking current placeholder maps.

## 10. Step-by-step Implementation Plan

### Step 1

Introduce a shared derived-material model and cache layer.

Deliverables:

- source fingerprinting
- decoded bitmap cache
- derived material cache API

### Step 2

Add non-destructive material analysis and warning generation.

Deliverables:

- lighting score
- seam score
- resolution score
- anisotropy score
- UI warning badges/messages

### Step 3

Implement preprocessing pipeline for normalized albedo generation.

Deliverables:

- low-frequency illumination removal
- exposure normalization
- saturation normalization
- output comparison tests

### Step 4

Implement seamless tile generation.

Deliverables:

- offset seam analyzer
- quilting seam repair
- blending finish pass
- seam score regression tests

### Step 5

Implement variant atlas synthesis.

Deliverables:

- 6 to 12 subtle variants
- material-class-aware transform rules
- atlas cache

### Step 6

Implement deterministic tile hashing and transform sampling.

Deliverables:

- stable hash utility
- per-tile transform generation
- no-flicker preview verification

### Step 7

Refactor preview renderer to use derived materials instead of a single repeated pattern.

Deliverables:

- tile-local sampling path
- preserved emboss rendering
- preserved pattern geometry

### Step 8

Refactor raster exports to use the same derived pipeline.

Deliverables:

- PNG/JPG/PDF parity with preview
- deterministic reproducibility

### Step 9

Implement SVG compatibility strategy.

Deliverables:

- simple mode: reusable pattern fill
- advanced mode: raster material layer + vector overlays, or tile-specific image defs if file size is acceptable

### Step 10

Add performance hardening.

Deliverables:

- worker preprocessing
- offscreen render caches
- atlas LRU
- preview chunking if needed

## 11. Recommended First Implementation Slice

The safest first implementation slice is:

1. material analysis and warnings
2. derived material cache
3. seamless base generation
4. raster preview/export parity

That sequence solves the biggest quality problem early while limiting compatibility risk.

## 12. Key Compatibility Requirements

The redesign should explicitly preserve:

- current pattern layout generation
- current rows/columns behavior
- current emboss visuals
- current editor UI state model
- current export entry points
- existing saved project configs

What should change is only the material sampling backend and the addition of warnings/derived assets.

## 13. Final Verdict

The visible repetition is not a small rendering bug. It is the natural result of the current architecture, which repeats one unprocessed bitmap through a single shared pattern transform across all tiles and exports.

The correct fix is to insert a derived-material pipeline between source asset loading and rendering, then switch tile filling from identical repeat sampling to deterministic stochastic sampling over seamless, normalized variants.

That can be done without breaking current geometry, emboss, or editor workflows, but it should be implemented in phases rather than as a one-line canvas tweak.
