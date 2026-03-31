# Pattern Row/Column Truth Table

This document records how `rows` and `columns` behave in the current app.

It is a codebase-facing source of truth for:
- whether a pattern uses `grid` or `module` row/column semantics
- how the dimensions hint is derived
- whether the visible preview count maps directly to UI row/column values

Primary references:
- [packages/shared/src/constants/patterns.ts](./packages/shared/src/constants/patterns.ts)
- [packages/web/app/(app)/create/engine/pattern-layouts.ts](./packages/web/app/(app)/create/engine/pattern-layouts.ts)
- [packages/web/app/(app)/create/page.tsx](./packages/web/app/(app)/create/page.tsx)
- [packages/web/app/(app)/create/engine/background-renderer.ts](./packages/web/app/(app)/create/engine/background-renderer.ts)

---

## Core Rule

The dimensions hint shown in the sidebar comes from:
- `getPatternLayout(config)`
- then `Math.round(layout.totalWidth)` and `Math.round(layout.totalHeight)`

So the displayed `W × H mm` is always the computed repeat module size from the
current runtime layout engine.

---

## Modes

There are two row/column modes in the current app:

- `grid`
  - rows and columns are treated as direct visible repeat counts for the pattern
  - used by simple bond patterns
  - bypasses SVG module layout

- `module`
  - rows and columns repeat a pre-authored or pattern-specific module
  - visible shapes inside that module may not map 1:1 to the UI counts
  - used by complex SVG-backed or multi-shape patterns

---

## Grid Mode Formula

For `grid` patterns, `totalWidth` and `totalHeight` come from the procedural
layout for that pattern.

Typical simple-bond sizing:
- `stepX = material.width + joints.verticalSize`
- `stepY = material.height + joints.horizontalSize`
- `totalWidth = columns * stepX`
- `totalHeight = rows * stepY`

Notes:
- Some grid patterns include bleed tiles for seam handling.
- Bleed tiles do not change the user-facing total repeat size.
- Visible count usually matches the user's expectation more closely here.

---

## Module Mode Formula

For `module` patterns backed by SVG module data:

- `scale = min(material.width / referenceTileWidth, material.height / referenceTileHeight)`
- `moduleWidth = viewBoxWidth * scale`
- `moduleHeight = viewBoxHeight * scale`
- `totalWidth = columns * moduleWidth`
- `totalHeight = rows * moduleHeight`

Notes:
- Rows and columns repeat modules, not directly visible tile cells.
- A module may contain multiple shapes, bleed geometry, strokes, or clip-path pieces.

---

## Pattern Table

| Pattern | Mode | Current size basis | Rows/Cols meaning | Direct visible count? |
|---|---|---|---|---|
| `stack_bond` | `grid` | procedural grid spacing | visible rows and columns in one repeat | mostly yes |
| `running_bond` | `grid` | procedural grid spacing with row offset | visible courses and units per repeat | mostly yes |
| `stretcher_bond` | `grid` | procedural offset spacing | visible courses and units per repeat | mostly yes |
| `flemish_bond` | `grid` | procedural alternating widths | rows = visible courses, cols = pair-like repeat count | partly |
| `staggered` | `grid` | procedural grid-style behavior | visible repeat counts | mostly yes |
| `french` | `grid` | procedural fallback logic | visible repeat counts | partly |
| `herringbone` | `module` | SVG module scaling | module repeat count | no |
| `chevron` | `module` | SVG/module geometry or module-style layout | module repeat count | no |
| `ashlar` | `module` | SVG module scaling | module repeat count | no |
| `cubic` | `module` | SVG module scaling | module repeat count | no |
| `hexagonal` | `module` | SVG module scaling | module repeat count | no |
| `basketweave` | `module` | SVG module scaling | module repeat count | no |
| `hopscotch` | `module` | SVG stroke/module scaling | module repeat count | no |
| `diamond` | `module` | SVG stroke/module scaling | module repeat count | no |
| `intersecting_circle` | `module` | SVG stroke/module scaling | module repeat count | no |
| `fishscale` | `module` | SVG stroke/module scaling | module repeat count | no |

---

## Examples

### Example: `stretcher_bond`

Inputs:
- `rows = 6`
- `columns = 4`
- `width = 400`
- `height = 400`
- `jointV = 5`
- `jointH = 5`

Procedural basis:
- `stepX = 405`
- `stepY = 405`
- `totalWidth = 4 * 405 = 1620`
- `totalHeight = 6 * 405 = 2430`

This aligns with the visible-count mental model.

### Example: `herringbone`

Inputs:
- `rows = 6`
- `columns = 4`
- `width = 400`
- `height = 100`

Current SVG module values:
- `viewBoxWidth = 410`
- `viewBoxHeight = 260`
- `referenceTileWidth = 270`
- `referenceTileHeight = 270`

Derived:
- `scale = min(400 / 270, 100 / 270) = 0.37037...`
- `moduleWidth = 410 * scale = 151.85...`
- `moduleHeight = 260 * scale = 96.30...`
- `totalWidth = 4 * 151.85... = 607.41...`
- `totalHeight = 6 * 96.30... = 577.78...`

This does not match a simple visible-tile-count mental model.

---

## Background Tiling

The dotted border represents one repeat module.

That repeat module is tiled manually in the canvas background renderer:
- find the aligned starting tile
- loop `x += tileSetWidth`
- loop `y += tileSetHeight`
- draw the same module repeatedly

So:
- the bordered rectangle is one repeat unit
- the background is many copies of that same repeat unit

---

## Practical Guidance

Use `grid` mode when:
- users should be able to count rows and columns directly
- the pattern is structurally simple
- one repeat unit should feel like a direct grid

Use `module` mode when:
- the pattern is authored as a multi-shape repeat module
- the visible geometry is clip-path based or stroke based
- the pattern cannot honestly map `rows × columns` to visible cell counts

---

## Important Caution

Do not assume that all patterns should behave like `stack_bond`.

If the goal is UI consistency:
- either convert more patterns from `module` to `grid`
- or explicitly communicate that some patterns use module repeat counts

The current app intentionally mixes both behaviors.
