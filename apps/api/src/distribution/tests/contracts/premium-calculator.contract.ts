import { BusinessRuleError } from 'src/core/domain/errors';
import type { PremiumCalculator } from 'src/distribution/domain/ports/premium-calculator.port';
import { DEFAULT_TERMS } from 'src/distribution/domain/quote/quote-terms';

/** What every PremiumCalculator adapter promises, so the stub cannot drift from the real one. */
export function describePremiumCalculator(name: string, calculator: () => PremiumCalculator) {
  describe(`PremiumCalculator: ${name}`, () => {
    const request = { annualRevenueCents: 800_000_000, ...DEFAULT_TERMS };

    it('prices a request as a positive whole number of cents', async () => {
      const { premiumCents } = await calculator().price(request);

      expect(Number.isInteger(premiumCents)).toBe(true);
      expect(premiumCents).toBeGreaterThan(0);
    });

    it('rejects a turnover above the maximum eligible one with a business rule', async () => {
      const tooBig = { ...request, annualRevenueCents: 5_000_000_001 };

      const failure = await calculator()
        .price(tooBig)
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(BusinessRuleError);
      expect(failure).toMatchObject({ code: 'pricing.revenueNotEligible' });
    });

    it('prices the largest eligible turnover', async () => {
      await expect(
        calculator().price({ ...request, annualRevenueCents: 5_000_000_000 }),
      ).resolves.toBeDefined();
    });
  });
}
