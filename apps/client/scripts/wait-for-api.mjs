// Holds the dev server back until the API answers, so the first page load does not hit a Bad
// Gateway while `pnpm dev` is still compiling the API. Gives up after a minute and starts anyway:
// a broken API shows its own error in the terminal.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const env = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
const apiUrl = env.API_URL ?? 'http://localhost:3001';
const deadline = Date.now() + 60_000;

while (Date.now() < deadline) {
  try {
    await fetch(`${apiUrl}/api/pricing/catalog`, { signal: AbortSignal.timeout(2_000) });
    process.exit(0);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
console.warn(`The API did not answer on ${apiUrl} after 60 s: starting the client anyway.`);
