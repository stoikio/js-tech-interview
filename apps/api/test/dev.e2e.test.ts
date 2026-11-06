import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './helpers';

describe('Developer routes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });
  afterAll(() => app.close());

  it('lists the API routes with their body schema', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/dev/routes').expect(200);

    expect(body).toContainEqual(
      expect.objectContaining({
        method: 'PUT',
        path: '/api/quotes/:quoteId',
        context: 'distribution',
        bodySchema: expect.objectContaining({
          required: ['annualRevenueCents', 'coverageLimitCents', 'deductibleCents', 'options'],
        }),
      }),
    );
    expect(body.map((route: { path: string }) => route.path)).not.toContain('/api/dev/routes');
  });
});
