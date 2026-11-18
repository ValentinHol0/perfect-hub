#!/usr/bin/env node
// product-score — 9-criteria product scorecard (0–100) with itemised deductions, fatal disqualifiers,
// a weak-link cap and anti-inflation checks. Zero dependencies, Node >= 18.
//
// Usage:
//   node scripts/product-score.mjs <scorecard.json> [--json]
//   cat scorecard.json | node scripts/product-score.mjs -
// Schema and rubric: skills/selling-product-audit/references/scorecard.md
// Exit codes: 0 = scored, 2 = invalid scorecard (the message says what to fix).

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CRITERIA = {
  C1: { name: 'Unit economics and margin resilience', weight: 0.2 },
  C2: { name: 'Marketplace and Temu price-parity resistance', weight: 0.15 },
  C3: { name: 'COD redemption and return hazard', weight: 0.15 },
  C4: { name: 'Creative hook and visual demonstrability', weight: 0.15 },
  C5: { name: 'Ad-policy safety', weight: 0.1 },
  C6: { name: 'Audience breadth and pain intensity', weight: 0.1 },
  C7: { name: 'Logistics, fragility and power autonomy', weight: 0.05 },
  C8: { name: 'Sourcing speed and scalability', weight: 0.05 },
  C9: { name: 'Cross-sell, upsell and LTV', weight: 0.05 },
};
const DEFAULT_THRESHOLDS = { minContribution: 150, minMarkup: 2.3, maxRefusal: 0.22, minPolicy: 30, minParity: 25, weakLink: 40 };
const r1 = (n) => Math.round(n * 10) / 10;

export function score(card) {
  if (!card || typeof card !== 'object' || !card.criteria) throw new Error('scorecard must have a "criteria" object with C1..C9');
  const th = { ...DEFAULT_THRESHOLDS, ...(card.thresholds || {}) };
  const errors = [];
  const rows = [];
  for (const [id, meta] of Object.entries(CRITERIA)) {
    const c = card.criteria[id];
    if (!c) { errors.push(`${id} missing`); continue; }
    if (typeof c.score !== 'number' || c.score < 0 || c.score > 100) { errors.push(`${id}.score must be 0–100`); continue; }
    const deductions = Array.isArray(c.deductions) ? c.deductions : [];
    const total = deductions.reduce((s, d) => s + (Number(d.points) || 0), 0);
    if (deductions.some((d) => !(Number(d.points) > 0) || !String(d.reason || '').trim())) errors.push(`${id}: every deduction needs points > 0 and a reason`);
    if (Math.abs(100 - total - c.score) > 1e-9) errors.push(`${id}: score ${c.score} ≠ 100 − deductions ${total} (itemise every lost point)`);
    if (c.score >= 95 && !String(c.evidence || '').trim()) errors.push(`${id}: a score of ${c.score} needs "evidence" (no unearned 95–100)`);
    rows.push({ id, name: meta.name, weight: meta.weight, score: c.score, weighted: Math.round(c.score * meta.weight * 100) / 100, deductions, evidence: c.evidence || null });
  }
  if (errors.length) { const e = new Error(errors.join('; ')); e.validation = errors; throw e; }

  const raw = rows.reduce((s, r) => s + r.score * r.weight, 0);
  const by = Object.fromEntries(rows.map((r) => [r.id, r.score]));
  const fatal = [];
  const ue = card.unitEconomics || {};
  if (typeof ue.contribution === 'number' && ue.contribution < th.minContribution) fatal.push(`margin collapse: contribution ${ue.contribution} per shipped order < ${th.minContribution}`);
  if (typeof ue.markup === 'number' && ue.markup < th.minMarkup) fatal.push(`margin collapse: markup ${ue.markup}x < ${th.minMarkup}x`);
  if (typeof ue.refusalRate === 'number' && ue.refusalRate > th.maxRefusal) fatal.push(`refusal hazard: projected COD refusal ${Math.round(ue.refusalRate * 1000) / 10}% > ${th.maxRefusal * 100}%`);
  if (by.C5 < th.minPolicy) fatal.push(`lethal policy risk: C5 ${by.C5} < ${th.minPolicy}`);
  if (by.C2 < th.minParity) fatal.push(`price-parity collapse: C2 ${by.C2} < ${th.minParity}`);
  for (const f of card.fatal || []) if (String(f).trim()) fatal.push(String(f));

  const weak = rows.filter((r) => r.score < th.weakLink).map((r) => r.id);
  let composite = r1(raw);
  let verdict;
  if (fatal.length) { composite = Math.min(composite, 40); verdict = 'STRICT NO-GO'; }
  else if (composite >= 75 && !weak.length) verdict = 'SCALABLE WINNER';
  else if (composite >= 60) { if (weak.length) composite = Math.min(composite, 74); verdict = 'CONDITIONAL PLAY'; }
  else verdict = 'NO-GO';

  return { product: card.product || null, raw: r1(raw), composite, verdict, fatal, weakLinks: weak, rows };
}

export function toMarkdown(res) {
  const out = [`### Scorecard${res.product ? ` — ${res.product}` : ''}`, '', '| # | Criterion | Weight | Score | Weighted | Deductions |', '|---|---|---:|---:|---:|---|'];
  for (const r of res.rows) {
    const ded = r.deductions.length ? r.deductions.map((d) => `−${d.points} ${d.reason}`).join('; ') : '—';
    out.push(`| ${r.id} | ${r.name} | ${Math.round(r.weight * 100)}% | ${r.score} | ${r.weighted} | ${ded} |`);
  }
  out.push('', `Raw weighted score: ${res.raw} · Composite: **${res.composite}/100** · Verdict: **${res.verdict}**`);
  if (res.fatal.length) out.push('', 'Fatal disqualifiers:', ...res.fatal.map((f) => `- ${f}`));
  if (res.weakLinks.length) out.push('', `Weak links (< 40, verdict capped at CONDITIONAL): ${res.weakLinks.join(', ')}`);
  return out.join('\n');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) { console.error('usage: node product-score.mjs <scorecard.json | -> [--json]'); process.exit(2); }
  try {
    const res = score(JSON.parse(file === '-' ? readFileSync(0, 'utf8') : readFileSync(file, 'utf8')));
    console.log(args.includes('--json') ? JSON.stringify(res, null, 2) : toMarkdown(res));
  } catch (e) {
    console.error(`product-score: ${e.message}`);
    process.exit(2);
  }
}
