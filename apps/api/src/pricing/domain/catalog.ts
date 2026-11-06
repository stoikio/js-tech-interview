import type { CoverageOption } from 'src/core/domain/coverage-option';
import type { PricingRules } from 'src/pricing/domain/pricing-rules';

export type PricingCatalog = {
  turnoverBrackets: { minCents: number; maxCents: number }[];
  coverageLimitsCents: number[];
  deductiblesCents: number[];
  options: CoverageOption[];
};

/** The choices a broker can make on a quote. Factors and loadings stay on the server. */
export function catalogOf(rules: PricingRules): PricingCatalog {
  return {
    // Turnover brackets brokers choose from: one per revenue band.
    turnoverBrackets: rules.revenueBands.map((band, index) => ({
      minCents: index === 0 ? 0 : rules.revenueBands[index - 1].maxAnnualRevenueCents,
      maxCents: band.maxAnnualRevenueCents,
    })),
    coverageLimitsCents: rules.coverageLimits.map((limit) => limit.coverageLimitCents),
    deductiblesCents: rules.deductibles.map((deductible) => deductible.deductibleCents),
    options: rules.optionLoadings.map((loading) => loading.option),
  };
}
