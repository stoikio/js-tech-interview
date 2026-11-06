import type {
  Company,
  Contract,
  DetailQuote,
  PricingBreakdown,
  PricingCatalog,
  ProspectDetail,
} from '../lib/types';

export const company = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  name: 'Acme',
  annualRevenueCents: 100_000_000,
  createdAt: '2026-11-01T10:00:00.000Z',
  ...overrides,
});

export const catalog = (): PricingCatalog => ({
  turnoverBrackets: [
    { minCents: 0, maxCents: 100_000_000 },
    { minCents: 100_000_000, maxCents: 500_000_000 },
  ],
  coverageLimitsCents: [50_000_000, 100_000_000],
  deductiblesCents: [500_000, 1_000_000],
  options: [
    'ransomware_extortion',
    'social_engineering_fraud',
    'business_interruption',
    'regulatory_fines',
  ],
});

const breakdown = (overrides: Partial<PricingBreakdown> = {}): PricingBreakdown => ({
  annualRevenueCents: 100_000_000,
  revenueBandMaxCents: 100_000_000,
  basePremiumCents: 200_000,
  coverageLimitCents: 50_000_000,
  limitFactor: 1,
  deductibleCents: 500_000,
  deductibleFactor: 1,
  coveragePremiumCents: 200_000,
  optionLoadings: [],
  totalLoadingPct: 0,
  ...overrides,
});

export const contract = (overrides: Partial<Contract> = {}): Contract => ({
  id: 'contract-1',
  quoteId: 'quote-1',
  companyId: 'company-1',
  startDate: '2026-11-06T00:00:00.000Z',
  endDate: '2027-11-06T00:00:00.000Z',
  premiumCents: 200_000,
  coverageLimitCents: 50_000_000,
  deductibleCents: 500_000,
  options: [],
  ...overrides,
});

/** A draft quote, priced by the API: its premium is the one of its breakdown. */
export const draftQuote = (overrides: Partial<DetailQuote> = {}): DetailQuote => ({
  id: 'quote-1',
  companyId: 'company-1',
  status: 'draft',
  coverageLimitCents: 50_000_000,
  deductibleCents: 500_000,
  options: [],
  premiumCents: 200_000,
  pricingBreakdown: breakdown(),
  updatedAt: '2026-11-01T10:00:00.000Z',
  contract: null,
  ...overrides,
});

export const prospectDetail = (overrides: Partial<ProspectDetail> = {}): ProspectDetail => ({
  company: company(),
  quote: draftQuote(),
  ...overrides,
});
