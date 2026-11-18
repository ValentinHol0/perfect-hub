#!/usr/bin/env node
// render-icon — renders a plugin's assets/logo.svg to assets/icon.png (1024×1024) for the Claude plugin directory.
// Usage: node scripts/render-icon.mjs <plugin-root> [...more roots]   (Playwright from $PLAYWRIGHT_DIR or cwd)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const roots = process.argv.slice(2).map((r) => resolve(r));
if (!roots.length) { console.error('Usage: node scripts/render-icon.mjs <plugin-root> [...]'); process.exit(2); }
let chromium;
try { ({ chromium } = createRequire(join(resolve(process.env.PLAYWRIGHT_DIR || process.cwd()), 'package.json'))('playwright')); }
catch { console.error('Playwright not found (set PLAYWRIGHT_DIR to a folder that has it).'); process.exit(2); }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const root of roots) {
  const svg = readFileSync(join(root, 'assets', 'logo.svg'), 'utf8').replace('<svg ', '<svg width="1024" height="1024" ');
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'assets', 'icon.png'), omitBackground: true, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  console.log(join(root, 'assets', 'icon.png'));
}
await browser.close();
