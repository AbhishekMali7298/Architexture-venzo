# Architexture Venzo

Monorepo for a pattern-first material editor inspired by Architextures Create.

## Setup

Requirements:
- Node.js 20+
- `pnpm` 9+

Install workspace dependencies:

```bash
pnpm install
```

Start the web app:

```bash
pnpm --dir packages/web dev
```

Open `http://localhost:3000/create`.

## Commands

From the repo root:

```bash
pnpm --dir packages/web dev
pnpm --dir packages/web typecheck
pnpm --dir packages/web test
pnpm --dir packages/shared test
pnpm typecheck
pnpm test
```

Pattern SVG module regeneration:

```bash
pnpm --dir packages/web generate:pattern-modules
```

## Repo Structure

```text
packages/
  shared/
    src/constants/      Pattern and material catalog data
    src/types/          Shared config and API types
  web/
    app/(app)/create/
      components/       Editor UI, pickers, settings, modals
      engine/           Layout math, canvas rendering, background rendering
      lib/              Sidebar schema, exports, asset helpers, caching
      store/            Zustand editor state and pattern config helpers
    app/api/            Asset and pattern preview routes
    public/patterns/    Downloaded pattern preview SVGs
```

## Architecture Overview

The create editor is built around a few shared layers:

- Pattern catalog in `packages/shared/src/constants/patterns.ts`
- Pattern-aware sidebar semantics in `packages/web/app/(app)/create/lib/pattern-sidebar-schema.ts`
- Layout engine in `packages/web/app/(app)/create/engine/pattern-layouts.ts`
- Shared render geometry helpers in `packages/web/app/(app)/create/engine/render-geometry.ts`
- Canvas preview renderer in `packages/web/app/(app)/create/engine/pattern-renderer.ts`
- Background repeat preview in `packages/web/app/(app)/create/engine/background-renderer.ts`
- Export pipeline in `packages/web/app/(app)/create/lib/project-export.ts`

The editor intentionally supports a mix of:
- procedural layouts for patterns where rows and columns should feel like direct visible repeat counts
- SVG-module layouts for patterns whose geometry is best represented by authored repeat modules

Pattern audit notes live in:
- `packages/web/app/(app)/create/PATTERN_AUDIT.md`

## Testing

Current automated coverage focuses on regression-prone editor logic:

- pattern layout bounds and repeat sizing
- pattern-specific sidebar schema behavior
- preservation of material dimensions when switching patterns

Run:

```bash
pnpm --dir packages/web test
```

## Export Notes

- PNG/JPG export uses the raster canvas renderer.
- SVG export now emits real vector geometry for the pattern repeat instead of embedding a PNG in an SVG wrapper.
- PDF export attempts vector output only for simple solid-fill rectangular geometry; otherwise it falls back to raster PDF output.

## Material Pipeline Notes

- Material asset selection is centralized in `material-assets.ts`.
- Thumbnail and render/original asset resolution now come from the same helper path.
- Image loading keeps the previous successful image visible while the next asset loads to reduce flicker.

## Known Limitations

- Some patterns still rely on assumptions about Architextures semantics and need visual validation against the live site.
- `basketweave` does not yet expose a configurable `weaves` control because the layout engine is still fixed-width.
- Vector PDF export is intentionally conservative and falls back to raster when geometry or fills become too complex.
- The web workspace currently reuses the shared workspace Vitest binary in its test script until Vitest is installed directly in `packages/web`.
