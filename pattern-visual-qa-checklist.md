# Pattern Visual QA Checklist

Use this checklist when verifying `/create` visually after changing pattern math, repeat framing, SVG modules, or rendering.

## Global Smoke Checks

Run these checks for every pattern before doing pattern-specific checks:

- The dotted repeat frame contains a believable canonical repeat, not a random crop.
- No large white voids or clipped half-shapes appear inside the repeat frame unless the pattern is intentionally stroke-only.
- Tiles continue seamlessly outside the dotted repeat frame.
- Joint widths look consistent across horizontal, vertical, and diagonal edges.
- Increasing `Rows` increases the framed repeat vertically.
- Increasing `Columns` increases the framed repeat horizontally.
- Changing material `Width` changes horizontal density in the expected direction.
- Changing material `Height` changes vertical density in the expected direction.
- Switching tint or edge style changes rendering without breaking repeat alignment.
- Horizontal and vertical orientation both keep the same pattern logic.

## Shared Test Inputs

Use these inputs when the pattern supports them:

- Base joints: `5 / 5`
- Zero-joint check: `0 / 0`
- Medium paver: `400 x 100`
- Thin paver: `400 x 10`
- Narrow paver: `300 x 100`
- Small grid: `4 x 2`
- Medium grid: `6 x 4`
- Large grid: `6 x 6`

## Procedural Patterns

### None

- Confirm the field renders as a single uninterrupted surface.
- Confirm rows, columns, and angle do not create a visible repeat grid.

### Running Bond

- Check that course offsets remain stable when `Stretchers` changes.
- Confirm repeat width is based on visible columns, not bleed bricks.
- Verify no cut bricks appear inside the repeat frame unless expected at the edges.

### Stack Bond

- Confirm all vertical joints align in straight columns.
- Verify no hidden row offset appears when rows or columns change.

### Stretcher Bond

- Confirm alternating rows offset by half a unit.
- Verify the bordered repeat still reflects visible rows and columns cleanly.

### Flemish Bond

- Check alternation between stretcher and header bricks stays consistent row to row.
- Verify the repeat frame captures the authored Flemish rhythm instead of clipping a partial cycle.

### Herringbone

- Check both `400 x 100` and `400 x 10`.
- Confirm no diamond or triangular voids appear inside the repeat.
- Verify long diagonal runs meet at clean 90-degree corners.
- Confirm odd/even brick directions alternate consistently across the repeat.

### Chevron

- Check shallow angle and steep angle.
- Verify angle changes repeat height without breaking seam alignment.
- Confirm the bordered repeat starts on the canonical chevron seam.

### Staggered

- Confirm odd rows shift by half a brick.
- Verify the repeat frame does not overcount bleed tiles.

### Basketweave

- Check `Weaves = 1`, `2`, and `3` if exposed.
- Confirm grouped horizontal and vertical bricks alternate by module.
- Verify no module clipping occurs at repeat borders.

## SVG / Authored Module Patterns

These patterns rely on authored geometry plus scaling, so visual failures usually show up as bad scaling, bad repeat framing, or stroke clipping.

### Ashlar

- Confirm varied stone sizes preserve authored proportions when width or height changes.
- Verify repeat framing still looks intentional, not like a random slice through stones.

### Cubic

- Confirm the cube illusion remains coherent and no face is clipped at repeat seams.
- Verify row and column changes add whole authored modules.

### Hexagonal

- Confirm staggered hex alignment remains intact at repeat borders.
- Verify no partial hexes appear inside the bordered repeat unexpectedly.

### Hopscotch

- Confirm the mixed-size rhythm stays balanced as rows and columns grow.
- Verify repeat seams do not cut through a large tile unexpectedly.

### Diamond

- Confirm diamonds meet perfectly at points with no visible drift.
- Verify repeat framing preserves the authored diagonal rhythm.

### Intersecting Circle

- Confirm all arcs remain continuous across repeat seams.
- Verify stroke width stays visually consistent.

### Fishscale

- Confirm scallops align cleanly row to row.
- Verify the explicit fishscale repeat height remains stable when dimensions change.

### French

- Confirm the module preserves the authored multi-piece rhythm.
- Verify large and small pieces stay proportionally correct after scaling.

## High-Risk Regression Cases

Always re-check these after touching layout math or repeat normalization:

- Herringbone `400 x 100`, `6 x 6`, joints `5 / 5`
- Herringbone `400 x 10`, `4 x 2`, joints `5 / 5`
- Chevron low angle and high angle with the same rows and columns
- Basketweave with the largest available weave count
- Any SVG-module pattern after changing repeat bounds or normalization code

## What To Log When Something Looks Wrong

Capture these before changing code:

- Pattern name
- Rows / Columns
- Width / Height
- Joint sizes
- Orientation
- Screenshot with dotted repeat frame visible
- Whether the issue appears in:
  - the framed repeat only
  - the tiled background outside the frame
  - both

## Debugging Heuristics

- If repeat size is wrong but tile shapes look right, inspect repeat semantics and canonical frame logic.
- If repeat size is right but there are white gaps, inspect anchor choice, bleed copies, and normalization offsets.
- If only SVG-module patterns break, inspect module scaling and repeat framing before procedural math.
- If canvas and SVG preview disagree, inspect the draw offsets and clipping path in both renderers.
