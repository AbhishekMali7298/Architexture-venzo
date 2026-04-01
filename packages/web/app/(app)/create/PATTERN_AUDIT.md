# Pattern Audit

This document records the current editor-side pattern strategy for the create flow.

Source of truth in code:
- `packages/web/app/(app)/create/lib/pattern-sidebar-schema.ts`
- `packages/web/app/(app)/create/engine/pattern-layouts.ts`

## Table

| Pattern | Layout source | Rows means | Columns means | Angle meaningful | Extra fields |
| --- | --- | --- | --- | --- | --- |
| `none` | procedural | not used | not used | no | none |
| `stack_bond` | svg-module | repeated stack-bond modules | repeated stack-bond modules | no | none |
| `running_bond` | svg-module | repeated running-bond modules | repeated running-bond modules | no | none |
| `stretcher_bond` | procedural | visible brick courses | visible brick slots before bleed clipping | yes | `stretchers` |
| `flemish_bond` | svg-module | repeated Flemish bond modules | repeated Flemish bond modules | no | none |
| `herringbone` | hybrid | repeated herringbone modules | repeated herringbone modules | yes: `45°` module, `90°` orthogonal fallback | none |
| `chevron` | procedural | visible chevron bands | visible chevron pairs | yes | none |
| `staggered` | svg-module | repeated staggered modules | repeated staggered modules | no | none |
| `ashlar` | svg-module | repeated ashlar modules | repeated ashlar modules | no | none |
| `cubic` | svg-module | repeated cube modules | repeated cube modules | no | none |
| `hexagonal` | svg-module | repeated hexagonal modules | repeated hexagonal modules | no | none |
| `basketweave` | procedural | repeated basket modules | repeated basket modules | no | `weaves` |
| `hopscotch` | svg-module | repeated paving modules | repeated paving modules | no | none |
| `diamond` | svg-module | repeated diamond modules | repeated diamond modules | no | none |
| `intersecting_circle` | svg-module | repeated circular lattice modules | repeated circular lattice modules | no | none |
| `fishscale` | svg-module | repeated fishscale modules | repeated fishscale modules | no | none |
| `french` | svg-module | repeated French bond modules | repeated French bond modules | no | none |

## Notes

- Repeat bounds are now the shared source of truth for the preview border, background tiling, dimensions hint, SVG export, and simple vector PDF export. Bleed geometry is clipped to the repeat in preview and export.
- SVG-module patterns repeat authored modules from `svg-pattern-modules.ts`; the UI describes those controls as module counts where the repeat does not map 1:1 to visible tile counts.
- `basketweave` remains procedural because `weaves` is now a live layout parameter. The geometry is still an approximation of Architextures rather than a direct replay of the authored SVG module.
- `stretcher_bond` remains procedural because `stretchers` is a live layout parameter and the authored SVG module represents only one stagger configuration.
- `herringbone` is hybrid: `45°` uses the authored Architextures module, while `90°` uses the procedural orthogonal layout so the angle control remains truthful.
- `running_bond`, `stack_bond`, `flemish_bond`, `ashlar`, `hexagonal`, and `fishscale` now route through the Architextures-derived SVG module data for closer visual parity.

## Fully Matched

- `none`
- `running_bond`
- `stack_bond`
- `flemish_bond`
- `staggered`
- `ashlar`
- `cubic`
- `hexagonal`
- `hopscotch`
- `diamond`
- `intersecting_circle`
- `fishscale`
- `french`

## Still Approximate

- `stretcher_bond`
  because the live `stretchers` parameter requires procedural offsets and the checked-in SVG module only captures one authored stagger state
- `herringbone`
  because `45°` uses the authored module while `90°` remains a procedural orthogonal fallback
- `chevron`
  because the mitre cut is parameterized by `angle`, so the layout is still procedural rather than a fixed Architextures-authored module replay
- `basketweave`
  because `weaves` is now supported procedurally, but the grouped-brick module is not a direct replay of the authored Architextures basketweave SVG geometry
