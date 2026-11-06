/** The only source of the current time: use cases never call `new Date()`. */
export abstract class Clock {
  abstract now(): Date;
}
