import type { CoverageOption } from 'src/core/domain/coverage-option';
import type {
  PremiumCalculator,
  PremiumRequest,
  QuotePricing,
} from 'src/distribution/domain/ports/premium-calculator.port';

export type QuoteTerms = {
  coverageLimitCents: number;
  deductibleCents: number;
  options: CoverageOption[];
};

/** Terms of the draft quote created with a new prospect. */
export const DEFAULT_TERMS: QuoteTerms = {
  coverageLimitCents: 50_000_000, // 500k EUR
  deductibleCents: 500_000, // 5k EUR
  options: [],
};

/**
 * Terms with their premium and the turnover that premium assumes. Only `price`
 * builds one, so a quote never stores terms that were not priced, nor
 * options listed twice (pricing counts an option once: the quote and its
 * contract must not show it twice).
 */
export class PricedTerms {
  private constructor(
    readonly annualRevenueCents: number,
    readonly terms: QuoteTerms,
    readonly pricing: QuotePricing,
  ) {}

  /** Throws a BusinessRuleError when the request cannot be priced (see PremiumCalculator). */
  static async price(calculator: PremiumCalculator, request: PremiumRequest): Promise<PricedTerms> {
    const { annualRevenueCents, coverageLimitCents, deductibleCents } = request;
    const terms: QuoteTerms = {
      coverageLimitCents,
      deductibleCents,
      options: [...new Set(request.options)],
    };
    const pricing = await calculator.price({ annualRevenueCents, ...terms });
    return new PricedTerms(annualRevenueCents, terms, pricing);
  }
}
