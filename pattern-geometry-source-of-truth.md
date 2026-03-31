# Pattern Geometry Source of Truth

Use these two documents together:

1. [architextures-conceptual-pattern-spec.md](./architextures-conceptual-pattern-spec.md)
   - procedural intent
   - abstract geometry rules

2. [architextures-actual-svg-module-reference.md](./architextures-actual-svg-module-reference.md)
   - current runtime geometry
   - actual Architextures-derived SVG module data

Decision rule:
- If the question is "how should this pattern work?", start with the conceptual spec.
- If the question is "what does the app actually render right now?", use the actual SVG module reference.
- If the question is "what does the code use at runtime?", check [packages/web/app/(app)/create/engine/pattern-layouts.ts](./packages/web/app/(app)/create/engine/pattern-layouts.ts).

Current policy:
- SVG-backed module data is the runtime source of truth for active SVG-backed patterns.
- Procedural descriptions are documentation, not evidence of current rendered output.
