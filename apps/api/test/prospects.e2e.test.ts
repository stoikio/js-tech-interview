import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { PrismaService } from 'src/common/prisma/prisma.service';

import { createTestApp, prospectInput, resetDatabase } from './helpers';

describe('Prospects (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => app.close());

  it('creates a company and its draft quote, priced by the pricing context', async () => {
    const { body: created } = await api().post('/api/prospects').send(prospectInput).expect(201);
    const { body } = await api().get(`/api/prospects/${created.id}`).expect(200);

    expect(body.company).toMatchObject(prospectInput);
    expect(body.quote).toMatchObject({
      status: 'draft',
      coverageLimitCents: 50_000_000,
      deductibleCents: 500_000,
      options: [],
      premiumCents: 150_000, // 1,500 EUR base premium, every factor at 1
      contract: null,
    });
  });

  it('rejects a company above the maximum eligible revenue and saves nothing', async () => {
    const { body } = await api()
      .post('/api/prospects')
      .send({ ...prospectInput, annualRevenueCents: 5_000_000_001 })
      .expect(422);

    expect(body).toMatchObject({ code: 'pricing.revenueNotEligible' });
    expect(await prisma.db.company.count()).toBe(0);
  });

  it('rejects an invalid body', async () => {
    await api()
      .post('/api/prospects')
      .send({ ...prospectInput, name: ' ' })
      .expect(400);
  });

  it('lists the prospects', async () => {
    await api().post('/api/prospects').send(prospectInput).expect(201);

    const { body } = await api().get('/api/prospects').expect(200);

    expect(body).toEqual([
      expect.objectContaining({
        name: 'Acme Robotics',
        latestQuote: expect.objectContaining({
          premiumCents: 150_000,
          coverageLimitCents: 50_000_000,
          deductibleCents: 500_000,
          options: [],
        }),
      }),
    ]);
  });

  it('deletes a prospect, with its quote', async () => {
    const { body: created } = await api().post('/api/prospects').send(prospectInput).expect(201);

    await api().delete(`/api/prospects/${created.id}`).expect(204);

    await api().get(`/api/prospects/${created.id}`).expect(404);
    expect(await prisma.db.quote.count()).toBe(0);
  });
});
