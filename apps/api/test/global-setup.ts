import { execSync } from 'node:child_process';

import { TEST_DATABASE_URL } from './test-database';

/** Applies the migrations to an empty test database before the e2e suites run. */
export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };
  // The test database is disposable: starting from an empty schema means a rewritten migration
  // history can never meet an older one.
  execSync('pnpm prisma db execute --stdin', {
    env,
    input: 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;',
    stdio: ['pipe', 'ignore', 'ignore'],
  });
  execSync('pnpm prisma migrate deploy', { env, stdio: 'ignore' });
}
