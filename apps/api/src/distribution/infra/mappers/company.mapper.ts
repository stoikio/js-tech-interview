import { Company } from 'src/distribution/domain/company/company';
import type { CompanyView } from 'src/distribution/domain/ports/distribution-queries.port';
import type { Company as CompanyRow } from 'src/generated/prisma/client';

// Up to 50M EUR, far below Number.MAX_SAFE_INTEGER cents.
const toCents = (annualRevenueCents: bigint): number => Number(annualRevenueCents);

export class CompanyMapper {
  static fromPrismaToDomain(row: CompanyRow): Company {
    return Company.hydrate(
      {
        name: row.name,
        annualRevenueCents: toCents(row.annualRevenueCents),
        createdAt: row.createdAt,
      },
      row.id,
    );
  }

  static fromDomainToPrisma(company: Company) {
    const { annualRevenueCents, ...props } = company.getProps();
    return { id: company.id, ...props, annualRevenueCents: BigInt(annualRevenueCents) };
  }

  static fromPrismaToDto(row: CompanyRow): CompanyView {
    return {
      id: row.id,
      name: row.name,
      annualRevenueCents: toCents(row.annualRevenueCents),
      createdAt: row.createdAt,
    };
  }
}
