import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../lib/server-state';
import { TURNOVER_REQUIRED } from '../../lib/turnover';
import { failure, fakeApi, ok, type Reply } from '../../test/fake-api';
import { company, draftQuote, prospectDetail } from '../../test/fixtures';
import { createQueryClient, queryWrapper } from '../../test/providers';
import { useLiveQuote } from './useLiveQuote';

const PUT = 'PUT /quotes/quote-1';
const savedConfiguration = {
  annualRevenueCents: 100_000_000,
  coverageLimitCents: 50_000_000,
  deductibleCents: 500_000,
  options: [],
};

function deferred() {
  let resolve: (reply: Reply) => void = () => {};
  const promise = new Promise<Reply>((done) => (resolve = done));
  return { promise, resolve };
}

function setup(props = { company: company(), quote: draftQuote() }) {
  const queryClient = createQueryClient();
  queryClient.setQueryData(queryKeys.prospect('company-1'), prospectDetail());
  const hook = renderHook(({ company, quote }) => useLiveQuote(company, quote), {
    initialProps: props,
    wrapper: queryWrapper(queryClient),
  });
  const premiumInCache = () =>
    queryClient.getQueryData<ReturnType<typeof prospectDetail>>(queryKeys.prospect('company-1'))
      ?.quote?.premiumCents;
  return { ...hook, queryClient, premiumInCache };
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
});

describe('saving changes', () => {
  it('saves once after a burst of changes, with all of them', async () => {
    const api = fakeApi({ [PUT]: () => ok(draftQuote({ premiumCents: 300_000 })) });
    const { result, premiumInCache } = setup();

    act(() => {
      result.current.update({ coverageLimitCents: 100_000_000 });
      result.current.update({ deductibleCents: 1_000_000 });
    });
    expect(result.current.isUpdating).toBe(true);
    expect(api.callsTo(PUT)).toHaveLength(0);

    await advance(300);

    expect(api.callsTo(PUT)).toHaveLength(1);
    expect(api.callsTo(PUT)[0]?.body).toEqual({
      ...savedConfiguration,
      coverageLimitCents: 100_000_000,
      deductibleCents: 1_000_000,
    });
    expect(result.current.isUpdating).toBe(false);
    expect(premiumInCache()).toBe(300_000);
  });

  it('shows the changes at once, before they are saved', () => {
    fakeApi({ [PUT]: () => ok(draftQuote()) });
    const { result } = setup();

    act(() => result.current.update({ options: ['regulatory_fines'] }));

    expect(result.current.configuration.options).toEqual(['regulatory_fines']);
  });

  it('applies only the response to the latest change, whichever order they arrive in', async () => {
    const replies = [deferred(), deferred()];
    let sent = 0;
    fakeApi({ [PUT]: () => replies[sent++]?.promise ?? Promise.reject(new Error('unexpected')) });
    const { result, premiumInCache } = setup();

    act(() => result.current.update({ coverageLimitCents: 100_000_000 }));
    await advance(300);
    act(() => result.current.update({ deductibleCents: 1_000_000 }));
    await advance(300);
    expect(sent).toBe(2);

    // The response to the first change arrives while the second is still being saved.
    await act(async () => replies[0]?.resolve(ok(draftQuote({ premiumCents: 111 }))));
    expect(result.current.isUpdating).toBe(true);
    expect(premiumInCache()).toBe(200_000);

    await act(async () => replies[1]?.resolve(ok(draftQuote({ premiumCents: 222 }))));
    expect(result.current.isUpdating).toBe(false);
    expect(premiumInCache()).toBe(222);
  });

  it('does not let a late response to an older change overwrite the latest one', async () => {
    const replies = [deferred(), deferred()];
    let sent = 0;
    fakeApi({ [PUT]: () => replies[sent++]?.promise ?? Promise.reject(new Error('unexpected')) });
    const { result, premiumInCache } = setup();

    act(() => result.current.update({ coverageLimitCents: 100_000_000 }));
    await advance(300);
    act(() => result.current.update({ deductibleCents: 1_000_000 }));
    await advance(300);

    await act(async () => replies[1]?.resolve(ok(draftQuote({ premiumCents: 222 }))));
    await act(async () => replies[0]?.resolve(ok(draftQuote({ premiumCents: 111 }))));

    expect(premiumInCache()).toBe(222);
    expect(result.current.configuration.coverageLimitCents).toBe(100_000_000);
    expect(result.current.configuration.deductibleCents).toBe(1_000_000);
  });
});

