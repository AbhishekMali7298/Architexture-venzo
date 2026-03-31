# Architextures Actual SVG Module Reference

This document records the actual pattern module data currently used by this repo
for SVG-backed patterns.

Source of truth:
- [packages/web/app/(app)/create/engine/generated/svg-pattern-modules.ts](./packages/web/app/(app)/create/engine/generated/svg-pattern-modules.ts)
- [packages/web/app/(app)/create/engine/pattern-layouts.ts](./packages/web/app/(app)/create/engine/pattern-layouts.ts)

Important notes:
- This is not an idealised geometric spec.
- This is not based on fallback procedural layout code.
- This reflects the Architextures-derived SVG module data that the app actually
  uses first at runtime.
- Coordinates below are module-local SVG coordinates before runtime scaling.
- Most modules include bleed tiles with negative coordinates or tiles extending
  beyond the module bounds. That is intentional.

---

## Runtime Rule

For any pattern that has SVG module data, the app uses that module as the
layout source of truth.

Runtime path:
- `getPatternLayout()` checks `SVG_PATTERN_MODULES[config.pattern.type]`
- if a module exists and has usable geometry, it is repeated as a tiled module
- procedural fallback layouts are only used when SVG module data is missing or empty

Relevant code:
- [packages/web/app/(app)/create/engine/pattern-layouts.ts](./packages/web/app/(app)/create/engine/pattern-layouts.ts)

---

## 1. Running Bond

Actual module data:
- `viewBoxWidth = 300`
- `viewBoxHeight = 400`
- `referenceTileWidth = 225`
- `referenceTileHeight = 100`
- `tileCount = 12`

Observed structure:
- The module is built from explicit rectangle placements, not a generated
  row/column loop.
- Tiles include both full-width and half-width rectangles.
- Bleed is present on all sides.

Representative tiles:
- `(x=-76, y=-51, w=150, h=100)`
- `(x=74,  y=-51, w=150, h=100)`
- `(x=-1,  y=49,  w=300, h=100)`
- `(x=299, y=49,  w=300, h=100)`
- `(x=-151, y=149, w=300, h=100)`
- `(x=-1,   y=249, w=300, h=100)`

Interpretation:
- This behaves like running bond visually.
- But the actual module is encoded as a handcrafted set of rectangles with
  built-in edge bleed rather than a direct `stepX / stepY` formula.

---

## 2. Stack Bond

Actual module data:
- `viewBoxWidth = 300`
- `viewBoxHeight = 100`
- `referenceTileWidth = 1`
- `referenceTileHeight = 1`
- `tileCount = 0`

Interpretation:
- There is currently no usable actual SVG geometry for `stack_bond` in the
  generated module file.
- If we refuse fallback logic, this pattern is effectively missing as actual
  SVG-backed data in the current repo state.

---

## 3. Stretcher Bond

Actual module data:
- `viewBoxWidth = 300`
- `viewBoxHeight = 200`
- `referenceTileWidth = 300`
- `referenceTileHeight = 100`
- `tileCount = 6`

Observed structure:
- Every tile is a rectangle with a full rectangular clip path.
- The module uses explicit horizontal offsets rather than computed per-row
  formulas stored in the data.

Representative tiles:
- `(x=-191, y=-51, w=300, h=100)`
- `(x=109,  y=-51, w=300, h=100)`
- `(x=-41,  y=49,  w=300, h=100)`
- `(x=259,  y=49,  w=300, h=100)`
- `(x=-191, y=149, w=300, h=100)`
- `(x=109,  y=149, w=300, h=100)`

Interpretation:
- The module represents a staggered stretcher layout with explicit bleed.
- The actual geometry is module-authored data, not a symbolic `stretchers`
  formula.

---

## 4. Flemish Bond

Actual module data:
- `viewBoxWidth = 450`
- `viewBoxHeight = 200`
- `referenceTileWidth = 150`
- `referenceTileHeight = 100`
- `tileCount = 9`

Observed structure:
- The module mixes:
  - stretcher-like rectangles: `300 x 100`
  - header-like rectangles: `150 x 100`
- Placements are explicit and include bleed.

Representative tiles:
- `(x=-126, y=49,  w=300, h=100)`
- `(x=99,   y=-51, w=300, h=100)`
- `(x=174,  y=49,  w=150, h=100)`
- `(x=-51,  y=-51, w=150, h=100)`
- `(x=324,  y=49,  w=300, h=100)`
- `(x=99,   y=149, w=300, h=100)`

Interpretation:
- This is a real authored repeat module for Flemish bond.
- It should not be described as a simple alternating pair loop unless we are
  explicitly talking about visual intent rather than actual data.

---

## 5. Herringbone

Actual module data:
- `viewBoxWidth = 410`
- `viewBoxHeight = 260`
- `referenceTileWidth = 270`
- `referenceTileHeight = 270`
- `tileCount = 12`

Observed structure:
- Tiles are large square bounding boxes with polygon clip paths.
- The visible herringbone pieces are not plain rotated rectangles in the data.
- The module includes heavy bleed beyond the view box.

Representative tiles:
- Tile A:
  - `(x=-116, y=-255, w=270, h=270)`
  - clip path:
    - `(0,205)`
    - `(205,0)`
    - `(270,65)`
    - `(65,270)`
- Tile B:
  - `(x=89, y=-190, w=270, h=270)`
  - clip path:
    - `(205,270)`
    - `(0,65)`
    - `(65,0)`
    - `(270,205)`

