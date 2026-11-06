import { Company, type CompanyProps } from 'src/distribution/domain/company/company';
import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';

export class InMemoryCompanyRepository implements CompanyRepository {
  readonly snapshots = new Map<string, CompanyProps>();

  async findById(id: string): Promise<Company | null> {
    const props = this.snapshots.get(id);
    return props ? Company.hydrate(structuredClone(props), id) : null;
  }

  async save(company: Company): Promise<void> {
    this.snapshots.set(company.id, structuredClone(company.getProps()));
  }

  async delete(id: string): Promise<void> {
    this.snapshots.delete(id);
  }
}
