import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';

import { fakeApi, failure, noContent, ok } from '../test/fake-api';
import { catalog, contract, draftQuote, prospectDetail } from '../test/fixtures';
import { createQueryClient, queryWrapper } from '../test/providers';
import {
  queryKeys,
  useCreateProspect,
  useDeleteProspect,
  usePricingCatalog,
  useProspect,
  useQuoteUpdates,
  useValidateQuote,
} from './server-state';

const isInvalidated = (queryClient: ReturnType<typeof createQueryClient>, key: readonly string[]) =>
  queryClient.getQueryState(key)?.isInvalidated;

describe('reads', () => {
  it('loads a prospect under its own key', async () => {
    fakeApi({ 'GET /prospects/company-1': () => ok(prospectDetail()) });
    const queryClient = createQueryClient();

    const { result } = renderHook(() => useProspect('company-1'), {
      wrapper: queryWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.data).toEqual(prospectDetail()));
    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toEqual(prospectDetail());
  });

  it('fetches the pricing catalog once for every page that needs it', async () => {
    const api = fakeApi({ 'GET /pricing/catalog': () => ok(catalog()) });

    const { result } = renderHook(() => [usePricingCatalog(), usePricingCatalog()], {
      wrapper: queryWrapper(createQueryClient()),
    });

    await waitFor(() =>
      expect(result.current.map((query) => query.data)).toEqual([catalog(), catalog()]),
    );
    expect(api.callsTo('GET /pricing/catalog')).toHaveLength(1);
  });

  it('exposes a catalog failure as an error to show', async () => {
    fakeApi({ 'GET /pricing/catalog': () => failure(503, 'The API is starting') });

    const { result } = renderHook(() => usePricingCatalog(), {
      wrapper: queryWrapper(createQueryClient()),
    });

    await waitFor(() => expect(result.current.error?.message).toBe('The API is starting'));
    expect(result.current.data).toBeUndefined();
  });
});

describe('creating a prospect', () => {
  it('makes the prospects list refetch', async () => {
    const api = fakeApi({
      'GET /prospects': () => ok([]),
      'POST /prospects': () => ok({ id: 'company-2' }),
    });
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.prospects, []);

    const { result } = renderHook(() => useCreateProspect(), {
      wrapper: queryWrapper(queryClient),
    });
    let created: { id: string } | undefined;
    await act(async () => {
      created = await result.current.mutateAsync({
        name: 'Globex',
        annualRevenueCents: 100_000_000,
      });
    });

    expect(created).toEqual({ id: 'company-2' });
    expect(api.callsTo('POST /prospects')[0]?.body).toEqual({
      name: 'Globex',
      annualRevenueCents: 100_000_000,
    });
    expect(isInvalidated(queryClient, queryKeys.prospects)).toBe(true);
  });
});

describe('deleting a prospect', () => {
  it('forgets the prospect and makes the list refetch', async () => {
    fakeApi({ 'DELETE /prospects/company-1': () => noContent() });
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.prospect('company-1'), prospectDetail());
    queryClient.setQueryData(queryKeys.prospects, []);

    const { result } = renderHook(() => useDeleteProspect(), {
      wrapper: queryWrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync('company-1');
    });

    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toBeUndefined();
    expect(isInvalidated(queryClient, queryKeys.prospects)).toBe(true);
  });
});

describe('validating a quote', () => {
  it('turns the prospect into a contract everywhere', async () => {
    fakeApi({ 'POST /quotes/quote-1/validate': () => ok(contract()) });
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.prospect('company-1'), prospectDetail());
    queryClient.setQueryData(queryKeys.prospect('company-2'), prospectDetail());
    queryClient.setQueryData(queryKeys.prospects, []);
    queryClient.setQueryData(queryKeys.contracts, []);

    const { result } = renderHook(() => useValidateQuote(), { wrapper: queryWrapper(queryClient) });
    let signed: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      signed = await result.current.mutateAsync('quote-1');
    });

    expect(signed).toEqual(contract());
    // Found through the contract: the caller only knows the quote.
    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.prospect('company-2'))).toBeDefined();
    expect(isInvalidated(queryClient, queryKeys.prospects)).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.contracts)).toBe(true);
  });

  it('keeps the cache as it is when the API refuses', async () => {
    fakeApi({ 'POST /quotes/quote-1/validate': () => failure(409, 'A signed quote is read-only') });
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.prospect('company-1'), prospectDetail());

    const { result } = renderHook(() => useValidateQuote(), { wrapper: queryWrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync('quote-1').catch(() => undefined);
    });

    await waitFor(() => expect(result.current.error?.message).toBe('A signed quote is read-only'));
    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toEqual(prospectDetail());
  });
});

describe('updating a quote', () => {
  const configuration = {
    annualRevenueCents: 500_000_000,
    coverageLimitCents: 100_000_000,
    deductibleCents: 1_000_000,
    options: [],
  };

  it('saves the configuration without touching the cache', async () => {
    const api = fakeApi({ 'PUT /quotes/quote-1': () => ok(draftQuote()) });
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.prospect('company-1'), prospectDetail());

    const { result } = renderHook(() => useQuoteUpdates('company-1'), {
      wrapper: queryWrapper(queryClient),
    });
    await act(async () => {
      await result.current.save('quote-1', configuration);
    });

    expect(api.callsTo('PUT /quotes/quote-1')[0]?.body).toEqual(configuration);
    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toEqual(prospectDetail());
  });

  it('shows a saved quote on the prospect, with its new turnover, and makes the list refetch', () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.prospect('company-1'), prospectDetail());
    queryClient.setQueryData(queryKeys.prospects, []);
    const saved = draftQuote({ premiumCents: 450_000, updatedAt: '2026-11-02T09:00:00.000Z' });

    const { result } = renderHook(() => useQuoteUpdates('company-1'), {
      wrapper: queryWrapper(queryClient),
    });
    act(() => result.current.applySaved(saved, configuration));

    const detail = queryClient.getQueryData<ReturnType<typeof prospectDetail>>(
      queryKeys.prospect('company-1'),
    );
    expect(detail?.company.annualRevenueCents).toBe(500_000_000);
    expect(detail?.quote?.premiumCents).toBe(450_000);
    expect(detail?.quote?.contract).toBeNull();
    expect(isInvalidated(queryClient, queryKeys.prospects)).toBe(true);
  });

  it('does not invent a prospect that is not cached', () => {
    const queryClient = createQueryClient();

    const { result } = renderHook(() => useQuoteUpdates('company-1'), {
      wrapper: queryWrapper(queryClient),
    });
    act(() => result.current.applySaved(draftQuote(), configuration));

    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toBeUndefined();
  });
});
