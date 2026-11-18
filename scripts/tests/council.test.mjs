// Run: node --test scripts/tests/council.test.mjs   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validate, shuffle, parseCriteria } from '../council.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'council.mjs');
const run = (dir, ...a) => spawnSync(process.execPath, [SCRIPT, ...a], { cwd: dir, encoding: 'utf8' });
const ok = (r) => { assert.equal(r.status, 0, r.stdout + r.stderr); return r.stdout.trim(); };

const R1 = (pos, extra = '') => `## Position\n${pos}\n## Reasons\n1. Fast path — evidence: src/app/page.tsx:12\n2. Cheap — evidence: https://nextjs.org/docs\n## Assumptions\n- 2000 products\n## Top risk\nBuild time\n## Wrong if\nISR misses stock updates\n## Cost & reversibility\nLow, reversible\n## Confidence: 4/5\n## What others will miss\nImage CDN cost ${extra}`;
const crit = (labels, scores) => labels.map((L, i) => `### ${L}\nFlaws:\n- [F1] (MAJOR) misses stock freshness — a sold-out item stays buyable for an hour — evidence: no revalidate in src/lib/catalog.ts\nCredit: per-category static pages — they keep LCP under 2.5 s on 3G because the HTML is cached at the edge\nScores: ${scores[i]}`).join('\n\n') + `\n\nFINAL RANKING: ${labels.join(' > ')}\n`;

test('council: shuffle is deterministic per seed and keeps elements', () => {
  const a = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(shuffle(a, 'x'), shuffle(a, 'x'));
  assert.deepEqual([...shuffle(a, 'x')].sort(), a);
  assert.deepEqual(parseCriteria('Correctness:3, Craft:1'), { Correctness: 3, Craft: 1 });
});

test('council: R1/R2/R3 schema validation catches missing sections, generic credit, missing scores and majority appeals', () => {
  assert.deepEqual(validate('r1', R1('Astro islands')), []);
  const bad = validate('r1', '## Position\nUse Next\n## Reasons\n1. because');
  assert.ok(bad.some((e) => /Assumptions/.test(e)) && bad.some((e) => /N\/5/.test(e)) && bad.some((e) => /evidence/.test(e)));
  const criteria = { Correctness: 3, Risk: 3 };
  assert.deepEqual(validate('r2', crit(['P-A', 'P-B'], ['Correctness=4 Risk=3', 'Correctness=2 Risk=2']), { criteria, labels: ['P-A', 'P-B'] }), []);
  const generic = crit(['P-A'], ['Correctness=4 Risk=3']).replace(/^Credit: .*$/m, 'Credit: good idea');
  assert.ok(validate('r2', generic, { criteria, labels: ['P-A'] }).some((e) => /generic credit/.test(e)));
  const noScore = crit(['P-A'], ['Correctness=4']);
  assert.ok(validate('r2', noScore, { criteria, labels: ['P-A'] }).some((e) => /Risk missing/.test(e)));
  assert.ok(validate('r2', crit(['P-A'], ['Correctness=4 Risk=3']).replace(/^FINAL RANKING.*$/m, ''), { criteria, labels: ['P-A'] }).some((e) => /FINAL RANKING/.test(e)));
  assert.ok(validate('r3', '## Responses\n- I agree with the majority\n## Revised position\nswitch').some((e) => /majority/.test(e)));
  assert.deepEqual(validate('r3', '## Responses\n- A.F1: concede — add revalidate 60\n## Revised position\nISR with revalidate\n## Confidence: 4/5'), []);
});

