import { Controller, Get } from '@nestjs/common';

import { pricingCatalog } from 'src/pricing/domain/pricing';

@Controller('pricing/catalog')
export class HttpGetCatalogController {
  @Get()
  get() {
    return pricingCatalog();
  }
}
