'use client';

import { useEffect, useState } from 'react';

type ImageRecord =
  | { status: 'loading'; promise: Promise<HTMLImageElement> }
  | { status: 'loaded'; image: HTMLImageElement }
  | { status: 'error' };

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
      imageCache.set(url, { status: 'loaded', image });
      resolve(image);
    };
    image.onerror = () => {
      imageCache.set(url, { status: 'error' });
      reject(new Error(`Failed to load material image: ${url}`));
    };
    image.src = url;
  });

  imageCache.set(url, { status: 'loading', promise });
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
      setImage(null);
      return;
    }

    const cached = imageCache.get(url);
    if (cached?.status === 'loaded') {
      setImage(cached.image);
      return;
    }

    let cancelled = false;

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
