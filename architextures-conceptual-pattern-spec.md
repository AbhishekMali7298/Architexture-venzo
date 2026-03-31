# Architextures Conceptual Pattern Spec

This document describes the intended geometric construction rules for common
patterns in a procedural, formula-based way.

This is a conceptual specification:
- it explains the visual and geometric intent of each pattern
- it is useful for procedural implementations
- it is not the same thing as the current SVG-backed runtime data

If you need the actual module geometry currently used by the app, use:
- [architextures-actual-svg-module-reference.md](./architextures-actual-svg-module-reference.md)

If you need the code path that selects runtime geometry, use:
- [packages/web/app/(app)/create/engine/pattern-layouts.ts](./packages/web/app/(app)/create/engine/pattern-layouts.ts)

---

## Source-of-Truth Split

There are now two valid documents in this repo, each for a different purpose:

- Conceptual spec
  - this file
  - use when designing or discussing procedural geometry

- Actual runtime module reference
  - [architextures-actual-svg-module-reference.md](./architextures-actual-svg-module-reference.md)
  - use when describing the SVG-backed geometry the app currently renders

Do not describe the current app as purely procedural unless the SVG-backed
modules have been intentionally replaced.

---

## Core Variables

- `W` = brick/tile width
- `H` = brick/tile height
- `jH` = horizontal joint
- `jV` = vertical joint
- `R` = rows
- `C` = columns

Expected output:
- `tiles = [{ x, y, w, h, rotation }]`
- `repeatW`
- `repeatH`

General rendering rule:
- draw the joint color first
- draw full tiles on top
- clip drawing to the repeat module bounds
- allow negative coordinates and overflow where edge bleed is needed

---

## Active Pattern Intent

### Stack Bond

- Aligned grid
- No row offset
- Repeat is a simple rectangular grid

### Running Bond

- Every other row offset by half a brick step
- Left and right edge bleed are intentional
- Clean half-brick edges should come from clipping, not pre-cut geometry

### Stretcher Bond

- Generalised running bond
- Row offset advances by a fraction of the horizontal step
- Offset repeats over a cycle controlled by `stretchers`

### Flemish Bond

- Alternating stretcher and header within each course
- Adjacent rows shift so headers align relative to stretcher centres

### Herringbone

- Two conceptual modes:
  - orthogonal herringbone
  - diagonal herringbone
- Pieces interlock as mirrored directional units

### Chevron

- V-shaped mirrored mitred pieces
- Module should include edge bleed
- Shape is defined by an angle-controlled mitre cut

### Hexagonal

- Honeycomb layout of clipped hexagons
- Rows or columns are staggered depending on implementation choice
- Joints appear through spacing and clipped corners

### Basketweave

- Alternating groups of parallel bricks
- Neighboring cells flip orientation

### Ashlar

- Coursed stone pattern with variable row heights and variable widths
- Irregularity should remain structured rather than random noise

---

## Use This Document When

- designing a procedural replacement for SVG-backed modules
- reviewing whether a formula captures the intended visual logic
- discussing how a pattern should work in abstract geometry terms

## Do Not Use This Document When

- documenting the current runtime geometry
- auditing exact tile coordinates or clip paths
- comparing the current app against real SVG module data
