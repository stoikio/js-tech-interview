import { useCallback, useEffect, useRef, useState } from 'react';

import { useQuoteUpdates } from '../../lib/server-state';
import { turnoverError } from '../../lib/turnover';
import type { Company, Quote, QuoteConfiguration } from '../../lib/types';

const DEBOUNCE_MS = 300;

export type QuoteSession = {
  /** What the broker sees: their changes, saved or not. */
  configuration: QuoteConfiguration;
  update: (changes: Partial<QuoteConfiguration>) => void;
  /** A change is waiting or being saved: the premium shown is out of date. */
  isUpdating: boolean;
  /** Why the last change could not be saved. The configuration shown is kept. */
  error: Error | null;
  /** Why the quote cannot be validated now, or null. */
  blockedReason: string | null;
};

type Change = { quoteId: string; configuration: QuoteConfiguration; changeId: number };

/**
 * Local configuration of a draft quote, saved and repriced by the API after each change
 * (debounced). Only the response to the latest change is applied: responses to older changes are
 * ignored, whatever order they arrive in.
 */
export function useLiveQuote(company: Company, quote: Quote): QuoteSession {
  const updates = useQuoteUpdates(company.id);
  const saved: QuoteConfiguration = {
    annualRevenueCents: company.annualRevenueCents,
    coverageLimitCents: quote.coverageLimitCents,
    deductibleCents: quote.deductibleCents,
    options: quote.options,
  };
  const [configuration, setConfiguration] = useState(saved);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [syncedAt, setSyncedAt] = useState(quote.updatedAt);
  const latestChangeId = useRef(0);
  const debounceTimer = useRef<number | undefined>(undefined);
  /** The change waiting for the end of the debounce. */
  const waiting = useRef<Change | null>(null);

  // The quote changed elsewhere (another tab, the API explorer) while nothing is being saved
  // here: show what is saved. Our own saves come back with the values already shown.
  if (quote.updatedAt !== syncedAt && !isUpdating) {
    setSyncedAt(quote.updatedAt);
    setConfiguration(saved);
  }

  const save = useCallback(
    async ({ quoteId, configuration: next, changeId }: Change) => {
      let response: Quote | null = null;
      let failure: Error | null = null;
      try {
        response = await updates.save(quoteId, next);
      } catch (e) {
        failure = e instanceof Error ? e : new Error('Could not update the quote');
      }

      // The user changed something since this request was sent: a newer response will follow.
      if (changeId !== latestChangeId.current) return;

      setIsUpdating(false);
      setError(failure);
      if (response) updates.applySaved(response, next);
    },
    [updates],
  );

  // A change made just before leaving the page is saved now: waiting for the debounce would drop it.
  useEffect(
    () => () => {
      if (!waiting.current) return;
      window.clearTimeout(debounceTimer.current);
      void save(waiting.current);
      waiting.current = null;
    },
    [save],
  );

  function update(changes: Partial<QuoteConfiguration>) {
    const next = { ...(waiting.current?.configuration ?? configuration), ...changes };
    setConfiguration(next);
    const changeId = ++latestChangeId.current;
    window.clearTimeout(debounceTimer.current);
    waiting.current = null;

    // The turnover select cannot be emptied, but the API refuses a quote with no turnover.
    const invalid = turnoverError(next.annualRevenueCents);
    if (invalid) {
      setIsUpdating(false);
      setError(new Error(invalid));
      return;
    }
    setIsUpdating(true);
    waiting.current = { quoteId: quote.id, configuration: next, changeId };
    debounceTimer.current = window.setTimeout(() => {
      const change = waiting.current;
      waiting.current = null;
      if (change) void save(change);
    }, DEBOUNCE_MS);
  }

  // The button stays focusable to show why it cannot be used.
  const blockedReason = isUpdating ? 'Saving your changes…' : (error?.message ?? null);

  return { configuration, update, isUpdating, error, blockedReason };
}
