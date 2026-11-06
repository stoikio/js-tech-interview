import { Controller, Get, Param } from '@nestjs/common';

import { DistributionQueries } from 'src/distribution/domain/ports/distribution-queries.port';

/** The prospect page: the company and its latest quote. A read without business logic: no use case. */
@Controller('prospects')
export class HttpGetProspectController {
  constructor(private readonly distributionQueries: DistributionQueries) {}

  @Get(':companyId')
  get(@Param('companyId') companyId: string) {
    return this.distributionQueries.getProspect(companyId);
  }
}
