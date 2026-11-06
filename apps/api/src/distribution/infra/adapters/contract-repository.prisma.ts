import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { ConflictError } from 'src/core/domain/errors';
import type { Contract } from 'src/distribution/domain/contract/contract';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import { ContractMapper } from 'src/distribution/infra/mappers/contract.mapper';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsForCompany(companyId: string): Promise<boolean> {
    return (await this.prisma.db.contract.count({ where: { companyId } })) > 0;
  }

  async save(contract: Contract): Promise<void> {
    const data = ContractMapper.fromDomainToPrisma(contract);
    try {
      await this.prisma.db.contract.upsert({
        where: { id: contract.id },
        create: data,
        update: data,
      });
    } catch (error) {
      // Contract.quoteId is unique: another request signed the quote first.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(QuoteError.NotEditable, 'This quote is already signed');
      }
      throw error;
    }
  }
}
