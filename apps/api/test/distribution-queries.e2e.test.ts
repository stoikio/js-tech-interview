import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { PrismaService } from 'src/common/prisma/prisma.service';

import { createTestApp, resetDatabase } from './helpers';

// "A prospect is a company whose latest quote is a draft": the rule lives in the Prisma queries,
// and no use case creates a second quote for a company yet, so the rows are written directly.
describe('Distribution reads (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const api = () => request(app.getHttpServer());
  const day = (daysAgo: number) => new Date(Date.UTC(2026, 2, 15 - daysAgo));

  async function givenACompany(name: string, quotes: ('draft' | 'signed')[]) {
    const company = await prisma.db.company.create({
      data: { name, annualRevenueCents: 800_000_000n },
    });
    // Oldest first: the last one is the latest quote.
    for (const [index, status] of quotes.entries()) {
      const createdAt = day(quotes.length - index);
      await prisma.db.quote.create({
        data: {
          companyId: company.id,
          status,
          coverageLimitCents: 50_000_000,
          deductibleCents: 500_000,
          options: [],
          premiumCents: 150_000,
          pricingBreakdown: {},
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
    return company;
  }

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => app.close());

  it('lists as prospects the companies whose latest quote is a draft, by name', async () => {
    await givenACompany('Zeta Draft', ['draft']);
    await givenACompany('Alpha Reopened', ['signed', 'draft']);
    await givenACompany('Mid Client', ['draft', 'signed']);

    const { body } = await api().get('/api/prospects').expect(200);

    expect(body.map((prospect: { name: string }) => prospect.name)).toEqual([
      'Alpha Reopened',
      'Zeta Draft',
    ]);
  });

  it('shows the latest quote of a company', async () => {
    const company = await givenACompany('Alpha Reopened', ['signed', 'draft']);

    const { body } = await api().get(`/api/prospects/${company.id}`).expect(200);

    expect(body.quote).toMatchObject({ status: 'draft', contract: null });
  });

  it('answers 404 for an unknown prospect', async () => {
    const { body } = await api().get('/api/prospects/unknown').expect(404);

    expect(body.code).toBe('distribution.company.notFound');
  });

  it('lists the contracts, most recent first', async () => {
    const older = await givenACompany('Older', ['signed']);
    const newer = await givenACompany('Newer', ['signed']);
    for (const [company, startDate] of [
      [older, day(300)],
      [newer, day(10)],
    ] as const) {
      const quote = await prisma.db.quote.findFirstOrThrow({ where: { companyId: company.id } });
      await prisma.db.contract.create({
        data: {
          quoteId: quote.id,
          companyId: company.id,
          startDate,
          endDate: day(-60),
          premiumCents: 150_000,
          coverageLimitCents: 50_000_000,
          deductibleCents: 500_000,
          options: [],
        },
      });
    }

    const { body } = await api().get('/api/contracts').expect(200);

    expect(body.map((contract: { company: { name: string } }) => contract.company.name)).toEqual([
      'Newer',
      'Older',
    ]);
  });
});
