'use client';

import { useEffect, useState } from 'react';
import type { PatternType } from '@textura/shared';
import {
  SVG_PATTERN_MODULE_LOADERS,
  SVG_PATTERN_MODULE_TYPES,
} from '../engine/generated/svg-pattern-modules/loaders';
import type { SvgPatternModule } from '../engine/generated/svg-pattern-modules/types';

const moduleCache = new Map<PatternType, SvgPatternModule>();
const inFlightCache = new Map<PatternType, Promise<SvgPatternModule | null>>();
const SVG_PATTERN_TYPE_SET = new Set<PatternType>(SVG_PATTERN_MODULE_TYPES);

export function hasSvgPatternModule(patternType: PatternType) {
  return SVG_PATTERN_TYPE_SET.has(patternType);
}

export function getCachedSvgPatternModule(patternType: PatternType): SvgPatternModule | null {
  return moduleCache.get(patternType) ?? null;
}

export function loadSvgPatternModule(patternType: PatternType): Promise<SvgPatternModule | null> {
  const cached = moduleCache.get(patternType);
  if (cached) {
    return Promise.resolve(cached);
  }

  const existingPromise = inFlightCache.get(patternType);
  if (existingPromise) {
    return existingPromise;
  }

  const loader = SVG_PATTERN_MODULE_LOADERS[patternType];
  if (!loader) {
    return Promise.resolve(null);
  }

  const promise = loader()
    .then((module) => {
      moduleCache.set(patternType, module);
      return module;
    })
    .finally(() => {
      inFlightCache.delete(patternType);
    });

  inFlightCache.set(patternType, promise);
  return promise;
}

export function primeSvgPatternModule(patternType: PatternType) {
  void loadSvgPatternModule(patternType);
}

export function useSvgPatternModule(patternType: PatternType) {
  const [module, setModule] = useState<SvgPatternModule | null>(() =>
    getCachedSvgPatternModule(patternType),
  );

  useEffect(() => {
    if (!hasSvgPatternModule(patternType)) {
      setModule(null);
      return;
    }

    const cached = getCachedSvgPatternModule(patternType);
    if (cached) {
      setModule(cached);
      return;
    }

    let cancelled = false;

    loadSvgPatternModule(patternType).then((nextModule) => {
      if (!cancelled) {
        setModule(nextModule);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [patternType]);

  return module;
}
