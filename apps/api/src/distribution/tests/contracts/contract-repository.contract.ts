import { ConflictError } from 'src/core/domain/errors';
import type { Company } from 'src/distribution/domain/company/company';
import { Contract } from 'src/distribution/domain/contract/contract';
import type { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import type { Quote } from 'src/distribution/domain/quote/quote';

import { aCompany, aDraftQuote, NOW } from '../builders';

type Harness = {
  repository: ContractRepository;
  /** Makes the company and its quote exist where the adapter needs them (foreign keys, for the database). */
  givenQuote: (company: Company, quote: Quote) => Promise<void>;
};

/** What every ContractRepository adapter promises. */
export function describeContractRepository(name: string, harness: () => Promise<Harness>) {
  describe(`ContractRepository: ${name}`, () => {
    let repository: ContractRepository;
    let company: Company;
    let quote: Quote;

    beforeEach(async () => {
      const given = await harness();
      repository = given.repository;
      company = aCompany();
      quote = await aDraftQuote(company);
      await given.givenQuote(company, quote);
    });

    it('saves a contract: its company then has one', async () => {
      expect(await repository.existsForCompany(company.id)).toBe(false);

      await repository.save(quote.validate(NOW));

      expect(await repository.existsForCompany(company.id)).toBe(true);
    });

    it('refuses a second contract for the same quote', async () => {
      await repository.save(quote.validate(NOW));
      // What a concurrent request signing the same quote would try to save.
      const second = Contract.start(
        {
          quoteId: quote.id,
          companyId: company.id,
          premiumCents: quote.getProps().pricing.premiumCents,
          terms: quote.getProps().terms,
        },
        NOW,
      );

      await expect(repository.save(second)).rejects.toThrow(ConflictError);
    });
  });
}
