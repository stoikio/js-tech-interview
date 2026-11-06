import { Controller, Param, Post } from '@nestjs/common';

import { ContractMapper } from 'src/distribution/infra/mappers/contract.mapper';
import {
  type ValidateQuoteCommand,
  ValidateQuoteUseCase,
} from 'src/distribution/use-cases/validate-quote/use-case';

@Controller('quotes')
export class HttpValidateQuoteController {
  constructor(private readonly useCase: ValidateQuoteUseCase) {}

  @Post(':quoteId/validate')
  async validate(@Param('quoteId') quoteId: string) {
    const command = { quoteId } satisfies ValidateQuoteCommand;
    return ContractMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
