import { Controller, Get } from '@nestjs/common';

import { DistributionQueries } from 'src/distribution/domain/ports/distribution-queries.port';

/** A read without business logic: no use case. */
@Controller('prospects')
export class HttpListProspectsController {
  constructor(private readonly distributionQueries: DistributionQueries) {}

  @Get()
  list() {
    return this.distributionQueries.listProspects();
  }
}
