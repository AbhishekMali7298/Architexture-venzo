# Pattern Audit

This document records the current editor-side pattern strategy for the create flow.

Source of truth in code:
- `packages/web/app/(app)/create/lib/pattern-sidebar-schema.ts`
- `packages/web/app/(app)/create/engine/pattern-layouts.ts`

## Table

| Pattern | Layout source | Rows means | Columns means | Angle meaningful | Extra fields |
| --- | --- | --- | --- | --- | --- |
| `none` | procedural | not used | not used | no | none |
| `stack_bond` | procedural | visible brick courses | visible brick slots | yes | none |
| `running_bond` | procedural | visible brick courses | visible stretcher slots | yes | none |
| `stretcher_bond` | procedural | visible brick courses | visible brick slots | yes | `stretchers` |
| `flemish_bond` | procedural | visible Flemish courses | alternating half-pair repeat steps | yes | none |
| `herringbone` | svg-module | repeated herringbone modules | repeated herringbone modules | yes | none |
| `chevron` | procedural | visible chevron bands | visible chevron pairs | yes | none |
| `staggered` | svg-module | repeated staggered modules | repeated staggered modules | yes | none |
| `ashlar` | procedural | repeated ashlar bands | repeated ashlar base width modules | no | none |
| `cubic` | svg-module | repeated cube modules | repeated cube modules | no | none |
| `hexagonal` | procedural | repeated hex modules | repeated hex modules | no | none |
| `basketweave` | procedural | repeated basket modules | repeated basket modules | no | none |
| `hopscotch` | svg-module | repeated paving modules | repeated paving modules | no | none |
| `diamond` | svg-module | repeated diamond modules | repeated diamond modules | no | none |
| `intersecting_circle` | svg-module | repeated circular lattice modules | repeated circular lattice modules | no | none |
| `fishscale` | procedural | repeated fishscale bands | repeated fishscale modules | no | none |
| `french` | svg-module | repeated French bond modules | repeated French bond modules | yes | none |

## Notes

- Procedural patterns are intended to keep rows and columns close to visible repeat semantics.
- SVG-module patterns repeat authored modules from `svg-pattern-modules.ts`; rows and columns should be described as module counts in the UI.
- `basketweave` still uses a fixed procedural weave block. The `weaves` parameter is not surfaced until the layout engine supports it.
- `flemish_bond` uses half-pair width semantics to match the current Architextures-style visible repeat behavior.
- `hexagonal` uses a dedicated preview outline so the dotted selection border better matches the repeat silhouette.
- `french`, `staggered`, `cubic`, `hopscotch`, `diamond`, and `intersecting_circle` explicitly route through SVG-module layout in the editor rather than falling back to unrelated procedural logic.
