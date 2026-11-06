import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { DevModule } from 'src/common/dev/dev.module';
import { DomainErrorFilter } from 'src/common/http/domain-error.filter';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { CoreModule } from 'src/core/core.module';
import { DistributionModule } from 'src/distribution/distribution.module';
import { PricingModule } from 'src/pricing/pricing.module';

@Module({
  imports: [PrismaModule, CoreModule, PricingModule, DistributionModule, DevModule],
  providers: [
    // Validates every `@Body({ schema })` with its zod schema.
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
export class AppModule {}
