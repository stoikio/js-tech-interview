import type { Quote } from 'src/distribution/domain/quote/quote';

export abstract class QuoteRepository {
  abstract findById(id: string): Promise<Quote | null>;
  /**
   * Fails with a ConflictError when the stored quote is already signed: a
   * signed quote never changes, even if the caller read it while it was a draft.
   */
  abstract save(quote: Quote): Promise<void>;
}
