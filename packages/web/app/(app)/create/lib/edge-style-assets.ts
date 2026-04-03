import type { EdgeStyle } from '@textura/shared';

export interface EdgeProfileData {
  sourceUrl: string;
  samples: number[];
  intrinsicWidth: number;
  intrinsicHeight: number;
}

const EDGE_ASSET_PATHS: Partial<Record<EdgeStyle, string[]>> = {
  parged: [
    'edges/parged/09domr-parged7.png',
    'edges/parged/1f8wl0-parged5.png',
    'edges/parged/2n85p9-parged8.png',
    'edges/parged/6kdoc7-parged11.png',
    'edges/parged/7m1mdz-parged12.png',
    'edges/parged/camrzm-parged9.png',
    'edges/parged/gfgooa-parged10.png',
    'edges/parged/jul8ot-parged4.png',
    'edges/parged/m5b0ms-parged3.png',
  ],
};

export function getEdgeAssetUrls(style: EdgeStyle): string[] {
  return (EDGE_ASSET_PATHS[style] ?? []).map((path) => `/api/assets/${path}`);
}

export function isAssetBackedEdgeStyle(style: EdgeStyle): boolean {
  return getEdgeAssetUrls(style).length > 0;
}
