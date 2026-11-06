import { describe, expect, it } from 'vitest';

import { findBracket, NO_TURNOVER_CENTS, TURNOVER_REQUIRED, turnoverError } from './turnover';

const brackets = [
  { minCents: 0, maxCents: 100_000_000 },
  { minCents: 100_000_000, maxCents: 500_000_000 },
];

describe('findBracket', () => {
  it('includes the upper bound of a bracket', () => {
    expect(findBracket(brackets, 100_000_000)).toBe(brackets[0]);
    expect(findBracket(brackets, 500_000_000)).toBe(brackets[1]);
  });

  it('excludes the lower bound, which belongs to the bracket below', () => {
    expect(findBracket(brackets, 100_000_001)).toBe(brackets[1]);
    expect(findBracket(brackets, 1)).toBe(brackets[0]);
  });

  it('finds no bracket for no turnover or a turnover above the highest bracket', () => {
    expect(findBracket(brackets, NO_TURNOVER_CENTS)).toBeUndefined();
    expect(findBracket(brackets, 500_000_001)).toBeUndefined();
  });

  it('finds no bracket when the catalog has none yet', () => {
    expect(findBracket([], 100_000_000)).toBeUndefined();
  });
});

describe('turnoverError', () => {
  it('asks for a bracket when there is no turnover', () => {
    expect(turnoverError(NO_TURNOVER_CENTS)).toBe(TURNOVER_REQUIRED);
  });

  it('accepts any positive turnover', () => {
    expect(turnoverError(100_000_000)).toBeNull();
  });
});
