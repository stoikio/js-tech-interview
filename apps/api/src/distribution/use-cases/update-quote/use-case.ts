import { Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import { CompanyError } from 'src/distribution/domain/company/error';
import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';
import {
  PremiumCalculator,
  type PremiumRequest,
} from 'src/distribution/domain/ports/premium-calculator.port';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import type { Quote } from 'src/distribution/domain/quote/quote';
import { PricedTerms } from 'src/distribution/domain/quote/quote-terms';

export type UpdateQuoteCommand = PremiumRequest & { quoteId: string };

/** Saves the configuration of a draft quote (and its company's revenue), then reprices it. */
@Injectable()
export class UpdateQuoteUseCase {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly premiumCalculator: PremiumCalculator,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute({ quoteId, ...request }: UpdateQuoteCommand): Promise<Quote> {
    const quote = await this.quoteRepository.findById(quoteId);
    if (!quote) {
      throw new ResourceNotFoundError(QuoteError.NotFound, 'Quote not found');
    }
    // A signed quote answers "read-only" whatever the terms, before anything is priced.
    quote.assertEditable();
    const company = await this.companyRepository.findById(quote.companyId);
    if (!company) throw new ResourceNotFoundError(CompanyError.NotFound, 'Company not found');

    const priced = await PricedTerms.price(this.premiumCalculator, request);
    quote.reconfigure(priced, company, this.clock.now());

    await this.unitOfWork.runInTransaction(async () => {
      await this.companyRepository.save(company);
      await this.quoteRepository.save(quote);
    });
    return quote;
  }
}
