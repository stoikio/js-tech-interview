import type { NestExpressApplication } from '@nestjs/platform-express';

/** Shared by main.ts and the e2e tests. */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
}
