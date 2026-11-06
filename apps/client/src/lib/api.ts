import type {
  Contract,
  ContractDetail,
  ContractListItem,
  PricingCatalog,
  ProspectDetail,
  ProspectListItem,
  Quote,
  QuoteConfiguration,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Validation errors have one message per field, as `field: message`. */
    readonly messages: string[],
    /** Domain errors have a stable code, such as `pricing.revenueNotEligible`. */
    readonly code?: string,
  ) {
    super(messages.join('. '));
  }
}

type ErrorBody = { message?: string | string[]; code?: string };

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error: ErrorBody | null = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      [error?.message ?? response.statusText].flat(),
      error?.code,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  pricingCatalog: () => request<PricingCatalog>('GET', '/pricing/catalog'),
  prospects: () => request<ProspectListItem[]>('GET', '/prospects'),
  prospect: (companyId: string) => request<ProspectDetail>('GET', `/prospects/${companyId}`),
  deleteProspect: (companyId: string) => request<void>('DELETE', `/prospects/${companyId}`),
  createProspect: (input: { name: string; annualRevenueCents: number }) =>
    request<{ id: string }>('POST', '/prospects', input),
  updateQuote: (quoteId: string, configuration: QuoteConfiguration) =>
    request<Quote>('PUT', `/quotes/${quoteId}`, configuration),
  validateQuote: (quoteId: string) => request<Contract>('POST', `/quotes/${quoteId}/validate`),
  contracts: () => request<ContractListItem[]>('GET', '/contracts'),
  contract: (contractId: string) => request<ContractDetail>('GET', `/contracts/${contractId}`),
};
