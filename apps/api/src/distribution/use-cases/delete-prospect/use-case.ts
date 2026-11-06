import { Injectable } from '@nestjs/common';

import { ConflictError, ResourceNotFoundError } from 'src/core/domain/errors';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import { CompanyError } from 'src/distribution/domain/company/error';
import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';

export type DeleteProspectCommand = { companyId: string };

/** Deletes a prospect with its quotes. A company with a contract is a client: it stays. */
@Injectable()
export class DeleteProspectUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly contractRepository: ContractRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute({ companyId }: DeleteProspectCommand): Promise<void> {
    await this.unitOfWork.runInTransaction(async () => {
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new ResourceNotFoundError(CompanyError.NotFound, 'Prospect not found');
      }
      if (await this.contractRepository.existsForCompany(companyId)) {
        throw new ConflictError(
          CompanyError.HasContracts,
          'A company with a contract cannot be deleted',
        );
      }
      await this.companyRepository.delete(companyId);
    });
  }
}
