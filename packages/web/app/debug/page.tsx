import React from 'react';
import { getPatternByType, TextureConfig } from '@textura/shared';
import { getPatternLayout } from '../(app)/create/lib/pattern-layout';
import { getSvgPatternModule } from '../(app)/create/engine/generated/svg-pattern-modules/loaders';

const PATTERNS_TO_TEST = [
  'venzowood_2',
  'venzowood_3',
  'boho_pattern',
  'rhombus_pattern',
  'matrix_pattern',
  'fibra_pattern',
  'weave_pattern_2',
  'grate_pattern_2',
];

function createTestConfig(type: string, hJoint: number, vJoint: number): TextureConfig {
  return {
    id: 'test',
    name: 'test',
    pattern: {
      type: type as any,
      rows: 2,
      columns: 2,
    },
    joints: {
      horizontalSize: hJoint,
      verticalSize: vJoint,
      materialSource: { type: 'solid', color: '#000' },
      linkedDimensions: false,
    },
    materials: [
      {
        id: 'mat',
        width: 400,
        height: 400,
        source: { type: 'solid', color: '#fff' },
        rotation: 0,
      },
    ],
    output: {
      widthPx: 1000,
      heightPx: 1000,
      resolutionDpi: 300,
      scaleMode: 'proportional',
    },
    seed: 0,
  };
}

export default async function DebugPage() {
  const results = await Promise.all(
    PATTERNS_TO_TEST.map(async (type) => {
      let module = null;
      try {
        module = await getSvgPatternModule(type as any);
      } catch (e) {
        // Ignored
      }
      
      const configZero = createTestConfig(type, 0, 0);
      const layoutZero = getPatternLayout(configZero, module);
      
      const configNeg = createTestConfig(type, -10, -10);
      const layoutNeg = getPatternLayout(configNeg, module);

      return {
        type,
        zero: {
          totalWidth: layoutZero.totalWidth,
          totalHeight: layoutZero.totalHeight,
          tileCount: layoutZero.tiles.length,
          strokeCount: layoutZero.strokes.length,
        },
        neg: {
          totalWidth: layoutNeg.totalWidth,
          totalHeight: layoutNeg.totalHeight,
          tileCount: layoutNeg.tiles.length,
          strokeCount: layoutNeg.strokes.length,
        }
      };
    })
  );

  return (
    <div style={{ padding: 40, color: 'white', background: '#222', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1>Impress Pattern Regression Test</h1>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #555', padding: 8 }}>Pattern</th>
            <th style={{ borderBottom: '1px solid #555', padding: 8 }}>0 Joint WxH</th>
            <th style={{ borderBottom: '1px solid #555', padding: 8 }}>-10 Joint WxH</th>
            <th style={{ borderBottom: '1px solid #555', padding: 8 }}>Geom Count</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.type}>
              <td style={{ borderBottom: '1px solid #444', padding: 8 }}>{r.type}</td>
              <td style={{ borderBottom: '1px solid #444', padding: 8 }}>{r.zero.totalWidth.toFixed(1)} x {r.zero.totalHeight.toFixed(1)}</td>
              <td style={{ borderBottom: '1px solid #444', padding: 8 }}>{r.neg.totalWidth.toFixed(1)} x {r.neg.totalHeight.toFixed(1)}</td>
              <td style={{ borderBottom: '1px solid #444', padding: 8 }}>T: {r.zero.tileCount}, S: {r.zero.strokeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