Interpretation:
- The actual module is polygon-driven diagonal geometry.
- The herringbone effect comes from clipped quadrilateral pieces inside square
  bounds, not directly from rectangle rotation metadata in the SVG module data.

---

## 6. Chevron

Actual module data:
- `viewBoxWidth = 420`
- `viewBoxHeight = 200`
- `referenceTileWidth = 210`
- `referenceTileHeight = 221.2`
- `tileCount = 12`

Observed structure:
- The module is built from mirrored mitred pieces.
- Each piece is a polygon inside a `210 x 221.2` bounding box.
- Bleed exists above, below, left, and right of the nominal module area.

Representative left-hand piece:
- bounds: `(x=-51, y=-72, w=210, h=221.2)`
- clip path:
  - `(36.8,100)`
  - `(210,0)`
  - `(210,100)`
  - `(0,221.2)`
  - `(0,121.2)`

Representative right-hand piece:
- bounds: `(x=159, y=-72, w=210, h=221.2)`
- clip path:
  - `(0,0)`
  - `(173.2,100)`
  - `(210,121.2)`
  - `(210,221.2)`
  - `(0,100)`

Interpretation:
- This is close in spirit to a procedural chevron description.
- But the actual authored data is a specific polygon module, not a generic
  formula.

---

## 7. Hexagonal

Actual module data:
- `viewBoxWidth = 346`
- `viewBoxHeight = 600`
- `referenceTileWidth = 346.4`
- `referenceTileHeight = 400`
- `tileCount = 6`

Observed structure:
- The visible hexagons are hexagonal clip paths inside large rectangular bounds.
- The module appears arranged as staggered vertical columns of hexagons with
  bleed tiles above and below.

Representative tile:
- bounds: `(x=-214, y=-151, w=346.4, h=400)`
- clip path:
  - `(0,100)`
  - `(173.2,0)`
  - `(346.4,100)`
  - `(346.4,300)`
  - `(173.2,400)`
  - `(0,300)`

Other placements:
- `(x=-40.8, y=149,  w=346.4, h=400)`
- `(x=132,   y=-151, w=346.4, h=400)`
- `(x=305.2, y=149,  w=346.4, h=400)`
- `(x=-214,  y=449,  w=346.4, h=400)`
- `(x=132,   y=449,  w=346.4, h=400)`

Interpretation:
- The actual module should be described as a specific 6-tile staggered hex
  repeat cell, not as a simple abstract hex grid formula.

---

## 8. Basketweave

Actual module data:
- `viewBoxWidth = 600`
- `viewBoxHeight = 600`
- `referenceTileWidth = 300`
- `referenceTileHeight = 100`
- `tileCount = 21`

Observed structure:
- The module is much larger than a simple 2x2 conceptual weave cell.
- All visible pieces are rectangles with rectangular clip paths.
- The authored module uses explicit placements and bleed tiles.

Representative tiles:
- `(x=-50, y=-51, w=300, h=100)`
- `(x=-50, y=49,  w=300, h=100)`
- `(x=-50, y=149, w=300, h=100)`
- `(x=250, y=249, w=300, h=100)`
- `(x=250, y=349, w=300, h=100)`
- `(x=250, y=449, w=300, h=100)`

Interpretation:
- The visual idea is basketweave, but the actual repeat unit is a larger
  handcrafted module with 21 tiles.

---

## 9. Ashlar

Actual module data:
- `viewBoxWidth = 900`
- `viewBoxHeight = 560`
- `referenceTileWidth = 301.7`
- `referenceTileHeight = 150`
- `tileCount = 18`

Observed structure:
- The module uses multiple stone sizes and row heights.
- Tiles are explicit rectangles with explicit widths and heights.
- Bleed exists on the left and top edges.

Representative tiles:
- `(x=-147,   y=-50, w=300,   h=150)`
- `(x=603,    y=-50, w=150,   h=150)`
- `(x=240,    y=100, w=450,   h=190)`
- `(x=-205.7, y=390, w=301.7, h=120)`
- `(x=96,     y=390, w=351,   h=120)`
- `(x=447,    y=390, w=247.3, h=120)`

Interpretation:
- This is genuinely close to the expected idea of coursed ashlar with varied
  stone dimensions.
- But the exact proportions should be taken from the authored module values,
  not from a guessed factor set.

---

## Rendering Implications

For SVG-backed patterns, the real repeat logic is:
- repeat one authored module of `viewBoxWidth x viewBoxHeight`
- scale that module using:
  - `scale = min(materialWidth / referenceTileWidth, materialHeight / referenceTileHeight)`
- draw every tile from the module with its own explicit bounds and clip path
- clip the whole repeated module at draw time

Relevant code:
- [packages/web/app/(app)/create/engine/pattern-layouts.ts](./packages/web/app/(app)/create/engine/pattern-layouts.ts)
- [packages/web/app/(app)/create/engine/background-renderer.ts](./packages/web/app/(app)/create/engine/background-renderer.ts)
- [packages/web/app/(app)/create/engine/pattern-renderer.ts](./packages/web/app/(app)/create/engine/pattern-renderer.ts)

---

## Recommended Source-of-Truth Policy

If the goal is accuracy to the current Architextures-derived runtime behavior:
- use SVG module data as the canonical geometry source
- treat procedural pattern descriptions as optional conceptual documentation only
- do not mix procedural formulas into “actual geometry” documentation unless the
  SVG module is absent

If the goal is a clean procedural system instead:
- first document where the actual SVG geometry differs
- then intentionally replace the SVG-backed modules with procedural layouts
- do not describe the current runtime as procedural until that migration is done
