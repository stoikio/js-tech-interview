import { randomUUID } from 'node:crypto';

/** Base class of aggregates: an id and props only the entity itself may change. */
export abstract class Entity<Props extends object> {
  protected constructor(
    protected readonly props: Props,
    readonly id: string = randomUUID(),
  ) {}

  getProps(): Readonly<Props> {
    return { ...this.props };
  }
}
