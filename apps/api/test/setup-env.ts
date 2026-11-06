import { TEST_DATABASE_URL } from './test-database';

// Must run before src/config.ts is loaded: the e2e tests never touch the dev database.
process.env.DATABASE_URL = TEST_DATABASE_URL;
