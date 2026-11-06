import { ConflictError } from 'src/core/domain/errors';
import type { Company } from 'src/distribution/domain/company/company';
import type { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { PricedTerms } from 'src/distribution/domain/quote/quote-terms';
import { StubPremiumCalculator } from 'src/distribution/infra/adapters/premium-calculator.stub';

import { aCompany, aDraftQuote, NOW } from '../builders';

type Harness = {
  repository: QuoteRepository;
  /** Makes the company exist where the adapter needs it (a foreign key, for the database). */
  givenCompany: (company: Company) => Promise<void>;
};

/** What every QuoteRepository adapter promises. */
export function describeQuoteRepository(name: string, harness: () => Promise<Harness>) {
  describe(`QuoteRepository: ${name}`, () => {
    let repository: QuoteRepository;
    let company: Company;

    beforeEach(async () => {
      const given = await harness();
      repository = given.repository;
      company = aCompany();
      await given.givenCompany(company);
    });

    it('saves a draft quote and finds it again', async () => {
      const quote = await aDraftQuote(company);

      await repository.save(quote);

      expect((await repository.findById(quote.id))?.getProps()).toEqual(quote.getProps());
    });

    it('overwrites a draft quote', async () => {
      const quote = await aDraftQuote(company);
      await repository.save(quote);
      const priced = await PricedTerms.price(new StubPremiumCalculator(), {
        annualRevenueCents: company.annualRevenueCents,
        coverageLimitCents: 100_000_000,
        deductibleCents: 1_000_000,
        options: ['regulatory_fines'],
      });
      quote.reconfigure(priced, company, NOW);

      await repository.save(quote);

      expect((await repository.findById(quote.id))?.getProps().terms.options).toEqual([
        'regulatory_fines',
      ]);
    });

    it('answers null for an unknown quote', async () => {
      expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
    });

    it('never overwrites a signed quote, even with a copy read while it was a draft', async () => {
      const quote = await aDraftQuote(company);
      await repository.save(quote);
      const stale = await repository.findById(quote.id);
      const signed = await repository.findById(quote.id);
      if (!stale || !signed) throw new Error('The quote was saved');
      signed.validate(NOW);
      await repository.save(signed);

      const stalePriced = await PricedTerms.price(new StubPremiumCalculator(), {
        annualRevenueCents: company.annualRevenueCents,
        coverageLimitCents: 100_000_000,
        deductibleCents: 1_000_000,
        options: [],
      });
      stale.reconfigure(stalePriced, company, NOW);

      await expect(repository.save(stale)).rejects.toThrow(ConflictError);
      expect((await repository.findById(quote.id))?.getProps().status).toBe('signed');
    });
  });
}
