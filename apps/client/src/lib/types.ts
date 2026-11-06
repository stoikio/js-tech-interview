// Shapes of the API responses (see apps/api). Money is in cents, dates are ISO strings.

export type QuoteStatus = 'draft' | 'signed';
export type CoverageOption =
  | 'ransomware_extortion'
  | 'social_engineering_fraud'
  | 'business_interruption'
  | 'regulatory_fines';

export type Company = {
  id: string;
  name: string;
  annualRevenueCents: number;
  createdAt: string;
};

export type PricingBreakdown = {
  annualRevenueCents: number;
  revenueBandMaxCents: number;
  basePremiumCents: number;
  coverageLimitCents: number;
  limitFactor: number;
  deductibleCents: number;
  deductibleFactor: number;
  coveragePremiumCents: number;
  optionLoadings: { option: CoverageOption; loadingPct: number; premiumCents: number }[];
  totalLoadingPct: number;
};

export type QuoteConfiguration = {
  annualRevenueCents: number;
  coverageLimitCents: number;
  deductibleCents: number;
  options: CoverageOption[];
};

export type Quote = Omit<QuoteConfiguration, 'annualRevenueCents'> & {
  id: string;
  companyId: string;
  status: QuoteStatus;
  premiumCents: number;
  pricingBreakdown: PricingBreakdown;
  updatedAt: string;
};

export type Contract = {
  id: string;
  quoteId: string;
  companyId: string;
  startDate: string;
  endDate: string;
  premiumCents: number;
  coverageLimitCents: number;
  deductibleCents: number;
  options: CoverageOption[];
};

/** A company whose latest quote is a draft. */
export type ProspectListItem = Company & {
  latestQuote: Pick<
    Quote,
    'id' | 'status' | 'premiumCents' | 'coverageLimitCents' | 'deductibleCents' | 'options'
  >;
};

export type DetailQuote = Quote & { contract: Contract | null };

export type ProspectDetail = {
  company: Company;
  /** The latest quote of the company. */
  quote: DetailQuote | null;
};

/** A contract with its company. */
export type ContractDetail = Contract & { company: Company };

export type ContractListItem = Contract & {
  company: { id: string; name: string };
};

/** The choices a broker can make on a quote. */
export type PricingCatalog = {
  turnoverBrackets: { minCents: number; maxCents: number }[];
  coverageLimitsCents: number[];
  deductiblesCents: number[];
  options: CoverageOption[];
};
