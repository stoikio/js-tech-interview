import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/** The server of the dev database, with the database made for the tests (docker/postgres-init.sql). */
function testDatabaseUrl(): string {
  const url = new URL(parseEnv(readFileSync('.env', 'utf8')).DATABASE_URL ?? '');
  url.pathname = '/stoik_lite_test';
  return url.toString();
}

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? testDatabaseUrl();
