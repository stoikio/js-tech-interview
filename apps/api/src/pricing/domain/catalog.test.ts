import { catalogOf } from 'src/pricing/domain/catalog';
import { PRICING_RULES, type PricingRules } from 'src/pricing/domain/pricing-rules';

describe('catalogOf', () => {
  it('offers one turnover bracket per revenue band, from zero to the maximum', () => {
    const { turnoverBrackets } = catalogOf(PRICING_RULES);

    expect(turnoverBrackets).toEqual([
      { minCents: 0, maxCents: 100_000_000 },
      { minCents: 100_000_000, maxCents: 500_000_000 },
      { minCents: 500_000_000, maxCents: 1_000_000_000 },
      { minCents: 1_000_000_000, maxCents: 2_500_000_000 },
      { minCents: 2_500_000_000, maxCents: 5_000_000_000 },
    ]);
  });

  it('lists the limits, deductibles and options of the rules, without factors or loadings', () => {
    const rules: PricingRules = {
      revenueBands: [{ maxAnnualRevenueCents: 200_000_000, basePremiumCents: 10_000 }],
      coverageLimits: [{ coverageLimitCents: 10_000_000, factor: 2 }],
      deductibles: [{ deductibleCents: 100_000, factor: 0.5 }],
      optionLoadings: [{ option: 'regulatory_fines', loadingPct: 10 }],
    };

    expect(catalogOf(rules)).toEqual({
      turnoverBrackets: [{ minCents: 0, maxCents: 200_000_000 }],
      coverageLimitsCents: [10_000_000],
      deductiblesCents: [100_000],
      options: ['regulatory_fines'],
    });
  });
});
