import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { ConflictError } from 'src/core/domain/errors';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import type { Quote } from 'src/distribution/domain/quote/quote';
import { QuoteMapper } from 'src/distribution/infra/mappers/quote.mapper';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PrismaQuoteRepository implements QuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Quote | null> {
    const row = await this.prisma.db.quote.findUnique({ where: { id } });
    return row ? QuoteMapper.fromPrismaToDomain(row) : null;
  }

  async save(quote: Quote): Promise<void> {
    const data = QuoteMapper.fromDomainToPrisma(quote);
    // Only a stored draft is overwritten. Another request may have signed the quote since it
    // was read: the update then matches no row, and a rewrite as a draft is never applied.
    const { count } = await this.prisma.db.quote.updateMany({
      where: { id: quote.id, status: 'draft' },
      data,
    });
    if (count > 0) return;
    try {
      await this.prisma.db.quote.create({ data });
    } catch (error) {
      // The id exists: the stored quote is signed.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(QuoteError.NotEditable, 'A signed quote is read-only');
      }
      throw error;
    }
  }
}
