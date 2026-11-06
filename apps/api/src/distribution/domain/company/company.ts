import { Entity } from 'src/core/domain/entity';

export type CompanyProps = {
  name: string;
  annualRevenueCents: number;
  createdAt: Date;
};

/** The business being quoted or insured. */
export class Company extends Entity<CompanyProps> {
  static create(props: Omit<CompanyProps, 'createdAt'>, now: Date): Company {
    return new Company({ ...props, createdAt: now });
  }

  static hydrate(props: CompanyProps, id: string): Company {
    return new Company(props, id);
  }

  get annualRevenueCents(): number {
    return this.props.annualRevenueCents;
  }

  changeAnnualRevenue(annualRevenueCents: number): void {
    this.props.annualRevenueCents = annualRevenueCents;
  }
}
