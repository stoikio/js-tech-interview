import { BusinessRuleError } from 'src/core/domain/errors';
import { DistributionFixture } from 'src/distribution/tests/fixtures/distribution.fixture';

describe('CreateProspectUseCase', () => {
  let fixture: DistributionFixture;
  const input = { name: 'Acme Robotics', annualRevenueCents: 800_000_000 };

  beforeEach(() => {
    fixture = new DistributionFixture();
  });

  it('creates the company with a priced draft quote', async () => {
    const { companyId } = await fixture.createProspect.execute(input);

    expect(fixture.companies.snapshots.get(companyId)).toMatchObject(input);
    const [quote] = fixture.quotes.snapshots.values();
    expect(quote).toMatchObject({
      companyId,
      status: 'draft',
      terms: { coverageLimitCents: 50_000_000, deductibleCents: 500_000, options: [] },
      pricing: { premiumCents: 8_500_000 },
    });
  });

  it('saves nothing when the company cannot be priced', async () => {
    const tooBig = { ...input, annualRevenueCents: 5_000_000_001 };

    await expect(fixture.createProspect.execute(tooBig)).rejects.toThrow(BusinessRuleError);
    expect(fixture.companies.snapshots.size).toBe(0);
    expect(fixture.quotes.snapshots.size).toBe(0);
  });
});
