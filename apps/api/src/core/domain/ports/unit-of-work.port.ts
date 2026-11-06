export abstract class UnitOfWork {
  /** Everything saved inside `work` is committed together, or not at all. */
  abstract runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
