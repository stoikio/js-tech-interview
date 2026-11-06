import { Contract } from 'src/distribution/domain/contract/contract';
import type { ContractView } from 'src/distribution/domain/ports/distribution-queries.port';
import type { Contract as ContractRow } from 'src/generated/prisma/client';

export class ContractMapper {
  static fromPrismaToDomain(row: ContractRow): Contract {
    const {
      id,
      coverageLimitCents,
      deductibleCents,
      options,
      createdAt: _c,
      updatedAt: _u,
      ...props
    } = row;
    return Contract.hydrate(
      { ...props, terms: { coverageLimitCents, deductibleCents, options } },
      id,
    );
  }

  static fromDomainToPrisma(contract: Contract) {
    const { terms, ...props } = contract.getProps();
    return { id: contract.id, ...props, ...terms };
  }

  /** Lists every field of the response: a new field of the contract is not published by accident. */
  static fromDomainToDto(contract: Contract): ContractView {
    const { quoteId, companyId, startDate, endDate, premiumCents, terms } = contract.getProps();
    return {
      id: contract.id,
      quoteId,
      companyId,
      startDate,
      endDate,
      premiumCents,
      coverageLimitCents: terms.coverageLimitCents,
      deductibleCents: terms.deductibleCents,
      options: terms.options,
    };
  }
}
