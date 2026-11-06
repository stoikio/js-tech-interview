import { Injectable } from '@nestjs/common';

import {
  PremiumCalculator,
  type PremiumRequest,
  type QuotePricing,
} from 'src/distribution/domain/ports/premium-calculator.port';
import { priceQuote } from 'src/pricing/public-api';

/** Prices quotes with the pricing context, in the same process. */
@Injectable()
export class InProcessPremiumCalculator implements PremiumCalculator {
  async price(request: PremiumRequest): Promise<QuotePricing> {
    return priceQuote(request);
  }
}
