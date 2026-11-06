import { StubClock } from 'src/core/infra/adapters/clock.stub';
import { NoopUnitOfWork } from 'src/core/infra/adapters/unit-of-work.noop';
import { InMemoryCompanyRepository } from 'src/distribution/infra/adapters/company-repository.in-memory';
import { InMemoryContractRepository } from 'src/distribution/infra/adapters/contract-repository.in-memory';
import { StubPremiumCalculator } from 'src/distribution/infra/adapters/premium-calculator.stub';
import { InMemoryQuoteRepository } from 'src/distribution/infra/adapters/quote-repository.in-memory';
import { CreateProspectUseCase } from 'src/distribution/use-cases/create-prospect/use-case';
import { DeleteProspectUseCase } from 'src/distribution/use-cases/delete-prospect/use-case';
import { UpdateQuoteUseCase } from 'src/distribution/use-cases/update-quote/use-case';
import { ValidateQuoteUseCase } from 'src/distribution/use-cases/validate-quote/use-case';

/** The distribution use cases wired to in-memory adapters. */
export class DistributionFixture {
  readonly clock = new StubClock(new Date('2026-03-15T10:00:00Z'));
  readonly companies = new InMemoryCompanyRepository();
  readonly quotes = new InMemoryQuoteRepository();
  readonly contracts = new InMemoryContractRepository();
  private readonly premiumCalculator = new StubPremiumCalculator();
  private readonly unitOfWork = new NoopUnitOfWork();

  readonly createProspect = new CreateProspectUseCase(
    this.companies,
    this.quotes,
    this.premiumCalculator,
    this.unitOfWork,
    this.clock,
  );
  readonly deleteProspect = new DeleteProspectUseCase(
    this.companies,
    this.contracts,
    this.unitOfWork,
  );
  readonly updateQuote = new UpdateQuoteUseCase(
    this.quotes,
    this.companies,
    this.premiumCalculator,
    this.unitOfWork,
    this.clock,
  );
  readonly validateQuote = new ValidateQuoteUseCase(
    this.quotes,
    this.contracts,
    this.unitOfWork,
    this.clock,
  );

  /** Creates a prospect and returns its draft quote. */
  async givenADraftQuote(annualRevenueCents = 800_000_000) {
    const { companyId } = await this.createProspect.execute({
      name: 'Acme Robotics',
      annualRevenueCents,
    });
    const [[quoteId]] = [...this.quotes.snapshots].filter(([, q]) => q.companyId === companyId);
    return { companyId, quoteId };
  }

  quote(quoteId: string) {
    const props = this.quotes.snapshots.get(quoteId);
    if (!props) throw new Error(`No quote ${quoteId}`);
    return props;
  }
}
