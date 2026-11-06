import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from 'src/app.module';
import { configureApp } from 'src/app.setup';
import { config } from 'src/common/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  await app.listen(config.PORT);
}

void bootstrap();
