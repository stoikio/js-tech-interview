import { addMonthsUtc } from 'src/core/domain/dates';
import { Entity } from 'src/core/domain/entity';
import type { QuoteTerms } from 'src/distribution/domain/quote/quote-terms';

export type ContractProps = {
  quoteId: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  premiumCents: number;
  terms: QuoteTerms;
};

/** A signed quote: the company's insurance for 12 months. Its terms and premium are copied from the quote. */
export class Contract extends Entity<ContractProps> {
  static start(
    from: Pick<ContractProps, 'quoteId' | 'companyId' | 'premiumCents' | 'terms'>,
    startDate: Date,
  ): Contract {
    return new Contract({ ...from, startDate, endDate: addMonthsUtc(startDate, 12) });
  }

  static hydrate(props: ContractProps, id: string): Contract {
    return new Contract(props, id);
  }
}
