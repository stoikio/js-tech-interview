import { catalogOf, type PricingCatalog } from 'src/pricing/domain/catalog';
import { computePremium, type PricingInput, type PricingResult } from 'src/pricing/domain/premium';
import { PRICING_RULES } from 'src/pricing/domain/pricing-rules';

// The only place that decides which pricing rules are in force.

/** The premium of a quote under the pricing rules in force. */
export const priceQuote = (input: PricingInput): PricingResult =>
  computePremium(input, PRICING_RULES);

/** The choices brokers have under the pricing rules in force. */
export const pricingCatalog = (): PricingCatalog => catalogOf(PRICING_RULES);
