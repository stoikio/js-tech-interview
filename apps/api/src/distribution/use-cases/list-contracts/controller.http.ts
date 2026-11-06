import { Controller, Get } from '@nestjs/common';

import { DistributionQueries } from 'src/distribution/domain/ports/distribution-queries.port';

/** A read without business logic: no use case. */
@Controller('contracts')
export class HttpListContractsController {
  constructor(private readonly distributionQueries: DistributionQueries) {}

  @Get()
  list() {
    return this.distributionQueries.listContracts();
  }
}
