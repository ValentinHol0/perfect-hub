// Run: node --test scripts/tests/site-check.test.mjs   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkPage, run } from '../site-check.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'site-check.mjs');
const ids = (r) => r.issues.map((i) => i.id);

const GOOD = `<!doctype html><html lang="uk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Кава Обрій — свіжообсмажена кава з Києва</title>
<meta name="description" content="Обсмажуємо щочетверга і відправляємо Новою поштою в день обсмаження. Зерно з Ефіопії, Колумбії та Кенії.">
<link rel="canonical" href="https://obrii.coffee/">
<link rel="alternate" hreflang="uk" href="https://obrii.coffee/"><link rel="alternate" hreflang="en" href="https://obrii.coffee/en/"><link rel="alternate" hreflang="x-default" href="https://obrii.coffee/">
<meta property="og:title" content="Кава Обрій"><meta property="og:description" content="Свіжообсмажена кава"><meta property="og:image" content="https://obrii.coffee/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Обрій"}</script>
</head><body><main><h1>Кава Обрій</h1><img src="/hero.avif" alt="Мішки з кавою" width="1200" height="800" fetchpriority="high">
<h2>Сорти</h2><a href="/shop">Магазин</a><a href="#sorts">До сортів</a><button aria-label="Відкрити меню"><svg aria-hidden="true"></svg></button>
<label for="email">Email</label><input id="email" type="email"><label>Імʼя <input name="name"></label></main></body></html>`;

test('site-check: a well-formed page has no issues', () => {
  const r = checkPage(GOOD, { url: 'https://obrii.coffee/' });
  assert.deepEqual(r.issues, []);
});

test('site-check: head, social, structured data and accessibility problems are found', () => {
  const bad = `<html><head><meta name="viewport" content="width=device-width, maximum-scale=1"><title>Hi</title>
<meta property="og:image" content="/og.png"><meta name="robots" content="noindex">
<script type="application/ld+json">{"@type": "Product",}</script></head>
<body><h1>A</h1><h1>B</h1><h4>Deep</h4><img src="a.png"><img src="b.png" alt="" loading="lazy" width="1" height="1">
<a href="/x"></a><a href="#">Open</a><button><svg></svg></button><input type="text" placeholder="Name">
<div id="x"></div><div id="x"></div><iframe src="https://maps.example"></iframe>
<img src="http://cdn.example.com/c.png" alt="c" width="1" height="1"><a href="http://localhost:3000/admin">admin</a></body></html>`;
  const r = checkPage(bad, { url: 'https://shop.example/' });
  const got = ids(r);
  for (const id of ['html-lang', 'charset', 'viewport-zoom', 'title-length', 'description', 'canonical', 'og-missing', 'og-image-relative', 'twitter-card', 'favicon', 'apple-touch-icon', 'jsonld-invalid', 'h1-count', 'heading-skip', 'img-alt', 'img-dimensions', 'duplicate-id', 'link-name', 'link-as-button', 'button-name', 'input-label', 'iframe-title', 'noindex', 'mixed-content', 'localhost-url'])
    assert.ok(got.includes(id), `missing ${id}: ${got.join(',')}`);
  assert.equal(r.issues.find((i) => i.id === 'noindex').level, 'warn');
  assert.equal(checkPage(bad, { prod: true }).issues.find((i) => i.id === 'noindex').level, 'error');
});

test('site-check: hreflang codes and self-reference', () => {
  const page = GOOD.replace('hreflang="en"', 'hreflang="english"').replace('<link rel="alternate" hreflang="uk" href="https://obrii.coffee/">', '').replace('<link rel="alternate" hreflang="x-default" href="https://obrii.coffee/">', '');
  const got = ids(checkPage(page));
  assert.ok(got.includes('hreflang-code') && got.includes('hreflang-self') && got.includes('hreflang-default'), got.join(','));
});

test('site-check: folder mode checks robots, sitemap, 404 and duplicate titles; CLI exit codes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-site-'));
  writeFileSync(join(dir, 'index.html'), GOOD);
  mkdirSync(join(dir, 'about'));
  writeFileSync(join(dir, 'about', 'index.html'), GOOD);
  writeFileSync(join(dir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(join(dir, 'sitemap.xml'), '<?xml version="1.0"?><urlset><url><loc>/about/</loc></url><url><loc>http://localhost:4321/</loc></url></urlset>');
  const r = await run([dir]);
  const site = r.site.map((s) => s.id);
  for (const id of ['robots-disallow-all', 'sitemap-relative', 'sitemap-localhost', '404-missing', 'duplicate-title', 'duplicate-description']) assert.ok(site.includes(id), `missing ${id}: ${site.join(',')}`);
  const cli = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  assert.equal(cli.status, 1, cli.stdout); // sitemap errors
  assert.match(cli.stdout, /site-check: 2 page\(s\)/);
  writeFileSync(join(dir, 'sitemap.xml'), '<?xml version="1.0"?><urlset><url><loc>https://obrii.coffee/</loc></url></urlset>');
  writeFileSync(join(dir, '404.html'), GOOD.replace('<title>Кава Обрій — свіжообсмажена кава з Києва</title>', '<title>Сторінку не знайдено — Кава Обрій</title>').replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Такої сторінки немає. Поверніться на головну або відкрийте магазин свіжообсмаженої кави.">'));
  const ok = spawnSync(process.execPath, [SCRIPT, join(dir, '404.html'), '--json'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stdout);
  assert.equal(JSON.parse(ok.stdout).errors, 0);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' }).status, 2);
});
