import type { Company } from 'src/distribution/domain/company/company';

export abstract class CompanyRepository {
  abstract findById(id: string): Promise<Company | null>;
  abstract save(company: Company): Promise<void>;
  /** Also deletes the company's quotes. */
  abstract delete(id: string): Promise<void>;
}
