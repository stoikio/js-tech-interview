// Creates every .env from its .env.example on the first run, then the root .env that Docker
// Compose reads, so that Postgres is published on the port of DATABASE_URL (apps/api/.env).
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { isPortFree } from './ports.mjs';

const folders = ['apps/api', 'apps/client'];

for (const folder of folders) {
  const example = `${folder}/.env.example`;
  const target = `${folder}/.env`;
  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target);
    console.log(`Created ${target} from ${example}`);
    if (folder === 'apps/api') await choosePostgresPort(target);
  }
}

const databaseUrl = new URL(parseEnv(readFileSync('apps/api/.env', 'utf8')).DATABASE_URL);
writeFileSync(
  '.env',
  `# Written by scripts/setup-env.mjs: change the port in DATABASE_URL (apps/api/.env) instead.\nPOSTGRES_PORT=${databaseUrl.port || 5432}\n`,
);

/** Another Postgres often runs on the default port: take the next free one instead. */
async function choosePostgresPort(envFile) {
  const content = readFileSync(envFile, 'utf8');
  const url = new URL(parseEnv(content).DATABASE_URL);
  const preferred = Number(url.port);
  for (let port = preferred; port < preferred + 10; port += 1) {
    if (!(await isPortFree(port))) continue;
    if (port !== preferred) {
      url.port = String(port);
      writeFileSync(envFile, content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${url}`));
      console.log(`Port ${preferred} is taken: Postgres will use port ${port}.`);
    }
    return;
  }
}
