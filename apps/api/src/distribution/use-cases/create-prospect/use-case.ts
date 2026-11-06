import { Injectable } from '@nestjs/common';

import { Clock } from 'src/core/domain/ports/clock.port';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import { Company } from 'src/distribution/domain/company/company';
import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';
import { PremiumCalculator } from 'src/distribution/domain/ports/premium-calculator.port';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { Quote } from 'src/distribution/domain/quote/quote';
import { DEFAULT_TERMS, PricedTerms } from 'src/distribution/domain/quote/quote-terms';

export type CreateProspectCommand = {
  name: string;
  annualRevenueCents: number;
};

/** A prospect is a company and its first draft quote, saved together. */
@Injectable()
export class CreateProspectUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly premiumCalculator: PremiumCalculator,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateProspectCommand): Promise<{ companyId: string }> {
    const now = this.clock.now();
    const company = Company.create(input, now);
    const priced = await PricedTerms.price(this.premiumCalculator, {
      annualRevenueCents: company.annualRevenueCents,
      ...DEFAULT_TERMS,
    });
    const quote = Quote.createDraft({ company, priced }, now);

    await this.unitOfWork.runInTransaction(async () => {
      await this.companyRepository.save(company);
      await this.quoteRepository.save(quote);
    });
    return { companyId: company.id };
  }
}
