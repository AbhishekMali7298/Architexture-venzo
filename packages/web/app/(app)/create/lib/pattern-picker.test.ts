import { describe, expect, it } from 'vitest';
import { getPatternByType } from '@textura/shared';
import { getAvailablePatterns, patternMatchesSearch } from './pattern-picker';

describe('pattern picker helpers', () => {
  it('includes the none pattern only once and keeps it first', () => {
    const availablePatterns = getAvailablePatterns();
    const nonePatterns = availablePatterns.filter((pattern) => pattern.type === 'none');

    expect(availablePatterns[0]?.type).toBe('none');
    expect(nonePatterns).toHaveLength(1);
  });

  it('matches running bond by its canonical type name', () => {
    const runningBond = getPatternByType('running_bond');
    expect(runningBond).toBeDefined();

    expect(patternMatchesSearch(runningBond!, 'running')).toBe(true);
    expect(patternMatchesSearch(runningBond!, 'running_bond')).toBe(true);
  });

  it('matches patterns by their category label', () => {
    const french = getPatternByType('french');
    expect(french).toBeDefined();

    expect(patternMatchesSearch(french!, 'brick bond')).toBe(true);
  });
});
