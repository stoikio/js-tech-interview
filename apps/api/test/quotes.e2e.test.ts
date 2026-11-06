import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { PrismaService } from 'src/common/prisma/prisma.service';

import { createTestApp, prospectInput, resetDatabase } from './helpers';

describe('Quotes and contracts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let companyId: string;
  let quoteId: string;

  const api = () => request(app.getHttpServer());
  const configuration = {
    annualRevenueCents: 2_000_000_000, // 20M EUR
    coverageLimitCents: 100_000_000, // 1M EUR
    deductibleCents: 1_000_000, // 10k EUR
    options: ['ransomware_extortion', 'regulatory_fines'],
  };

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    companyId = (await api().post('/api/prospects').send(prospectInput).expect(201)).body.id;
    quoteId = (await api().get(`/api/prospects/${companyId}`)).body.quote.id;
  });
  afterAll(() => app.close());

  it('saves the configuration and the revenue, and returns the new premium', async () => {
    const { body } = await api().put(`/api/quotes/${quoteId}`).send(configuration).expect(200);

    // Base cover 2,600 EUR x 1.45 x 0.9 = 3,393 EUR, options 15% + 5% = 508.95 + 169.65 EUR
    expect(body.premiumCents).toBe(407_160);
    expect(body.pricingBreakdown).toMatchObject({
      coveragePremiumCents: 339_300,
      totalLoadingPct: 20,
    });
    const { body: prospect } = await api().get(`/api/prospects/${companyId}`);
    expect(prospect.company.annualRevenueCents).toBe(2_000_000_000);
    expect(prospect.quote.premiumCents).toBe(407_160);
  });

  it('stores an option once, so the quote and its contract list it once', async () => {
    const { body } = await api()
      .put(`/api/quotes/${quoteId}`)
      .send({
        ...configuration,
        options: ['regulatory_fines', 'regulatory_fines', 'ransomware_extortion'],
      })
      .expect(200);
    expect(body.options).toEqual(['regulatory_fines', 'ransomware_extortion']);

    const { body: contract } = await api().post(`/api/quotes/${quoteId}/validate`).expect(201);
    expect(contract.options).toEqual(['regulatory_fines', 'ransomware_extortion']);
  });

  it('rejects a coverage limit that is not offered', async () => {
    const { body } = await api()
      .put(`/api/quotes/${quoteId}`)
      .send({ ...configuration, coverageLimitCents: 123 })
      .expect(422);
    expect(body.code).toBe('pricing.unsupportedCoverageLimit');
  });

  it('signs the quote into a contract, then keeps it read-only', async () => {
    await api().put(`/api/quotes/${quoteId}`).send(configuration).expect(200);

    const { body: contract } = await api().post(`/api/quotes/${quoteId}/validate`).expect(201);
    expect(contract).toMatchObject({ quoteId, premiumCents: 407_160 });

    const { body: prospect } = await api().get(`/api/prospects/${companyId}`);
    expect(prospect.quote).toMatchObject({
      status: 'signed',
      contract: { id: contract.id },
    });
    await api().put(`/api/quotes/${quoteId}`).send(configuration).expect(409);
    await api().post(`/api/quotes/${quoteId}/validate`).expect(409);
    expect(await prisma.db.contract.count()).toBe(1);
    // A signed company is a client: it leaves the prospect list and cannot be deleted.
    expect((await api().get('/api/prospects').expect(200)).body).toEqual([]);
    await api().delete(`/api/prospects/${companyId}`).expect(409);
  });

  it('signs a quote once when two requests validate it at the same time', async () => {
    const answers = await Promise.all([
      api().post(`/api/quotes/${quoteId}/validate`),
      api().post(`/api/quotes/${quoteId}/validate`),
    ]);

    expect(answers.map((answer) => answer.status).sort()).toEqual([201, 409]);
    expect(await prisma.db.contract.count()).toBe(1);
  });

  it('never turns a signed quote back into a draft when an update races its validation', async () => {
    // Whatever the interleaving (the update may read the draft just before the validation signs
    // it), the answers are never a server failure and the data stays consistent.
    const [update, validation] = await Promise.all([
      api().put(`/api/quotes/${quoteId}`).send(configuration),
      api().post(`/api/quotes/${quoteId}/validate`),
    ]);

    expect([200, 409]).toContain(update.status);
    expect([201, 409]).toContain(validation.status);
    const quote = await prisma.db.quote.findUniqueOrThrow({ where: { id: quoteId } });
    expect(await prisma.db.contract.count()).toBe(quote.status === 'signed' ? 1 : 0);
    expect(quote.status === 'signed').toBe(validation.status === 201);
  });

  it('validates a quote as soon as it is priced', async () => {
    await api().post(`/api/quotes/${quoteId}/validate`).expect(201);

    expect(await prisma.db.contract.count()).toBe(1);
  });

  it('shows a contract with its company', async () => {
    const { body: signed } = await api().post(`/api/quotes/${quoteId}/validate`).expect(201);

    const { body } = await api().get(`/api/contracts/${signed.id}`).expect(200);

    expect(body).toMatchObject({
      id: signed.id,
      quoteId,
      premiumCents: 150_000,
      coverageLimitCents: 50_000_000,
      deductibleCents: 500_000,
      options: [],
      company: { id: companyId, name: 'Acme Robotics', annualRevenueCents: 800_000_000 },
    });
  });

  it('answers 404 for an unknown contract', async () => {
    const { body } = await api().get('/api/contracts/unknown').expect(404);

    expect(body.code).toBe('distribution.contract.notFound');
  });

  it('lists the contracts', async () => {
    await api().post(`/api/quotes/${quoteId}/validate`).expect(201);

    const { body } = await api().get('/api/contracts').expect(200);
    expect(body).toEqual([
      expect.objectContaining({ company: expect.objectContaining({ id: companyId }) }),
    ]);
  });
});
