import { BusinessRuleError } from 'src/core/domain/errors';
import {
  PremiumCalculator,
  type PremiumRequest,
  type QuotePricing,
} from 'src/distribution/domain/ports/premium-calculator.port';

/**
 * Predictable prices for tests: 1% of the revenue plus 1% of the coverage
 * limit, plus 100 EUR per option. Revenues above 50M EUR are not eligible.
 */
export class StubPremiumCalculator implements PremiumCalculator {
  async price(request: PremiumRequest): Promise<QuotePricing> {
    if (request.annualRevenueCents > 5_000_000_000) {
      throw new BusinessRuleError('pricing.revenueNotEligible', 'Not eligible');
    }
    const premiumCents =
      request.annualRevenueCents / 100 +
      request.coverageLimitCents / 100 +
      request.options.length * 10_000;
    return { premiumCents, breakdown: { ...request } };
  }
}
