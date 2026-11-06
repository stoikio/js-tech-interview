import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { ResourceNotFoundError } from 'src/core/domain/errors';
import { CompanyError } from 'src/distribution/domain/company/error';
import { ContractError } from 'src/distribution/domain/contract/error';
import {
  DistributionQueries,
  type ContractDetail,
  type ContractSummary,
  type ProspectSummary,
  type ProspectView,
} from 'src/distribution/domain/ports/distribution-queries.port';
import { CompanyMapper } from 'src/distribution/infra/mappers/company.mapper';
import { ContractMapper } from 'src/distribution/infra/mappers/contract.mapper';
import { QuoteMapper } from 'src/distribution/infra/mappers/quote.mapper';

const latestQuote = { orderBy: { createdAt: 'desc' }, take: 1 } as const;

/** Read models for the HTTP API. */
@Injectable()
export class PrismaDistributionQueries implements DistributionQueries {
  constructor(private readonly prisma: PrismaService) {}

  async listProspects(): Promise<ProspectSummary[]> {
    // The filter narrows the rows read; the latest quote decides who is a prospect.
    const companies = await this.prisma.db.company.findMany({
      where: { quotes: { some: { status: 'draft' } } },
      include: { quotes: latestQuote },
      orderBy: { name: 'asc' },
    });
    return companies.flatMap((company) => {
      const quote = company.quotes[0];
      // A company whose latest quote is signed is a client, not a prospect.
      if (quote?.status !== 'draft') return [];
      return {
        ...CompanyMapper.fromPrismaToDto(company),
        latestQuote: {
          id: quote.id,
          status: quote.status,
          premiumCents: quote.premiumCents,
          coverageLimitCents: quote.coverageLimitCents,
          deductibleCents: quote.deductibleCents,
          options: quote.options,
        },
      };
    });
  }

  async getProspect(companyId: string): Promise<ProspectView> {
    const company = await this.prisma.db.company.findUnique({
      where: { id: companyId },
      include: { quotes: { ...latestQuote, include: { contract: true } } },
    });
    if (!company) throw new ResourceNotFoundError(CompanyError.NotFound, 'Prospect not found');

    const quote = company.quotes[0];
    return {
      company: CompanyMapper.fromPrismaToDto(company),
      quote: quote
        ? {
            ...QuoteMapper.fromDomainToDto(QuoteMapper.fromPrismaToDomain(quote)),
            contract: quote.contract
              ? ContractMapper.fromDomainToDto(ContractMapper.fromPrismaToDomain(quote.contract))
              : null,
          }
        : null,
    };
  }

  async listContracts(): Promise<ContractSummary[]> {
    const contracts = await this.prisma.db.contract.findMany({
      include: { company: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' },
    });
    return contracts.map(({ company, ...row }) => ({
      ...ContractMapper.fromDomainToDto(ContractMapper.fromPrismaToDomain(row)),
      company,
    }));
  }

  async getContract(contractId: string): Promise<ContractDetail> {
    const row = await this.prisma.db.contract.findUnique({
      where: { id: contractId },
      include: { company: true },
    });
    if (!row) throw new ResourceNotFoundError(ContractError.NotFound, 'Contract not found');

    const { company, ...contract } = row;
    return {
      ...ContractMapper.fromDomainToDto(ContractMapper.fromPrismaToDomain(contract)),
      company: CompanyMapper.fromPrismaToDto(company),
    };
  }
}
