import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from 'src/app.module';
import { configureApp } from 'src/app.setup';
import { PrismaService } from 'src/common/prisma/prisma.service';

/** The whole API on the test database. */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.db.$executeRawUnsafe(`TRUNCATE "contract", "quote", "company" CASCADE`);
}

export const prospectInput = {
  name: 'Acme Robotics',
  annualRevenueCents: 800_000_000, // 8M EUR
};
