import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  ResourceNotFoundError,
} from 'src/core/domain/errors';

function statusOf(error: DomainError): HttpStatus {
  if (error instanceof ResourceNotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictError) return HttpStatus.CONFLICT;
  if (error instanceof BusinessRuleError) return HttpStatus.UNPROCESSABLE_ENTITY;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/** Turns domain errors into `{ statusCode, code, message }` responses. */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const statusCode = statusOf(error);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, code: error.code, message: error.message });
  }
}
