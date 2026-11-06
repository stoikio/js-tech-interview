import { InMemoryContractRepository } from 'src/distribution/infra/adapters/contract-repository.in-memory';
import { InMemoryQuoteRepository } from 'src/distribution/infra/adapters/quote-repository.in-memory';

import { describeContractRepository } from './contracts/contract-repository.contract';
import { describeQuoteRepository } from './contracts/quote-repository.contract';

describeQuoteRepository('in-memory', async () => ({
  repository: new InMemoryQuoteRepository(),
  givenCompany: async () => {},
}));

describeContractRepository('in-memory', async () => ({
  repository: new InMemoryContractRepository(),
  givenQuote: async () => {},
}));
