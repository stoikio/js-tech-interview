import { Body, Controller, Post } from '@nestjs/common';

import { HttpCreateProspectBodyDto } from 'src/distribution/use-cases/create-prospect/dto.http';
import {
  type CreateProspectCommand,
  CreateProspectUseCase,
} from 'src/distribution/use-cases/create-prospect/use-case';

@Controller('prospects')
export class HttpCreateProspectController {
  constructor(private readonly useCase: CreateProspectUseCase) {}

  @Post()
  async create(@Body({ schema: HttpCreateProspectBodyDto }) body: HttpCreateProspectBodyDto) {
    const command = body satisfies CreateProspectCommand;
    const { companyId } = await this.useCase.execute(command);
    return { id: companyId };
  }
}
