import type { QuoteTerms } from 'src/distribution/domain/quote/quote-terms';

export type PremiumRequest = QuoteTerms & { annualRevenueCents: number };

/** A premium and what explains it. The breakdown is only stored and displayed here. */
export type QuotePricing = {
  premiumCents: number;
  breakdown: Record<string, unknown>;
};

/**
 * Implemented by the pricing context. Every adapter keeps these promises (see
 * tests/contracts/premium-calculator.contract.ts): a premium is a whole number
 * of cents, and a request that cannot be priced is a BusinessRuleError.
 */
export abstract class PremiumCalculator {
  /** Throws a BusinessRuleError when the request cannot be priced (not eligible). */
  abstract price(request: PremiumRequest): Promise<QuotePricing>;
}
