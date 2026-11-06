import { Controller, Delete, HttpCode, Param } from '@nestjs/common';

import {
  type DeleteProspectCommand,
  DeleteProspectUseCase,
} from 'src/distribution/use-cases/delete-prospect/use-case';

@Controller('prospects')
export class HttpDeleteProspectController {
  constructor(private readonly useCase: DeleteProspectUseCase) {}

  @Delete(':companyId')
  @HttpCode(204)
  async delete(@Param('companyId') companyId: string) {
    const command = { companyId } satisfies DeleteProspectCommand;
    await this.useCase.execute(command);
  }
}
