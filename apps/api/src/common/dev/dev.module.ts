import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { DevRoutesController } from 'src/common/dev/routes.controller';

/** Introspection used by the developer toolbox. */
@Module({
  imports: [DiscoveryModule],
  controllers: [DevRoutesController],
})
export class DevModule {}
