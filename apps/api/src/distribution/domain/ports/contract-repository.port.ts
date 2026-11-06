import type { Contract } from 'src/distribution/domain/contract/contract';

export abstract class ContractRepository {
  /** Fails with a ConflictError when the quote already has a contract. */
  abstract save(contract: Contract): Promise<void>;
  abstract existsForCompany(companyId: string): Promise<boolean>;
}
