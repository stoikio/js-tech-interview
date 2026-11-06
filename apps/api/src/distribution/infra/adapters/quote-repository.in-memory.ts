import { ConflictError } from 'src/core/domain/errors';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import { Quote, type QuoteProps } from 'src/distribution/domain/quote/quote';

export class InMemoryQuoteRepository implements QuoteRepository {
  readonly snapshots = new Map<string, QuoteProps>();

  async findById(id: string): Promise<Quote | null> {
    const props = this.snapshots.get(id);
    return props ? Quote.hydrate(structuredClone(props), id) : null;
  }

  async save(quote: Quote): Promise<void> {
    if (this.snapshots.get(quote.id)?.status === 'signed') {
      throw new ConflictError(QuoteError.NotEditable, 'A signed quote is read-only');
    }
    this.snapshots.set(quote.id, structuredClone(quote.getProps()));
  }
}
