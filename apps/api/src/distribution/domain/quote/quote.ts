import { startOfDayUtc } from 'src/core/domain/dates';
import { Entity } from 'src/core/domain/entity';
import { ConflictError } from 'src/core/domain/errors';
import type { Company } from 'src/distribution/domain/company/company';
import { Contract } from 'src/distribution/domain/contract/contract';
import type { QuotePricing } from 'src/distribution/domain/ports/premium-calculator.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import type { PricedTerms, QuoteTerms } from 'src/distribution/domain/quote/quote-terms';

export type QuoteStatus = 'draft' | 'signed';

export type QuoteProps = {
  companyId: string;
  status: QuoteStatus;
  terms: QuoteTerms;
  pricing: QuotePricing;
  createdAt: Date;
  updatedAt: Date;
};

export class Quote extends Entity<QuoteProps> {
  static createDraft(
    { company, priced }: { company: Company; priced: PricedTerms },
    now: Date,
  ): Quote {
    if (priced.annualRevenueCents !== company.annualRevenueCents) {
      throw new Error("The terms were priced for another turnover than the company's");
    }
    return new Quote({
      companyId: company.id,
      status: 'draft',
      terms: priced.terms,
      pricing: priced.pricing,
      createdAt: now,
      updatedAt: now,
    });
  }

  static hydrate(props: QuoteProps, id: string): Quote {
    return new Quote(props, id);
  }

  get companyId(): string {
    return this.props.companyId;
  }

  /** Lets a use case refuse a signed quote before it spends time pricing. `reconfigure` checks again. */
  assertEditable(): void {
    if (this.props.status !== 'draft') {
      throw new ConflictError(QuoteError.NotEditable, 'A signed quote is read-only');
    }
  }

  /**
   * New terms with their premium, and the company's turnover they assume: a
   * draft quote and its company's turnover change together. Only a draft can change.
   */
  reconfigure(priced: PricedTerms, company: Company, now: Date): void {
    this.assertEditable();
    if (company.id !== this.props.companyId) {
      throw new Error('This is not the company of the quote');
    }
    company.changeAnnualRevenue(priced.annualRevenueCents);
    this.props.terms = priced.terms;
    this.props.pricing = priced.pricing;
    this.props.updatedAt = now;
  }

  /** Signs the draft: it becomes read-only and gives a contract starting today. */
  validate(now: Date): Contract {
    this.assertEditable();
    this.props.status = 'signed';
    this.props.updatedAt = now;
    return Contract.start(
      {
        quoteId: this.id,
        companyId: this.props.companyId,
        premiumCents: this.props.pricing.premiumCents,
        terms: this.props.terms,
      },
      startOfDayUtc(now),
    );
  }
}
