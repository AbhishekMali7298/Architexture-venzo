import { IMPRESS_PATTERN_TYPES } from '../app/(app)/create/lib/pattern-capabilities';
import { getPatternByType } from '@textura/shared';
import fs from 'fs';
import path from 'path';

export function runValidation() {
  const results = [];

  for (const type of IMPRESS_PATTERN_TYPES) {
    const definition = getPatternByType(type);
    if (!definition) continue;

    const modulePath = path.join(__dirname, `../app/(app)/create/engine/generated/svg-pattern-modules/modules/${type}.ts`);
    let hasClipPath = false;
    let strokeCount = 0;
    let fillCount = 0;
    let viewBoxWidth = 0;
    let viewBoxHeight = 0;
    let patternWidth = 0;
    let patternHeight = 0;

    if (fs.existsSync(modulePath)) {
      const content = fs.readFileSync(modulePath, 'utf8');
      const vbW = content.match(/"viewBoxWidth":\s*([\d.]+)/);
      const vbH = content.match(/"viewBoxHeight":\s*([\d.]+)/);
      const pW = content.match(/"repeatWidth":\s*([\d.]+)/);
      const pH = content.match(/"repeatHeight":\s*([\d.]+)/);
      
      if (vbW) viewBoxWidth = parseFloat(vbW[1]);
      if (vbH) viewBoxHeight = parseFloat(vbH[1]);
      if (pW) patternWidth = parseFloat(pW[1]);
      if (pH) patternHeight = parseFloat(pH[1]);
      
      hasClipPath = content.includes('"clipPath":');
      strokeCount = (content.match(/"strokes":\s*\[/g) || []).length;
      fillCount = (content.match(/"tiles":\s*\[/g) || []).length;
    } else {
      // Fallback for hardcoded types like venzowood
      patternWidth = definition.defaultUnitWidth;
      patternHeight = definition.defaultUnitHeight;
      viewBoxWidth = patternWidth;
      viewBoxHeight = patternHeight;
    }

    const hJoint = 0;
    const vJoint = 0;
    const tileStepX = patternWidth + hJoint;
    const tileStepY = patternHeight + vJoint;
    
    // Simulating ideal renderer conditions
    const pathBBoxWidth = patternWidth;
    const pathBBoxHeight = patternHeight;
    const scaleX = 1;
    const scaleY = 1;
    
    results.push({
      id: type,
      name: definition.displayName,
      source: definition.previewAssetPath,
      viewBoxWidth,
      viewBoxHeight,
      patternWidth,
      patternHeight,
      hJoint,
      vJoint,
      tileStepX,
      tileStepY,
      pathBBoxWidth,
      pathBBoxHeight,
      scaleX,
      scaleY,
      usesUniformScale: scaleX === scaleY,
      hasClipPath,
      strokeCount,
      fillCount,
      rendererMode: 'SVG'
    });
  }

  console.table(results);
}
