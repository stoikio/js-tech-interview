import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';

/** For tests on in-memory adapters, which have nothing to roll back. */
export class NoopUnitOfWork implements UnitOfWork {
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
