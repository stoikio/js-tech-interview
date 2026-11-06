import { DEFAULT_TERMS } from 'src/distribution/domain/quote/quote-terms';
import { InProcessPremiumCalculator } from 'src/distribution/infra/adapters/premium-calculator.in-process';
import { StubPremiumCalculator } from 'src/distribution/infra/adapters/premium-calculator.stub';

import { describePremiumCalculator } from './contracts/premium-calculator.contract';

describePremiumCalculator('stub', () => new StubPremiumCalculator());
describePremiumCalculator('in-process', () => new InProcessPremiumCalculator());

describe('DEFAULT_TERMS', () => {
  // A new prospect is priced with them: they must exist in the pricing rules, in every revenue band.
  it.each([100_000, 100_000_000, 500_000_000, 1_000_000_000, 2_500_000_000, 5_000_000_000])(
    'are priced by the pricing context for a turnover of %i cents',
    async (annualRevenueCents) => {
      await expect(
        new InProcessPremiumCalculator().price({ annualRevenueCents, ...DEFAULT_TERMS }),
      ).resolves.toBeDefined();
    },
  );
});
