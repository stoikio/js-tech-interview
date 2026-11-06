import { Module } from '@nestjs/common';

import { HttpGetCatalogController } from 'src/pricing/use-cases/get-catalog/controller.http';

@Module({ controllers: [HttpGetCatalogController] })
export class PricingModule {}
