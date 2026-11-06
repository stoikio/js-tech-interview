import type { CoverageOption } from 'src/core/domain/coverage-option';
import type { QuoteStatus } from 'src/distribution/domain/quote/quote';

// Read models returned by the HTTP API. Money in cents.

export type CompanyView = {
  id: string;
  name: string;
  annualRevenueCents: number;
  createdAt: Date;
};

export type QuoteView = {
  id: string;
  companyId: string;
  status: QuoteStatus;
  coverageLimitCents: number;
  deductibleCents: number;
  options: CoverageOption[];
  premiumCents: number;
  pricingBreakdown: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type ContractView = {
  id: string;
  quoteId: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  premiumCents: number;
  coverageLimitCents: number;
  deductibleCents: number;
  options: CoverageOption[];
};

export type ProspectSummary = CompanyView & {
  latestQuote: Pick<
    QuoteView,
    'id' | 'status' | 'premiumCents' | 'coverageLimitCents' | 'deductibleCents' | 'options'
  >;
};

export type ProspectView = {
  company: CompanyView;
  /** The latest quote of the company. */
  quote: (QuoteView & { contract: ContractView | null }) | null;
};

export type ContractDetail = ContractView & { company: CompanyView };

export type ContractSummary = ContractView & {
  company: { id: string; name: string };
};

/**
 * Every read of the HTTP API. A prospect is a company whose latest quote is a draft,
 * and this port is the only place that knows it.
 */
export abstract class DistributionQueries {
  /** Companies whose latest quote is a draft, by name. */
  abstract listProspects(): Promise<ProspectSummary[]>;
  /** Fails with a ResourceNotFoundError when the company does not exist. */
  abstract getProspect(companyId: string): Promise<ProspectView>;
  /** Most recent first. */
  abstract listContracts(): Promise<ContractSummary[]>;
  /** Fails with a ResourceNotFoundError when the contract does not exist. */
  abstract getContract(contractId: string): Promise<ContractDetail>;
}
