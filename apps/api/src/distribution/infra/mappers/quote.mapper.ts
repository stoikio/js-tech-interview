import type { QuoteView } from 'src/distribution/domain/ports/distribution-queries.port';
import { Quote } from 'src/distribution/domain/quote/quote';
import type { Prisma, Quote as QuoteRow } from 'src/generated/prisma/client';

export class QuoteMapper {
  static fromPrismaToDomain(row: QuoteRow): Quote {
    return Quote.hydrate(
      {
        companyId: row.companyId,
        status: row.status,
        terms: {
          coverageLimitCents: row.coverageLimitCents,
          deductibleCents: row.deductibleCents,
          options: row.options,
        },
        pricing: {
          premiumCents: row.premiumCents,
          breakdown: row.pricingBreakdown as Record<string, unknown>,
        },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  static fromDomainToPrisma(quote: Quote) {
    const { terms, pricing, ...props } = quote.getProps();
    return {
      id: quote.id,
      ...props,
      ...terms,
      premiumCents: pricing.premiumCents,
      pricingBreakdown: pricing.breakdown as Prisma.InputJsonObject,
    };
  }

  static fromDomainToDto(quote: Quote): QuoteView {
    const { terms, pricing, ...props } = quote.getProps();
    return {
      id: quote.id,
      ...props,
      ...terms,
      premiumCents: pricing.premiumCents,
      pricingBreakdown: pricing.breakdown,
    };
  }
}
