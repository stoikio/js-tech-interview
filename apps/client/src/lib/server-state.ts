import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api } from './api';
import type { ContractDetail, ProspectDetail, Quote, QuoteConfiguration } from './types';

/**
 * What the client holds of the API's data. Pages read and change it through this module only: it
 * owns the query keys and decides what goes stale after each change, so a page never has to know
 * which other pages show the same data. Callers keep what is theirs: toasts and navigation.
 */

export const queryKeys = {
  prospects: ['prospects'] as const,
  prospect: (companyId: string) => ['prospect', companyId] as const,
  contracts: ['contracts'] as const,
  contract: (contractId: string) => ['contract', contractId] as const,
  pricingCatalog: ['pricing-catalog'] as const,
};

export const useProspects = () =>
  useQuery({ queryKey: queryKeys.prospects, queryFn: api.prospects });

export const useProspect = (companyId: string) =>
  useQuery({ queryKey: queryKeys.prospect(companyId), queryFn: () => api.prospect(companyId) });

export const useContracts = () =>
  useQuery({ queryKey: queryKeys.contracts, queryFn: api.contracts });

export const useContract = (contractId: string) =>
  useQuery({ queryKey: queryKeys.contract(contractId), queryFn: () => api.contract(contractId) });

/**
 * The choices a broker can make. It only changes with a release of the API, so it is fetched once.
 * A failure is an error to show: every page that needs the catalog renders `catalog.error`.
 */
export const usePricingCatalog = () =>
  useQuery({
    queryKey: queryKeys.pricingCatalog,
    queryFn: api.pricingCatalog,
    staleTime: Infinity,
  });

export function useCreateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createProspect,
    // Not awaited: the caller moves on without waiting for a list to refetch.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.prospects }),
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => api.deleteProspect(companyId),
    onSuccess: (_, companyId) => {
      // Removed, not invalidated: a cached prospect would show again, deleted, while it refetches.
      queryClient.removeQueries({ queryKey: queryKeys.prospect(companyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.prospects });
    },
  });
}

/** Signs a draft quote: the company stops being a prospect and gets a contract. */
export function useValidateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) => api.validateQuote(quoteId),
    onSuccess: (contract) => {
      // Removed, not invalidated: the cached draft would show an editable form for a signed
      // quote until the refetch redirects to its contract.
      queryClient.removeQueries({ queryKey: queryKeys.prospect(contract.companyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.prospects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.contracts });
    },
  });
}

/**
 * Saving a draft quote is split in two because the caller sorts out the responses: it applies the
 * one of the latest change only, so that a slow response to an older change cannot overwrite it.
 */
export function useQuoteUpdates(companyId: string) {
  const queryClient = useQueryClient();
  return useMemo(
    () => ({
      /** The API saves the configuration and its company's turnover, then reprices the quote. */
      save: (quoteId: string, configuration: QuoteConfiguration) =>
        api.updateQuote(quoteId, configuration),

      /** Shows a saved quote where the prospect appears: its page now, the list when it opens. */
      applySaved: (quote: Quote, configuration: QuoteConfiguration) => {
        // The response has no company, but its turnover was saved with the quote.
        queryClient.setQueryData<ProspectDetail>(queryKeys.prospect(companyId), (detail) =>
          detail?.quote
            ? {
                ...detail,
                company: {
                  ...detail.company,
                  annualRevenueCents: configuration.annualRevenueCents,
                },
                quote: { ...detail.quote, ...quote },
              }
            : detail,
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.prospects });
      },
    }),
    [queryClient, companyId],
  );
}

/** For the toolbox, which fills its forms with what the open page shows. Never fetches. */
export const readCachedProspect = (queryClient: QueryClient, companyId: string) =>
  queryClient.getQueryData<ProspectDetail>(queryKeys.prospect(companyId));

export const readCachedContract = (queryClient: QueryClient, contractId: string) =>
  queryClient.getQueryData<ContractDetail>(queryKeys.contract(contractId));
