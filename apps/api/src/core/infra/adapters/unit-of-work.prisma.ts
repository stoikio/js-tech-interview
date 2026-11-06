import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { CoreError } from 'src/core/domain/error';
import { ConflictError } from 'src/core/domain/errors';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await this.prisma.runInTransaction(work);
    } catch (error) {
      // Two requests changing the same rows at once: the database aborted one (deadlock or write
      // conflict) and nothing was saved. It is the caller's to retry, not a server failure.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictError(
          CoreError.ConcurrentUpdate,
          'The data was changed at the same time: try again',
        );
      }
      throw error;
    }
  }
}
