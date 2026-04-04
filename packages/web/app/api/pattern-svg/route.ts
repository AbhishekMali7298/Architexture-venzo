import { getPatternByType } from '@textura/shared';
import type { TextureConfig } from '@textura/shared';
import { computePatternRenderFrame, buildTilePathData, polygonPathData } from '../../(app)/create/engine/render-geometry';
import { DEFAULT_TEXTURE_CONFIG } from '../../(app)/create/store/defaults';

function svgNum(value: number) {
  return Number.isFinite(value) ? Number.parseFloat(value.toFixed(3)) : 0;
}

function escapeAttr(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function buildConfig(params: URLSearchParams): TextureConfig {
  const patternType = params.get('pattern') ?? 'running_bond';
  const def = getPatternByType(patternType);

  const rows = Math.max(1, parseInt(params.get('rows') ?? String(def?.defaults.rows ?? 6), 10));
  const columns = Math.max(1, parseInt(params.get('columns') ?? String(def?.defaults.columns ?? 4), 10));
  const tileWidth = Math.max(1, parseInt(params.get('w') ?? String(def?.defaultUnitWidth ?? 400), 10));
  const tileHeight = Math.max(1, parseInt(params.get('h') ?? String(def?.defaultUnitHeight ?? 100), 10));
  const hJoint = Math.max(0, parseInt(params.get('hj') ?? '5', 10));
  const vJoint = Math.max(0, parseInt(params.get('vj') ?? '5', 10));
  const angle = parseInt(params.get('angle') ?? String(def?.defaults.angle ?? 0), 10);
  const stretchers = Math.max(1, parseInt(params.get('stretchers') ?? String(def?.defaults.stretchers ?? 1), 10));
  const weaves = Math.max(1, parseInt(params.get('weaves') ?? String(def?.defaults.weaves ?? 1), 10));
  const orientation = (params.get('orientation') ?? 'horizontal') as 'horizontal' | 'vertical';

  const baseMaterial = DEFAULT_TEXTURE_CONFIG.materials[0]!;

  return {
    ...DEFAULT_TEXTURE_CONFIG,
    pattern: {
      type: patternType,
      category: def?.category ?? 'brick_bond',
      orientation,
      rows,
      columns,
      angle,
      stretchers,
      weaves,
    },
    materials: [
      {
        ...baseMaterial,
        definitionId: null,
        source: { type: 'solid', color: '#c8cfcd' },
        width: tileWidth,
        height: tileHeight,
        edges: {
          ...baseMaterial.edges,
          style: 'none',
        },
      },
    ],
    joints: {
      ...DEFAULT_TEXTURE_CONFIG.joints,
      horizontalSize: hJoint,
      verticalSize: vJoint,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const svgWidth = Math.max(50, parseInt(searchParams.get('svgWidth') ?? '300', 10));
  const svgHeight = Math.max(50, parseInt(searchParams.get('svgHeight') ?? '300', 10));
  const tileColor = escapeAttr(searchParams.get('tileColor') ?? '#c8cfcd');
  const jointColor = escapeAttr(searchParams.get('jointColor') ?? '#ffffff');
  const strokeColor = escapeAttr(searchParams.get('strokeColor') ?? jointColor);

  let config: TextureConfig;
  try {
    config = buildConfig(searchParams);
  } catch {
    return new Response('Invalid pattern config', { status: 400 });
  }

  let frame: ReturnType<typeof computePatternRenderFrame>;
  try {
    frame = computePatternRenderFrame(config, svgWidth, svgHeight);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pattern generation failed';
    return new Response(message, { status: 500 });
  }

  const { layout, repeatWidth, repeatHeight, scale, offsetX, offsetY, drawOffsetX, drawOffsetY, verticalOrientation } = frame;

  const frameTransform = verticalOrientation
    ? `translate(${svgNum(offsetX + repeatWidth * scale)} ${svgNum(offsetY)}) rotate(90)`
    : `translate(${svgNum(offsetX)} ${svgNum(offsetY)})`;

  const tileMarkup: string[] = [];
  for (const tile of layout.tiles) {
    const tilePath = buildTilePathData(tile, config, scale);
    const translateX = svgNum(drawOffsetX + tile.x * scale);
    const translateY = svgNum(drawOffsetY + tile.y * scale);
    const rotate =
      tile.rotation !== 0
        ? ` rotate(${svgNum(tile.rotation)} ${svgNum((tile.width * scale) / 2)} ${svgNum((tile.height * scale) / 2)})`
        : '';
    tileMarkup.push(
      `<g transform="translate(${translateX} ${translateY})${rotate}"><path d="${tilePath}" fill="${tileColor}" /></g>`,
    );
  }

  const strokeMarkup = layout.strokes
    .map((stroke) => {
      const scaledPoints = stroke.points.map((point) => ({
        x: drawOffsetX + point.x * scale,
        y: drawOffsetY + point.y * scale,
      }));
      const pathData = stroke.closed
        ? polygonPathData(scaledPoints)
        : scaledPoints
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${svgNum(point.x)} ${svgNum(point.y)}`)
            .join(' ');
      const lineWidth = stroke.width
        ? Math.max(1, stroke.width * scale)
        : Math.max(1, ((config.joints.horizontalSize + config.joints.verticalSize) / 2) * scale);
      return `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${svgNum(lineWidth)}" stroke-linejoin="round" stroke-linecap="round" />`;
    })
    .join('');

  const rw = svgNum(repeatWidth * scale);
  const rh = svgNum(repeatHeight * scale);
  const rx = svgNum(offsetX);
  const ry = svgNum(offsetY);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`,
    `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${jointColor}" />`,
    `<defs><clipPath id="rc"><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" /></clipPath></defs>`,
    `<g clip-path="url(#rc)"><g transform="${frameTransform}">${tileMarkup.join('')}${strokeMarkup}</g></g>`,
    '</svg>',
  ].join('');

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
