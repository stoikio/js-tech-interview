import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import type { Company } from 'src/distribution/domain/company/company';
import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';
import { CompanyMapper } from 'src/distribution/infra/mappers/company.mapper';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Company | null> {
    const row = await this.prisma.db.company.findUnique({ where: { id } });
    return row ? CompanyMapper.fromPrismaToDomain(row) : null;
  }

  async save(company: Company): Promise<void> {
    const data = CompanyMapper.fromDomainToPrisma(company);
    await this.prisma.db.company.upsert({ where: { id: company.id }, create: data, update: data });
  }

  async delete(id: string): Promise<void> {
    // Its quotes go with it (onDelete: Cascade).
    await this.prisma.db.company.delete({ where: { id } });
  }
}
