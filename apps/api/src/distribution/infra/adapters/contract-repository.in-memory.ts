import { ConflictError } from 'src/core/domain/errors';
import type { Contract, ContractProps } from 'src/distribution/domain/contract/contract';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';

export class InMemoryContractRepository implements ContractRepository {
  readonly snapshots = new Map<string, ContractProps>();

  async existsForCompany(companyId: string): Promise<boolean> {
    return [...this.snapshots.values()].some((contract) => contract.companyId === companyId);
  }

  async save(contract: Contract): Promise<void> {
    const { quoteId } = contract.getProps();
    const quoteAlreadySigned = [...this.snapshots].some(
      ([id, saved]) => saved.quoteId === quoteId && id !== contract.id,
    );
    if (quoteAlreadySigned) {
      throw new ConflictError(QuoteError.NotEditable, 'This quote is already signed');
    }
    this.snapshots.set(contract.id, structuredClone(contract.getProps()));
  }
}
