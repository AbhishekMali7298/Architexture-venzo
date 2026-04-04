# Pattern Audit

This document records the current editor-side pattern strategy for the create flow.

Source of truth in code:
- `packages/web/app/(app)/create/lib/pattern-repeat-semantics.ts`
- `packages/web/app/(app)/create/lib/pattern-sidebar-schema.ts`
- `packages/web/app/(app)/create/engine/pattern-layouts.ts`

## Table

| Pattern | Layout source | Rows means | Columns means | Angle meaningful | Extra fields |
| --- | --- | --- | --- | --- | --- |
| `none` | procedural | not used | not used | no | none |
| `stack_bond` | svg-module | repeated stack-bond modules | repeated stack-bond modules | no | none |
| `running_bond` | svg-module | repeated running-bond modules | repeated running-bond modules | no | none |
| `stretcher_bond` | procedural | visible brick courses | visible brick slots before bleed clipping | yes | `stretchers` |
| `flemish_bond` | svg-module | authored Flemish repeat modules | authored Flemish repeat modules | no | none |
| `herringbone` | hybrid | repeated herringbone modules | repeated herringbone modules | yes: `45°` module, `90°` orthogonal fallback | none |
| `chevron` | procedural | visible chevron bands | visible chevron half-arms | yes: live mitre angle and projected vertical spacing | none |
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

- Repeat bounds are now resolved through `pattern-repeat-semantics.ts`, which gives the create page, preview frame, background tiling, SVG export, and simple vector PDF export a single repeat contract for cleaned-up patterns.
- SVG-module patterns repeat authored modules from `svg-pattern-modules.ts`; the UI describes those controls as module counts where the repeat does not map 1:1 to visible tile counts.
- `flemish_bond` now explicitly treats one row/column as one authored repeat module, and its dimensions hint and dashed frame are both derived from the same authored repeat size.
- `chevron` is procedural again because the live Architextures Chevron changes shape continuously with `angle`; the static thumbnail SVG is not the actual render geometry.
- Chevron now uses visible row and column counts directly, and its vertical repeat pitch projects horizontal joint spacing along the sloped mitre so the bordered frame height tracks the live site more closely.
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
  because the procedural geometry now tracks the live angle/count behavior, but we have not yet verified every edge case of the original renderer’s joint shading at extreme angles
- `basketweave`
  because `weaves` is now supported procedurally, but the grouped-brick module is not a direct replay of the authored Architextures basketweave SVG geometry

## Semantics Cleanup Still To Apply

- `herringbone`
  because the 90-degree fallback still owns its repeat contract in layout code instead of the shared semantics layer
- `basketweave`
  because the `weaves`-driven module sizing is still defined procedurally in the layout function
- `stretcher_bond`
  because the visible-repeat semantics and stagger-cycle sizing are still coupled directly to the procedural layout

## Chevron Recommendation

- Keep Chevron on the procedural path unless we obtain the original live renderer’s angle-aware chevron generation code.
- Preserve the current angle-aware vertical pitch formula, because it matches the live frame height and visible band count much better than the static SVG-module approach.
