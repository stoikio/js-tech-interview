import { Clock } from 'src/core/domain/ports/clock.port';

/** Frozen clock for tests. */
export class StubClock implements Clock {
  constructor(public current = new Date('2026-03-15T10:00:00Z')) {}

  now(): Date {
    return this.current;
  }
}
