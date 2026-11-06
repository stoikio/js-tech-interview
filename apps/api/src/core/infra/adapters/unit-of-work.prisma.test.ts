import type { PrismaService } from 'src/common/prisma/prisma.service';
import { ConflictError } from 'src/core/domain/errors';
import { PrismaUnitOfWork } from 'src/core/infra/adapters/unit-of-work.prisma';
import { Prisma } from 'src/generated/prisma/client';

const failingWith = (error: Error) =>
  new PrismaUnitOfWork({
    runInTransaction: () => Promise.reject(error),
  } as unknown as PrismaService);

describe('PrismaUnitOfWork', () => {
  it('turns a write conflict between two requests into a conflict to retry', async () => {
    const writeConflict = new Prisma.PrismaClientKnownRequestError('deadlock detected', {
      code: 'P2034',
      clientVersion: 'test',
    });

    await expect(failingWith(writeConflict).runInTransaction(async () => {})).rejects.toMatchObject(
      { code: 'core.concurrentUpdate' },
    );
    await expect(failingWith(writeConflict).runInTransaction(async () => {})).rejects.toThrow(
      ConflictError,
    );
  });

  it('lets any other failure through', async () => {
    const failure = new Error('connection lost');

    await expect(failingWith(failure).runInTransaction(async () => {})).rejects.toBe(failure);
  });
});
