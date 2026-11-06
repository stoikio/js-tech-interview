import { Body, Controller, Param, Put } from '@nestjs/common';

import { QuoteMapper } from 'src/distribution/infra/mappers/quote.mapper';
import { HttpUpdateQuoteBodyDto } from 'src/distribution/use-cases/update-quote/dto.http';
import {
  type UpdateQuoteCommand,
  UpdateQuoteUseCase,
} from 'src/distribution/use-cases/update-quote/use-case';

@Controller('quotes')
export class HttpUpdateQuoteController {
  constructor(private readonly useCase: UpdateQuoteUseCase) {}

  @Put(':quoteId')
  async update(
    @Param('quoteId') quoteId: string,
    @Body({ schema: HttpUpdateQuoteBodyDto }) body: HttpUpdateQuoteBodyDto,
  ) {
    const command = { quoteId, ...body } satisfies UpdateQuoteCommand;
    return QuoteMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
