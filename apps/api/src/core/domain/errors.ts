/**
 * A business failure, with a stable code namespaced by context
 * (for example `distribution.quote.notFound`). DomainErrorFilter maps each
 * subclass to an HTTP status.
 */
export abstract class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** The resource does not exist. HTTP 404. */
export class ResourceNotFoundError extends DomainError {}

/** The current state of the resource does not allow the action. HTTP 409. */
export class ConflictError extends DomainError {}

/** A business rule rejects the request. HTTP 422. */
export class BusinessRuleError extends DomainError {}