describe('a change that cannot be saved', () => {
  it('keeps what the broker chose and says why, until the next change is saved', async () => {
    let reply: Reply = failure(422, 'Not eligible', 'pricing.revenueNotEligible');
    fakeApi({ [PUT]: () => reply });
    const { result, premiumInCache } = setup();

    act(() => result.current.update({ annualRevenueCents: 500_000_000 }));
    await advance(300);

    expect(result.current.error?.message).toBe('Not eligible');
    expect(result.current.blockedReason).toBe('Not eligible');
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.configuration.annualRevenueCents).toBe(500_000_000);
    expect(premiumInCache()).toBe(200_000);

    reply = ok(draftQuote({ premiumCents: 250_000 }));
    act(() => result.current.update({ annualRevenueCents: 100_000_000 }));
    await advance(300);

    expect(result.current.error).toBeNull();
    expect(result.current.blockedReason).toBeNull();
    expect(premiumInCache()).toBe(250_000);
  });

  it('does not send a quote with no turnover', () => {
    const api = fakeApi({ [PUT]: () => ok(draftQuote()) });
    const { result } = setup();

    act(() => result.current.update({ annualRevenueCents: 0 }));

    expect(result.current.error?.message).toBe(TURNOVER_REQUIRED);
    expect(result.current.isUpdating).toBe(false);
    expect(api.callsTo(PUT)).toHaveLength(0);
  });
});

describe('validating while saving', () => {
  it('is blocked until the changes are saved', async () => {
    fakeApi({ [PUT]: () => ok(draftQuote()) });
    const { result } = setup();
    expect(result.current.blockedReason).toBeNull();

    act(() => result.current.update({ coverageLimitCents: 100_000_000 }));
    expect(result.current.blockedReason).toBe('Saving your changes…');

    await advance(300);
    expect(result.current.blockedReason).toBeNull();
  });
});

describe('leaving the page', () => {
  it('saves a change made less than a debounce before, without waiting', async () => {
    const api = fakeApi({ [PUT]: () => ok(draftQuote({ premiumCents: 300_000 })) });
    const { result, unmount, premiumInCache } = setup();

    act(() => result.current.update({ coverageLimitCents: 100_000_000 }));
    unmount();

    expect(api.callsTo(PUT)).toHaveLength(1);
    expect(api.callsTo(PUT)[0]?.body).toEqual({
      ...savedConfiguration,
      coverageLimitCents: 100_000_000,
    });

    // The pending timer was cancelled, and the saved quote is in the cache for the next visit.
    await advance(300);
    expect(api.callsTo(PUT)).toHaveLength(1);
    expect(premiumInCache()).toBe(300_000);
  });

  it('saves nothing when there is no change waiting', async () => {
    const api = fakeApi({ [PUT]: () => ok(draftQuote()) });
    const { result, unmount } = setup();

    unmount();
    expect(api.callsTo(PUT)).toHaveLength(0);

    const second = setup();
    act(() => second.result.current.update({ coverageLimitCents: 100_000_000 }));
    await advance(300);
    second.unmount();
    expect(api.callsTo(PUT)).toHaveLength(1);
    expect(result.current.isUpdating).toBe(false);
  });
});

describe('a quote that changed elsewhere', () => {
  const updatedElsewhere = {
    company: company({ annualRevenueCents: 500_000_000 }),
    quote: draftQuote({ coverageLimitCents: 100_000_000, updatedAt: '2026-11-02T09:00:00.000Z' }),
  };

  it('shows what is saved when nothing is being saved here', () => {
    fakeApi({ [PUT]: () => ok(draftQuote()) });
    const { result, rerender } = setup();

    rerender(updatedElsewhere);

    expect(result.current.configuration).toMatchObject({
      annualRevenueCents: 500_000_000,
      coverageLimitCents: 100_000_000,
    });
  });

  it('keeps the broker’s changes while they are being saved', () => {
    fakeApi({ [PUT]: () => ok(draftQuote()) });
    const { result, rerender } = setup();

    act(() => result.current.update({ deductibleCents: 1_000_000 }));
    rerender(updatedElsewhere);

    expect(result.current.configuration).toEqual({
      ...savedConfiguration,
      deductibleCents: 1_000_000,
    });
  });
});
