import type { CoverageOption } from 'src/core/domain/coverage-option';
import { BusinessRuleError } from 'src/core/domain/errors';
import { computePremium, type PricingInput } from 'src/pricing/domain/premium';
import { PRICING_RULES, type PricingRules } from 'src/pricing/domain/pricing-rules';

const baseInput: PricingInput = {
  annualRevenueCents: 500_000_000, // 5M EUR: base premium 900 EUR
  coverageLimitCents: 50_000_000, // factor 1
  deductibleCents: 500_000, // factor 1
  options: [],
};

const compute = (input: PricingInput) => computePremium(input, PRICING_RULES);

const premiumFor = (input: Partial<PricingInput>) =>
  compute({ ...baseInput, ...input }).premiumCents;

describe('computePremium', () => {
  it('prices with the rules it is given', () => {
    const rules: PricingRules = {
      revenueBands: [{ maxAnnualRevenueCents: 200_000_000, basePremiumCents: 10_000 }],
      coverageLimits: [{ coverageLimitCents: 10_000_000, factor: 2 }],
      deductibles: [{ deductibleCents: 100_000, factor: 0.5 }],
      optionLoadings: [{ option: 'regulatory_fines', loadingPct: 10 }],
    };
    const input: PricingInput = {
      annualRevenueCents: 150_000_000,
      coverageLimitCents: 10_000_000,
      deductibleCents: 100_000,
      options: ['regulatory_fines'],
    };

    const { premiumCents, breakdown } = computePremium(input, rules);

    // 100 EUR x 2 x 0.5 = 100 EUR, plus 10% of it
    expect(breakdown.basePremiumCents).toBe(10_000);
    expect(premiumCents).toBe(10_000 + 1_000);
    expect(() => computePremium({ ...input, coverageLimitCents: 50_000_000 }, rules)).toThrow(
      BusinessRuleError,
    );
  });

  it('multiplies the base premium by every factor', () => {
    const result = compute({
      annualRevenueCents: 500_000_000,
      coverageLimitCents: 100_000_000,
      deductibleCents: 1_000_000,
      options: ['social_engineering_fraud', 'business_interruption'],
    });

    // 900 EUR x 1.45 x 0.9 = 1,174.50 EUR, plus 10% and 12% of it
    expect(result.premiumCents).toBe(117_450 + 11_745 + 14_094);
  });

  it('returns a breakdown with the inputs and every factor', () => {
    const { breakdown } = compute({
      ...baseInput,
      coverageLimitCents: 200_000_000,
      deductibleCents: 2_500_000,
      options: ['business_interruption'],
    });

    expect(breakdown).toEqual({
      annualRevenueCents: 500_000_000,
      revenueBandMaxCents: 500_000_000,
      basePremiumCents: 90_000,
      coverageLimitCents: 200_000_000,
      limitFactor: 2.1,
      deductibleCents: 2_500_000,
      deductibleFactor: 0.8,
      coveragePremiumCents: 151_200, // 900 EUR x 2.1 x 0.8
      optionLoadings: [{ option: 'business_interruption', loadingPct: 12, premiumCents: 18_144 }],
      totalLoadingPct: 12,
    });
  });

  it('makes the premium the sum of the core cover and of each option, to the cent', () => {
    const { premiumCents, breakdown } = compute({
      ...baseInput,
      coverageLimitCents: 25_000_000,
      deductibleCents: 1_000_000,
      options: ['ransomware_extortion', 'social_engineering_fraud'],
    });

    // Core cover: 900 EUR x 0.7 x 0.9 = 567 EUR. Options: 15% = 85.05 EUR, 10% = 56.70 EUR.
    expect(breakdown.coveragePremiumCents).toBe(56_700);
    expect(breakdown.optionLoadings.map((o) => o.premiumCents)).toEqual([8_505, 5_670]);
    expect(premiumCents).toBe(56_700 + 8_505 + 5_670);
  });

  it('rounds each line to the cent', () => {
    // 450 EUR x 0.7 x 1.15 = 362.25 EUR, although 0.7 x 1.15 is not exact in floating point.
    // Regulatory fines: 5% of it is 18.1125 EUR.
    expect(
      premiumFor({
        annualRevenueCents: 100_000_000,
        coverageLimitCents: 25_000_000,
        deductibleCents: 100_000,
        options: ['regulatory_fines'],
      }),
    ).toBe(36_225 + 1_811);
  });

  describe('revenue bands', () => {
    it('uses the band whose upper bound includes the revenue', () => {
      expect(premiumFor({ annualRevenueCents: 1 })).toBe(45_000);
      expect(premiumFor({ annualRevenueCents: 100_000_000 })).toBe(45_000);
      expect(premiumFor({ annualRevenueCents: 100_000_001 })).toBe(90_000);
      expect(premiumFor({ annualRevenueCents: 4_900_000_000 })).toBe(420_000);
    });

    it('accepts a revenue equal to the maximum eligible revenue', () => {
      expect(premiumFor({ annualRevenueCents: 5_000_000_000 })).toBe(420_000);
    });

    it('rejects a revenue above the maximum eligible revenue', () => {
      expect(() => premiumFor({ annualRevenueCents: 5_000_000_001 })).toThrow(
        new BusinessRuleError(
          'pricing.revenueNotEligible',
          'Companies with an annual revenue above 50,000,000 EUR are not eligible',
        ),
      );
    });

    it('rejects a revenue that is not positive', () => {
      expect(() => premiumFor({ annualRevenueCents: 0 })).toThrow(BusinessRuleError);
      expect(() => premiumFor({ annualRevenueCents: -100 })).toThrow(BusinessRuleError);
    });
  });

  describe('coverage limit', () => {
    it('costs more as the limit goes up', () => {
      const premiums = [25_000_000, 50_000_000, 100_000_000, 200_000_000].map(
        (coverageLimitCents) => premiumFor({ coverageLimitCents }),
      );
      expect(premiums).toEqual([63_000, 90_000, 130_500, 189_000]);
    });

    it('rejects a limit that is not offered', () => {
      expect(() => premiumFor({ coverageLimitCents: 75_000_000 })).toThrow(BusinessRuleError);
    });
  });

  describe('deductible', () => {
    it('costs less as the deductible goes up', () => {
      const premiums = [100_000, 500_000, 1_000_000, 2_500_000].map((deductibleCents) =>
        premiumFor({ deductibleCents }),
      );
      expect(premiums).toEqual([103_500, 90_000, 81_000, 72_000]);
    });

    it('rejects a deductible that is not offered', () => {
      expect(() => premiumFor({ deductibleCents: 200_000 })).toThrow(BusinessRuleError);
    });
  });

  describe('options', () => {
    it('adds no loading when no option is selected', () => {
      const { breakdown } = compute(baseInput);
      expect(breakdown.optionLoadings).toEqual([]);
      expect(breakdown.totalLoadingPct).toBe(0);
    });

    it('adds the loadings of the selected options together', () => {
      expect(premiumFor({ options: ['ransomware_extortion'] })).toBe(103_500);
      expect(
        premiumFor({
          options: [
            'ransomware_extortion',
            'social_engineering_fraud',
            'business_interruption',
            'regulatory_fines',
          ],
        }),
      ).toBe(127_800);
    });

    it('counts an option once even if it is sent twice', () => {
      expect(premiumFor({ options: ['regulatory_fines', 'regulatory_fines'] })).toBe(94_500);
    });

    it('rejects an option that is not offered', () => {
      expect(() => premiumFor({ options: ['flood' as CoverageOption] })).toThrow(
        new BusinessRuleError('pricing.unsupportedOption', 'Unsupported option: flood'),
      );
    });
  });
});
