import { Company } from 'src/distribution/domain/company/company';
import { Quote } from 'src/distribution/domain/quote/quote';
import { DEFAULT_TERMS, PricedTerms } from 'src/distribution/domain/quote/quote-terms';
import { StubPremiumCalculator } from 'src/distribution/infra/adapters/premium-calculator.stub';

export const NOW = new Date('2026-03-15T10:00:00Z');

export const aCompany = (annualRevenueCents = 800_000_000) =>
  Company.create({ name: 'Acme Robotics', annualRevenueCents }, NOW);

/** A draft quote of `company`, with the default terms priced by the stub. */
export async function aDraftQuote(company: Company = aCompany()) {
  const priced = await PricedTerms.price(new StubPremiumCalculator(), {
    annualRevenueCents: company.annualRevenueCents,
    ...DEFAULT_TERMS,
  });
  return Quote.createDraft({ company, priced }, NOW);
}
