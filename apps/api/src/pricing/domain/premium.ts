import type { CoverageOption } from 'src/core/domain/coverage-option';
import { BusinessRuleError } from 'src/core/domain/errors';
import { PricingError } from 'src/pricing/domain/error';
import { maxAnnualRevenueCents, type PricingRules } from 'src/pricing/domain/pricing-rules';

export type PricingInput = {
  annualRevenueCents: number;
  coverageLimitCents: number;
  deductibleCents: number;
  options: CoverageOption[];
};

/**
 * Everything needed to explain a premium. The premium is the sum of the core
 * cover and of every option, each rounded to the cent.
 */
export type PricingBreakdown = {
  annualRevenueCents: number;
  revenueBandMaxCents: number;
  basePremiumCents: number;
  coverageLimitCents: number;
  limitFactor: number;
  deductibleCents: number;
  deductibleFactor: number;
  /** basePremium x limitFactor x deductibleFactor */
  coveragePremiumCents: number;
  optionLoadings: { option: CoverageOption; loadingPct: number; premiumCents: number }[];
  totalLoadingPct: number;
};

export type PricingResult = {
  premiumCents: number;
  breakdown: PricingBreakdown;
};

/**
 * premium = basePremium(revenue) x limitFactor x deductibleFactor x (1 + sum of option loadings)
 *
 * Pure function: no database, no clock, and the pricing rules are an argument.
 * The core cover and each option are rounded to the cent, and the premium is
 * their sum, so the lines of the breakdown always add up to the premium.
 */
export function computePremium(input: PricingInput, rules: PricingRules): PricingResult {
  if (input.annualRevenueCents <= 0) {
    throw new BusinessRuleError(PricingError.InvalidRevenue, 'Annual revenue must be positive');
  }
  const band = rules.revenueBands.find((b) => input.annualRevenueCents <= b.maxAnnualRevenueCents);
  if (!band) {
    const max = new Intl.NumberFormat('en-US').format(maxAnnualRevenueCents(rules) / 100);
    throw new BusinessRuleError(
      PricingError.RevenueNotEligible,
      `Companies with an annual revenue above ${max} EUR are not eligible`,
    );
  }

  const limit = rules.coverageLimits.find((l) => l.coverageLimitCents === input.coverageLimitCents);
  if (!limit) {
    throw new BusinessRuleError(
      PricingError.UnsupportedCoverageLimit,
      `Unsupported coverage limit: ${input.coverageLimitCents}`,
    );
  }

  const deductible = rules.deductibles.find((d) => d.deductibleCents === input.deductibleCents);
  if (!deductible) {
    throw new BusinessRuleError(
      PricingError.UnsupportedDeductible,
      `Unsupported deductible: ${input.deductibleCents}`,
    );
  }

  for (const option of input.options) {
    if (!rules.optionLoadings.some((o) => o.option === option)) {
      throw new BusinessRuleError(PricingError.UnsupportedOption, `Unsupported option: ${option}`);
    }
  }
  const coverage = band.basePremiumCents * limit.factor * deductible.factor;
  const optionLoadings = rules.optionLoadings
    .filter((o) => input.options.includes(o.option))
    .map((o) => ({
      option: o.option,
      loadingPct: o.loadingPct,
      premiumCents: Math.round((coverage * o.loadingPct) / 100),
    }));
  const totalLoadingPct = optionLoadings.reduce((sum, o) => sum + o.loadingPct, 0);
  const coveragePremiumCents = Math.round(coverage);
  const premiumCents = optionLoadings.reduce(
    (sum, o) => sum + o.premiumCents,
    coveragePremiumCents,
  );

  return {
    premiumCents,
    breakdown: {
      annualRevenueCents: input.annualRevenueCents,
      revenueBandMaxCents: band.maxAnnualRevenueCents,
      basePremiumCents: band.basePremiumCents,
      coverageLimitCents: limit.coverageLimitCents,
      limitFactor: limit.factor,
      deductibleCents: deductible.deductibleCents,
      deductibleFactor: deductible.factor,
      coveragePremiumCents,
      optionLoadings,
      totalLoadingPct,
    },
  };
}
