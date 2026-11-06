import { Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import type { Contract } from 'src/distribution/domain/contract/contract';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';

export type ValidateQuoteCommand = { quoteId: string };

/** Signs a draft quote, which creates a contract starting today. */
@Injectable()
export class ValidateQuoteUseCase {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly contractRepository: ContractRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute({ quoteId }: ValidateQuoteCommand): Promise<Contract> {
    const quote = await this.quoteRepository.findById(quoteId);
    if (!quote) {
      throw new ResourceNotFoundError(QuoteError.NotFound, 'Quote not found');
    }
    const contract = quote.validate(this.clock.now());

    await this.unitOfWork.runInTransaction(async () => {
      await this.quoteRepository.save(quote);
      await this.contractRepository.save(contract);
    });
    return contract;
  }
}
