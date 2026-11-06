import { Controller, Get, Param } from '@nestjs/common';

import { DistributionQueries } from 'src/distribution/domain/ports/distribution-queries.port';

/** The contract page: the contract and its company. A read without business logic: no use case. */
@Controller('contracts')
export class HttpGetContractController {
  constructor(private readonly distributionQueries: DistributionQueries) {}

  @Get(':contractId')
  get(@Param('contractId') contractId: string) {
    return this.distributionQueries.getContract(contractId);
  }
}
