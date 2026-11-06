import { ConflictError, ResourceNotFoundError } from 'src/core/domain/errors';
import { DistributionFixture } from 'src/distribution/tests/fixtures/distribution.fixture';

describe('DeleteProspectUseCase', () => {
  let fixture: DistributionFixture;

  beforeEach(() => {
    fixture = new DistributionFixture();
  });

  it('deletes the company', async () => {
    const { companyId } = await fixture.givenADraftQuote();

    await fixture.deleteProspect.execute({ companyId });

    expect(fixture.companies.snapshots.has(companyId)).toBe(false);
  });

  it('keeps a company that has a contract', async () => {
    const { companyId, quoteId } = await fixture.givenADraftQuote();
    await fixture.validateQuote.execute({ quoteId });

    await expect(fixture.deleteProspect.execute({ companyId })).rejects.toThrow(ConflictError);
    expect(fixture.companies.snapshots.has(companyId)).toBe(true);
  });

  it('fails on an unknown company', async () => {
    await expect(fixture.deleteProspect.execute({ companyId: 'unknown' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
