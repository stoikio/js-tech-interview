import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'node:async_hooks';

import { config } from 'src/common/config';
import { type Prisma, PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: config.DATABASE_URL }),
  });
  private readonly transaction = new AsyncLocalStorage<Prisma.TransactionClient>();

  /** The client adapters must use: the current transaction when there is one. */
  get db(): Prisma.TransactionClient {
    return this.transaction.getStore() ?? this.client;
  }

  /** Every `db` call made inside `work` joins the same transaction. */
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.transaction.getStore()) return work();
    return this.client.$transaction((tx) => this.transaction.run(tx, work));
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
