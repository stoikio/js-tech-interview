import type { PricingCatalog } from './types';

type Bracket = PricingCatalog['turnoverBrackets'][number];

/** The turnover of a form nobody filled in. */
export const NO_TURNOVER_CENTS = 0;

export const TURNOVER_REQUIRED = 'Select a turnover bracket.';

/** The reason a turnover cannot be submitted, or null. */
export const turnoverError = (cents: number): string | null =>
  cents > NO_TURNOVER_CENTS ? null : TURNOVER_REQUIRED;

/**
 * The bracket a turnover falls in. A bracket excludes its lower bound and includes its upper
 * bound, like the revenue bands of the pricing rules: a turnover of exactly 1M EUR is in the
 * bracket that ends at 1M EUR.
 */
export const findBracket = (brackets: Bracket[], turnoverCents: number): Bracket | undefined =>
  brackets.find((bracket) => turnoverCents > bracket.minCents && turnoverCents <= bracket.maxCents);
