import type { CoverageOption } from 'src/core/domain/coverage-option';

/** The revenue bands, factors and loadings a premium is computed from. Amounts are in cents. */
export type PricingRules = {
  /** Sorted by ascending revenue. The last band sets the maximum eligible revenue. */
  revenueBands: { maxAnnualRevenueCents: number; basePremiumCents: number }[];
  coverageLimits: { coverageLimitCents: number; factor: number }[];
  deductibles: { deductibleCents: number; factor: number }[];
  optionLoadings: { option: CoverageOption; loadingPct: number }[];
};

// Fictional pricing rules.
export const PRICING_RULES: PricingRules = {
  revenueBands: [
    { maxAnnualRevenueCents: 100_000_000, basePremiumCents: 45_000 }, // up to 1M EUR
    { maxAnnualRevenueCents: 500_000_000, basePremiumCents: 90_000 }, // up to 5M EUR
    { maxAnnualRevenueCents: 1_000_000_000, basePremiumCents: 150_000 }, // up to 10M EUR
    { maxAnnualRevenueCents: 2_500_000_000, basePremiumCents: 260_000 }, // up to 25M EUR
    { maxAnnualRevenueCents: 5_000_000_000, basePremiumCents: 420_000 }, // up to 50M EUR
  ],
  coverageLimits: [
    { coverageLimitCents: 25_000_000, factor: 0.7 }, // 250k EUR
    { coverageLimitCents: 50_000_000, factor: 1 }, // 500k EUR
    { coverageLimitCents: 100_000_000, factor: 1.45 }, // 1M EUR
    { coverageLimitCents: 200_000_000, factor: 2.1 }, // 2M EUR
  ],
  deductibles: [
    { deductibleCents: 100_000, factor: 1.15 }, // 1k EUR
    { deductibleCents: 500_000, factor: 1 }, // 5k EUR
    { deductibleCents: 1_000_000, factor: 0.9 }, // 10k EUR
    { deductibleCents: 2_500_000, factor: 0.8 }, // 25k EUR
  ],
  optionLoadings: [
    { option: 'ransomware_extortion', loadingPct: 15 },
    { option: 'social_engineering_fraud', loadingPct: 10 },
    { option: 'business_interruption', loadingPct: 12 },
    { option: 'regulatory_fines', loadingPct: 5 },
  ],
};

export const maxAnnualRevenueCents = (rules: PricingRules): number =>
  rules.revenueBands[rules.revenueBands.length - 1].maxAnnualRevenueCents;
