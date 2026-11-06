import { z } from 'zod';

export const HttpCreateProspectBodyDto = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(200),
  annualRevenueCents: z.number().int().positive(),
});
export type HttpCreateProspectBodyDto = z.infer<typeof HttpCreateProspectBodyDto>;
