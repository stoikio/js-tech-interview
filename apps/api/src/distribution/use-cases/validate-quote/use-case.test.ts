import { ConflictError } from 'src/core/domain/errors';
import { DistributionFixture } from 'src/distribution/tests/fixtures/distribution.fixture';

describe('ValidateQuoteUseCase', () => {
  let fixture: DistributionFixture;

  beforeEach(() => {
    fixture = new DistributionFixture();
  });

  it('signs the quote and creates a 12-month contract starting today', async () => {
    const { companyId, quoteId } = await fixture.givenADraftQuote();

    const contract = await fixture.validateQuote.execute({ quoteId });

    expect(fixture.quote(quoteId).status).toBe('signed');
    expect(fixture.contracts.snapshots.get(contract.id)).toEqual({
      quoteId,
      companyId,
      startDate: new Date('2026-03-15T00:00:00Z'),
      endDate: new Date('2027-03-15T00:00:00Z'),
      premiumCents: fixture.quote(quoteId).pricing.premiumCents,
      terms: fixture.quote(quoteId).terms,
    });
  });

  it('fails on an unknown quote', async () => {
    await expect(fixture.validateQuote.execute({ quoteId: 'unknown' })).rejects.toMatchObject({
      code: 'distribution.quote.notFound',
    });
  });

  it('signs a quote only once', async () => {
    const { quoteId } = await fixture.givenADraftQuote();
    await fixture.validateQuote.execute({ quoteId });

    await expect(fixture.validateQuote.execute({ quoteId })).rejects.toThrow(ConflictError);
    expect(fixture.contracts.snapshots.size).toBe(1);
  });
});
