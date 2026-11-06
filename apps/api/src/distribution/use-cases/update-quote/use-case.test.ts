import { BusinessRuleError, ConflictError } from 'src/core/domain/errors';
import { DistributionFixture } from 'src/distribution/tests/fixtures/distribution.fixture';

describe('UpdateQuoteUseCase', () => {
  let fixture: DistributionFixture;
  const configuration = {
    annualRevenueCents: 1_000_000_000,
    coverageLimitCents: 100_000_000,
    deductibleCents: 1_000_000,
    options: ['ransomware_extortion' as const],
  };

  beforeEach(() => {
    fixture = new DistributionFixture();
  });

  it("saves the terms and the company's revenue, and reprices the quote", async () => {
    const { companyId, quoteId } = await fixture.givenADraftQuote();
    fixture.clock.current = new Date('2026-03-16T09:00:00Z');

    await fixture.updateQuote.execute({ quoteId, ...configuration });

    expect(fixture.quote(quoteId)).toMatchObject({
      terms: {
        coverageLimitCents: 100_000_000,
        deductibleCents: 1_000_000,
        options: ['ransomware_extortion'],
      },
      pricing: { premiumCents: 11_010_000 },
      updatedAt: new Date('2026-03-16T09:00:00Z'),
    });
    expect(fixture.companies.snapshots.get(companyId)?.annualRevenueCents).toBe(1_000_000_000);
  });

  it('stores an option once, however many times it is sent', async () => {
    const { quoteId } = await fixture.givenADraftQuote();

    await fixture.updateQuote.execute({
      quoteId,
      ...configuration,
      options: ['regulatory_fines', 'ransomware_extortion', 'regulatory_fines'],
    });

    expect(fixture.quote(quoteId).terms.options).toEqual([
      'regulatory_fines',
      'ransomware_extortion',
    ]);
  });

  it('changes nothing when the new terms cannot be priced', async () => {
    const { companyId, quoteId } = await fixture.givenADraftQuote();
    const before = fixture.quote(quoteId);

    await expect(
      fixture.updateQuote.execute({
        quoteId,
        ...configuration,
        annualRevenueCents: 5_000_000_001,
      }),
    ).rejects.toThrow(BusinessRuleError);

    expect(fixture.quote(quoteId)).toEqual(before);
    expect(fixture.companies.snapshots.get(companyId)?.annualRevenueCents).toBe(800_000_000);
  });

  it('fails on an unknown quote', async () => {
    await expect(
      fixture.updateQuote.execute({ quoteId: 'unknown', ...configuration }),
    ).rejects.toMatchObject({ code: 'distribution.quote.notFound' });
  });

  it('refuses to change a signed quote, whatever the new terms', async () => {
    const { quoteId } = await fixture.givenADraftQuote();
    await fixture.validateQuote.execute({ quoteId });

    await expect(fixture.updateQuote.execute({ quoteId, ...configuration })).rejects.toThrow(
      ConflictError,
    );
    // Refused before anything is priced: a revenue that cannot be priced is not the answer.
    await expect(
      fixture.updateQuote.execute({ quoteId, ...configuration, annualRevenueCents: 5_000_000_001 }),
    ).rejects.toMatchObject({ code: 'distribution.quote.notEditable' });
  });
});