test('council: full flow — blind R1, anonymised R2 packets without own proposal, R3 packet, tally without self-scores, record', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-council-'));
  const id = ok(run(dir, 'new', 'Next.js or Astro for a 2000-product catalogue?', '--seats', 'absolute-frontend,absolute-backend,absolute-product', '--tier', 'standard', '--criteria', 'Correctness:3,Risk:2'));
  assert.match(id, /^001-next-js-or-astro/);
  const tmp = join(dir, 'tmp.md');
  const seats = ['absolute-frontend', 'absolute-backend', 'absolute-product'];
  const pos = { 'absolute-frontend': 'Astro islands', 'absolute-backend': 'Next.js ISR', 'absolute-product': 'Shopify Hydrogen' };
  for (const s of seats) { writeFileSync(tmp, R1(pos[s], `as the ${s.replace('absolute-', '')} seat`)); ok(run(dir, 'save', id, 'r1', s, tmp)); }
  // R2 packet for frontend: two proposals, not its own, persona words stripped
  const pf = ok(run(dir, 'packet', id, 'r2', 'absolute-frontend'));
  const packet = readFileSync(pf, 'utf8');
  assert.ok(!packet.includes('Astro islands'), 'own proposal excluded');
  assert.ok(packet.includes('Next.js ISR') && packet.includes('Shopify Hydrogen'));
  assert.ok(!/frontend seat|backend seat|product seat/i.test(packet), 'persona words stripped');
  const state = JSON.parse(readFileSync(join(dir, '.planning', 'council', id, 'state.json'), 'utf8'));
  const anon = state.anon; const labelOf = (s) => anon[s];
  // critiques: each seat scores the other two
  const scores = { 'absolute-backend': 'Correctness=5 Risk=4', 'absolute-product': 'Correctness=2 Risk=2', 'absolute-frontend': 'Correctness=3 Risk=3' };
  for (const critic of seats) {
    const others = seats.filter((s) => s !== critic);
    writeFileSync(tmp, crit(others.map(labelOf), others.map((o) => scores[o])));
    ok(run(dir, 'save', id, 'r2', critic, tmp));
  }
  // an invalid save is stored but flagged
  writeFileSync(tmp, '### P-A\nFlaws:\n- [F1] (MINOR) x — y — z\nCredit: great\n');
  assert.equal(run(dir, 'save', id, 'r2', 'absolute-product', tmp).status, 1);
  writeFileSync(tmp, crit(seats.filter((s) => s !== 'absolute-product').map(labelOf), ['Correctness=3 Risk=3', 'Correctness=5 Risk=4']));
  ok(run(dir, 'save', id, 'r2', 'absolute-product', tmp));
  const t = ok(run(dir, 'tally', id));
  assert.match(t, new RegExp(`leader ${labelOf('absolute-backend')}`));
  const sj = JSON.parse(readFileSync(join(dir, '.planning', 'council', id, 'scores.json'), 'utf8'));
  for (const row of sj.rows) assert.equal(row.n, 2, 'each proposal scored by the two other seats only');
  // R3 packet: only critiques of own proposal
  const p3 = readFileSync(ok(run(dir, 'packet', id, 'r3', 'absolute-backend')), 'utf8');
  assert.match(p3, new RegExp(`Your proposal is ${labelOf('absolute-backend')}`));
  assert.match(p3, /Critic A/);
  // overlap: identical R1 text → theatrical
  const ov = JSON.parse(ok(run(dir, 'overlap', id)));
  assert.equal(ov.theatrical, true);
  // record with chair output
  writeFileSync(tmp, 'Verdict: CONVERGED\nDecision: Next.js ISR with per-category static pages and revalidate 60.\n');
  ok(run(dir, 'save', id, 'chair', 'absolute-chair', tmp));
  const rec = readFileSync(ok(run(dir, 'record', id)), 'utf8');
  assert.match(rec, /Status: DECIDED/);
  assert.match(rec, /## Credit ledger\n- P-/);
  assert.match(rec, /Next\.js ISR with per-category/);
  rmSync(dir, { recursive: true, force: true });
});

test('council: usage errors exit 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-council-'));
  assert.equal(run(dir, 'new', 'q').status, 2);
  assert.equal(run(dir, 'new', 'q', '--seats', 'a,a').status, 2);
  assert.equal(run(dir, 'tally', '999-none').status, 2);
  rmSync(dir, { recursive: true, force: true });
});
