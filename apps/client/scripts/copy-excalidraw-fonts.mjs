// Serves Excalidraw's fonts from the app (public/excalidraw-assets) instead of a CDN:
// diagrams render with the right font at once, and work offline.
// Skips Xiaolai (CJK, 12 MB): Excalidraw falls back to its CDN for it.
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const client = join(import.meta.dirname, '..');
const source = join(client, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'fonts');
const target = join(client, 'public', 'excalidraw-assets', 'fonts');

if (!existsSync(target)) {
  for (const family of readdirSync(source)) {
    if (family === 'Xiaolai') continue;
    cpSync(join(source, family), join(target, family), { recursive: true });
  }
  console.log(`Copied Excalidraw fonts to ${target}`);
}
