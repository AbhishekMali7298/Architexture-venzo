'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EdgeStyle } from '@textura/shared';
import { loadMaterialImage } from './material-image-cache';
import { getEdgeAssetUrls, type EdgeProfileData } from './edge-style-assets';

const edgeProfileCache = new Map<string, EdgeProfileData | Promise<EdgeProfileData>>();

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function smoothSamples(samples: number[]) {
  return samples.map((_, index) => {
    const window = samples.slice(Math.max(0, index - 2), Math.min(samples.length, index + 3));
    return average(window);
  });
}

function sampleProfileFromImage(image: HTMLImageElement): number[] {
  const canvas = document.createElement('canvas');
  const width = Math.max(1, image.naturalWidth || image.width || 1);
  const height = Math.max(1, image.naturalHeight || image.height || 1);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new Array(64).fill(0);
  }

  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const firstOpaque: number[] = [];
  const lastOpaque: number[] = [];
  const threshold = 12;

  for (let x = 0; x < width; x++) {
    let first = -1;
    let last = -1;
    for (let y = 0; y < height; y++) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 0;
      if (alpha > threshold) {
        if (first === -1) first = y;
        last = y;
      }
    }

    firstOpaque.push(first === -1 ? 0 : first);
    lastOpaque.push(last === -1 ? height - 1 : last);
  }

  const firstRange = Math.max(...firstOpaque) - Math.min(...firstOpaque);
  const lastRange = Math.max(...lastOpaque) - Math.min(...lastOpaque);
  const contour = lastRange > firstRange ? lastOpaque : firstOpaque;
  const min = Math.min(...contour);
  const max = Math.max(...contour);
  const amplitude = Math.max(max - min, 1);

  return smoothSamples(contour.map((value) => (value - min) / amplitude));
}

async function loadEdgeProfile(url: string): Promise<EdgeProfileData> {
  const cached = edgeProfileCache.get(url);
  if (cached instanceof Promise) return cached;
  if (cached) return cached;

  const pending = loadMaterialImage(url).then((image) => {
    const profile = {
      sourceUrl: url,
      samples: sampleProfileFromImage(image),
      intrinsicWidth: Math.max(1, image.naturalWidth || image.width || 1),
      intrinsicHeight: Math.max(1, image.naturalHeight || image.height || 1),
    };
    edgeProfileCache.set(url, profile);
    return profile;
  });

  edgeProfileCache.set(url, pending);
  return pending;
}

export async function resolveEdgeProfiles(style: EdgeStyle): Promise<EdgeProfileData[] | null> {
  const urls = getEdgeAssetUrls(style);
  if (!urls.length) return null;
  return Promise.all(urls.map((url) => loadEdgeProfile(url)));
}

export function useEdgeProfiles(style: EdgeStyle): EdgeProfileData[] | null {
  const urls = useMemo(() => getEdgeAssetUrls(style), [style]);
  const [profiles, setProfiles] = useState<EdgeProfileData[] | null>(null);

  useEffect(() => {
    if (!urls.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear async cache state when no edge assets apply.
      setProfiles(null);
      return;
    }

    let cancelled = false;

    Promise.all(urls.map((url) => loadEdgeProfile(url)))
      .then((nextProfiles) => {
        if (!cancelled) {
          setProfiles(nextProfiles);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfiles(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [urls]);

  return profiles;
}
