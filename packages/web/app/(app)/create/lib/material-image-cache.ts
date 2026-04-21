'use client';

import { useEffect, useState } from 'react';

type ImageRecord =
  | { status: 'loading'; promise: Promise<HTMLImageElement>; requestedAt: number }
  | { status: 'loaded'; image: HTMLImageElement; requestedAt: number }
  | { status: 'error'; requestedAt: number };

const imageCache = new Map<string, ImageRecord>();

export function loadMaterialImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);

  if (cached?.status === 'loaded') {
    return Promise.resolve(cached.image);
  }

  if (cached?.status === 'loading') {
    return cached.promise;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      imageCache.set(url, { status: 'loaded', image, requestedAt: Date.now() });
      resolve(image);
    };
    image.onerror = () => {
      imageCache.set(url, { status: 'error', requestedAt: Date.now() });
      reject(new Error(`Failed to load material image: ${url}`));
    };
    image.src = url;
  });

  imageCache.set(url, { status: 'loading', promise, requestedAt: Date.now() });
  return promise;
}

export function useMaterialImage(url: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(() => {
    if (!url) return null;
    const cached = imageCache.get(url);
    return cached?.status === 'loaded' ? cached.image : null;
  });

  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear async cache state when the caller has no image URL.
      setImage(null);
      return;
    }

    const cached = imageCache.get(url);
    if (cached?.status === 'loaded') {
      setImage(cached.image);
      return;
    }

    let cancelled = false;

    // Keep showing the previous successful image while the next one loads.
    // This avoids visible flicker when switching between similar materials.
    loadMaterialImage(url)
      .then((nextImage) => {
        if (!cancelled) {
          setImage(nextImage);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImage(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return image;
}
