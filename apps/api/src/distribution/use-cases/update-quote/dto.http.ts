import { z } from 'zod';

import { COVERAGE_OPTIONS } from 'src/core/domain/coverage-option';

/** The full configuration of a draft quote, sent on every change. */
export const HttpUpdateQuoteBodyDto = z.object({
  annualRevenueCents: z.number().int().positive(),
  coverageLimitCents: z.number().int().positive(),
  deductibleCents: z.number().int().positive(),
  options: z.array(z.enum(COVERAGE_OPTIONS)),
});
export type HttpUpdateQuoteBodyDto = z.infer<typeof HttpUpdateQuoteBodyDto>;
