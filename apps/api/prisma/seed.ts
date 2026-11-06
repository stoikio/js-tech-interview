// Demo data. Every date is relative to today so the data stays meaningful.
//
//   pnpm db:reset           drop, migrate and seed
//   tsx prisma/seed.ts --if-empty   seed only when the database has no company
import { PrismaPg } from '@prisma/adapter-pg';

import { config } from 'src/common/config';
import { startOfDayUtc } from 'src/core/domain/dates';
import { Contract } from 'src/distribution/domain/contract/contract';
import { PrismaClient } from 'src/generated/prisma/client';
import type { CoverageOption } from 'src/generated/prisma/enums';
import { priceQuote } from 'src/pricing/public-api';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.DATABASE_URL }),
});

const today = startOfDayUtc(new Date());
const daysFromToday = (days: number) => new Date(today.getTime() + days * 86_400_000);

// ─── Companies ──────────────────────────────────────────────────────────────

type Terms = { limitEur: number; deductibleEur: number; options: CoverageOption[] };

type ContractSpec = {
  /** Days between the signature, which starts the contract, and today. */
  signedDaysAgo: number;
  terms?: Terms;
};

type CompanySpec = {
  name: string;
  revenueEur: number;
  /** Signed quote. */
  contract?: ContractSpec;
  /** Open draft quote. */
  draft?: Terms;
};

const standard: Terms = { limitEur: 500_000, deductibleEur: 5_000, options: [] };

const companies: CompanySpec[] = [
  // Prospects with a draft quote
  {
    name: 'Boulangerie Martin',
    revenueEur: 1_200_000,
    draft: standard,
  },
  {
    name: 'Nimbus Analytics',
    revenueEur: 8_500_000,
    draft: { limitEur: 1_000_000, deductibleEur: 10_000, options: ['ransomware_extortion'] },
  },
  {
    name: 'Optique Durand',
    revenueEur: 2_100_000,
    draft: { limitEur: 250_000, deductibleEur: 1_000, options: [] },
  },
  {
    name: 'Mercury Logistics',
    revenueEur: 49_200_000,
    draft: { limitEur: 2_000_000, deductibleEur: 25_000, options: ['social_engineering_fraud'] },
  },

  // Contracts, from the most recent to the oldest
  {
    name: 'Horizon Voyages',
    revenueEur: 4_200_000,
    contract: { signedDaysAgo: 12 },
  },
  {
    name: 'Quincaillerie Roux',
    revenueEur: 950_000,
    contract: { signedDaysAgo: 120 },
  },
  {
    name: 'Groupe Vauban',
    revenueEur: 14_000_000,
    contract: {
      signedDaysAgo: 200,
      terms: { limitEur: 1_000_000, deductibleEur: 10_000, options: ['business_interruption'] },
    },
  },
  {
    name: 'Clinique des Lilas',
    revenueEur: 18_000_000,
    contract: {
      signedDaysAgo: 275,
      terms: { limitEur: 2_000_000, deductibleEur: 10_000, options: ['regulatory_fines'] },
    },
  },
  {
    name: 'Nordic Software',
    revenueEur: 12_000_000,
    contract: {
      signedDaysAgo: 306,
      terms: {
        limitEur: 1_000_000,
        deductibleEur: 5_000,
        options: ['ransomware_extortion', 'social_engineering_fraud'],
      },
    },
  },
  {
    name: 'École Montessori Soleil',
    revenueEur: 1_100_000,
    contract: { signedDaysAgo: 364 },
  },
];

// ─── Seeding ────────────────────────────────────────────────────────────────

async function createQuote(
  data: { companyId: string; revenueEur: number; terms: Terms; createdAt: Date },
  status: 'draft' | 'signed',
) {
  const input = {
    annualRevenueCents: data.revenueEur * 100,
    coverageLimitCents: data.terms.limitEur * 100,
    deductibleCents: data.terms.deductibleEur * 100,
    options: data.terms.options,
  };
  const { premiumCents, breakdown } = priceQuote(input);
  return prisma.quote.create({
    data: {
      companyId: data.companyId,
      status,
      coverageLimitCents: input.coverageLimitCents,
      deductibleCents: input.deductibleCents,
      options: input.options,
      premiumCents,
      pricingBreakdown: breakdown,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    },
  });
}

async function seedCompany(spec: CompanySpec) {
  const startDate = spec.contract ? daysFromToday(-spec.contract.signedDaysAgo) : null;
  const company = await prisma.company.create({
    data: {
      name: spec.name,
      annualRevenueCents: BigInt(spec.revenueEur * 100),
      createdAt: startDate ? new Date(startDate.getTime() - 15 * 86_400_000) : daysFromToday(-5),
    },
  });

  if (spec.contract && startDate) {
    const quote = await createQuote(
      {
        companyId: company.id,
        revenueEur: spec.revenueEur,
        terms: spec.contract.terms ?? standard,
        createdAt: new Date(startDate.getTime() - 10 * 86_400_000),
      },
      'signed',
    );
    // The contract starts and ends as it would if the quote were validated that day.
    const { endDate } = Contract.start(
      {
        quoteId: quote.id,
        companyId: company.id,
        premiumCents: quote.premiumCents,
        terms: {
          coverageLimitCents: quote.coverageLimitCents,
          deductibleCents: quote.deductibleCents,
          options: quote.options,
        },
      },
      startDate,
    ).getProps();
    await prisma.contract.create({
      data: {
        quoteId: quote.id,
        companyId: company.id,
        startDate,
        endDate,
        premiumCents: quote.premiumCents,
        coverageLimitCents: quote.coverageLimitCents,
        deductibleCents: quote.deductibleCents,
        options: quote.options,
        createdAt: startDate,
      },
    });
  }

  if (spec.draft) {
    await createQuote(
      {
        companyId: company.id,
        revenueEur: spec.revenueEur,
        terms: spec.draft,
        createdAt: daysFromToday(-3),
      },
      'draft',
    );
  }
}

async function main() {
  if (process.argv.includes('--if-empty') && (await prisma.company.count()) > 0) {
    console.log('Database already seeded, skipping. Run `pnpm db:reset` to start over.');
    return;
  }
  for (const company of companies) {
    await seedCompany(company);
  }
  console.log(`Seeded ${companies.length} companies.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
